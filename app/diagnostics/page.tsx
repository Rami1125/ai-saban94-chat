// app/api/pro_brain/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const logId = crypto.randomUUID();
  const start = Date.now();

  // פונקציית מלשינון פנימית - כותבת ל-DB בזמן אמת
  const report = async (step: string, data: any) => {
    console.log(`[LOG] ${step}:`, data); // גם לקונסולה של Vercel
    await supabaseAdmin.from('saban_debug_logs').insert([{
      log_id: logId,
      step: step,
      payload: data,
      duration: Date.now() - start
    }]);
  };

  try {
    const body = await req.json();
    // הלוג הכי חשוב: האם הבקשה בכלל הגיעה?
    await report("01_REQUEST_IN", { query: body.query, userName: body.userName });

    if (!process.env.GOOGLE_AI_KEY) {
      await report("ERROR_NO_KEY", { msg: "Missing GOOGLE_AI_KEY in Vercel" });
      throw new Error("Missing AI Key");
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      systemInstruction: "אתה המוח המבצע של סבן. פלוט תמיד: [CREATE_ORDER:לקוח|סוג|מחסן|שעה|פרטים]"
    });

    await report("02_AI_CALL", { status: "Sending to Google..." });

    const result = await model.generateContent(body.query);
    const aiText = result.response.text();
    
    await report("03_AI_RESPONSE", { text: aiText });

    // בדיקת פקודות הזרקה
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);
    if (createMatch) {
      await report("04_COMMAND_FOUND", { raw: createMatch[1] });
      const p = createMatch[1].split('|').map(s => s.trim());
      
      const { error: dbError } = await supabaseAdmin.from('saban_master_dispatch').insert([{
        customer_name: p[0],
        container_action: p[1] || "הובלה",
        warehouse_source: p[2] || "ראמי",
        scheduled_time: p[3] || "09:00",
        order_id_comax: p[4] || "הזמנת AI",
        status: 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0]
      }]);

      if (dbError) await report("05_DB_ERROR", { msg: dbError.message });
      else await report("05_DB_SUCCESS", { customer: p[0] });
    }

    return NextResponse.json({ answer: aiText });

  } catch (err: any) {
    await report("FATAL_ERROR", { msg: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
