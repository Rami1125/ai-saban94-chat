// app/api/pro_brain/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const logId = crypto.randomUUID();
  const start = Date.now();
  
  // פונקציית מלשינון פנימית
  const report = async (step: string, data: any) => {
    console.log(`[${step}]`, data);
    await supabaseAdmin.from('saban_debug_logs').insert([{
      log_id: logId,
      step,
      payload: data,
      duration: Date.now() - start
    }]);
  };

  try {
    const { query, history, userName } = await req.json();
    await report("REQUEST_RECEIVED", { query, userName });

    // 1. שליפת DNA
    const { data: rules } = await supabaseAdmin.from('ai_rules').select('*').eq('is_active', true);
    await report("DNA_FETCHED", { rulesCount: rules?.length });

    // 2. פנייה ל-AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(query);
    const aiText = result.response.text();
    await report("AI_RESPONSE_GENERATED", { aiText: aiText.substring(0, 100) });

    // 3. חקירת פקודות (הצינור לסידור)
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);
    if (createMatch) {
      await report("ORDER_DETECTED", { raw: createMatch[1] });
      const parts = createMatch[1].split('|').map(s => s.trim());
      
      const { error: dbError } = await supabaseAdmin.from('saban_master_dispatch').insert([{
        customer_name: parts[0],
        container_action: parts[1],
        warehouse_source: parts[2],
        scheduled_time: parts[3],
        order_id_comax: parts[4],
        status: 'פתוח'
      }]);

      if (dbError) await report("DB_INSERT_ERROR", { error: dbError.message });
      else await report("ORDER_INJECTED_SUCCESS", { customer: parts[0] });
    }

    return NextResponse.json({ answer: aiText });
  } catch (err: any) {
    await report("CRITICAL_CRASH", { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
