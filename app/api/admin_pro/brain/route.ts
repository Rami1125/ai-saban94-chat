import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// מנוע אדמין חזק
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  const logId = crypto.randomUUID();
  const startTime = Date.now();

  // פונקציית מלשינון - כותבת ישר ל-DB
  const report = async (step: string, payload: any) => {
    await supabaseAdmin.from('saban_debug_logs').insert([{
      log_id: logId,
      step: step,
      payload: payload,
      duration: Date.now() - startTime
    }]);
  };

  try {
    const { query, userName } = await req.json();
    await report("START_BRAIN_PROCESS", { query, userName });

    // 1. פנייה ל-AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "אתה המוח של סבן. הזמנות נסגרות בתג [CREATE_ORDER:לקוח|סוג|מחסן|שעה|פרטים]."
    });

    const result = await model.generateContent(query);
    const aiText = result.response.text();
    await report("AI_RAW_OUTPUT", { text: aiText });

    // 2. הצינור לסידור (המלשין המרכזי)
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);
    if (createMatch) {
      await report("COMMAND_DETECTED", { command: createMatch[1] });
      const [customer, type, warehouse, time, details] = createMatch[1].split('|').map(s => s.trim());

      const { error: dbError } = await supabaseAdmin.from('saban_master_dispatch').insert([{
        customer_name: customer,
        container_action: type || "הובלה",
        warehouse_source: warehouse || "ראשי",
        scheduled_time: time || "09:00",
        order_id_comax: details,
        status: 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0]
      }]);

      if (dbError) await report("DISPATCH_INSERT_ERROR", { message: dbError.message });
      else await report("DISPATCH_SUCCESS", { id: customer });
    }

    return NextResponse.json({ answer: aiText });

  } catch (error: any) {
    await report("CRITICAL_CRASH", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
