import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  const logId = crypto.randomUUID();
  const start = Date.now();

  const report = async (step: string, data: any) => {
    await supabaseAdmin.from('saban_debug_logs').insert([{
      log_id: logId, step, payload: data, duration: Date.now() - start
    }]);
  };

  try {
    const body = await req.json();
    await report("01_REQ_RECEIVED", { query: body.query });

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");
    
    // שינוי שם המודל לגרסה המעודכנת ביותר כדי למנוע 404
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: "אתה המוח של סבן. פלוט תמיד בסוף: [CREATE_ORDER:לקוח|סוג|מחסן|שעה|פרטים]"
    });

    console.log("🤖 Asking Gemini 1.5 Flash Latest...");
    const result = await model.generateContent(body.query);
    const aiText = result.response.text();
    await report("02_AI_GENERATED", { aiText });

    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);
    if (createMatch) {
      await report("03_ORDER_FOUND", { raw: createMatch[1] });
      const p = createMatch[1].split('|').map(s => s.trim());
      
      const { error: dbErr } = await supabaseAdmin.from('saban_master_dispatch').insert([{
        customer_name: p[0], 
        container_action: p[1] || "אספקה", 
        warehouse_source: p[2] || "ראשי",
        scheduled_time: p[3] || "09:00", 
        order_id_comax: p[4] || "הזמנת AI", 
        status: 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0]
      }]);

      if (dbErr) await report("04_DB_ERROR", { msg: dbErr.message });
      else await report("04_DB_SUCCESS", { customer: p[0] });
    }

    return NextResponse.json({ answer: aiText });
  } catch (err: any) {
    console.error("Critical Error:", err.message);
    await report("ERROR_FATAL", { msg: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
