// app/api/pro_brain/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// יצירת קליינט אדמין עם Service Role לעקיפת RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || process.env.GOOGLE_AI_KEY || "").split(',').map(k => k.trim());
const STABLE_MODELS = ["gemini-1.5-flash", "gemini-3.1-flash-lite-preview"];

export async function POST(req: Request) {
  console.log("🚀 [PRO_BRAIN] מתחיל עיבוד בקשה חדשה...");
  try {
    const { sessionId, query, userName, history } = await req.json();

    if (!query) {
      console.error("❌ [PRO_BRAIN] חסרה שאילתה (query)");
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // 1. שליפת DNA מחוקי המוח
    console.log("📡 שולף חוקי DNA מ-Supabase...");
    const { data: rules } = await supabaseAdmin.from('ai_rules').select('instruction').eq('is_active', true);
    const educatorDNA = rules?.map(r => r.instruction).join("\n\n") || "";

    const historyContext = history?.map((m: any) => `${m.role === 'user' ? 'לקוח' : 'עוזר'}: ${m.content}`).join("\n") || "";

    // 2. בניית System Prompt קשוח לביצוע
    const systemDNA = `
      זהות: המוח המבצע של ח. סבן. מנהל: ראמי.
      חוק ברזל מבצעי:
      בכל פעם שאתה מאשר הזמנה, אספקה או פינוי, חובה עליך לכלול בסוף התשובה את התג הבא בדיוק:
      [CREATE_ORDER:שם_לקוח|סוג_פעולה|מחסן|שעה|פרטים_טכניים]
      
      דוגמה: [CREATE_ORDER:בר סטרומה 4|אספקה|ראשי|09:00|550 בלוק 20]
      
      חוק פחת: הוסף 10% פחת אוטומטית (40 מ"ר = 550 בלוקים).
      ${educatorDNA}
      היסטוריה קודמת: ${historyContext}
    `;

    // 3. יצירת תוכן מול Gemini
    console.log("🤖 פונה ל-Gemini...");
    const genAI = new GoogleGenerativeAI(API_KEYS[0]);
    const model = genAI.getGenerativeModel({ 
      model: STABLE_MODELS[0], 
      systemInstruction: systemDNA 
    });
    
    const result = await model.generateContent(query);
    let aiText = result.response.text();
    console.log("📝 תשובת ה-AI הגולמית:", aiText);

    // 4. המנוע המבצע: איתור תגים והזרקה לסידור
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);

    if (createMatch) {
      console.log("✅ נמצא תג CREATE_ORDER! מתחיל חילוץ נתונים...");
      const parts = createMatch[1].split('|').map(s => s.trim());
      
      const [customer, type, warehouse, time, details] = [
        parts[0] || userName || "לקוח כללי",
        parts[1] || "הובלה",
        parts[2] || "ראשי",
        parts[3] || "08:00",
        parts[4] || "הזמנת AI"
      ];

      console.log(`📡 מזריק לטבלה: לקוח: ${customer}, שעה: ${time}, פרטים: ${details}`);

      const { data: inserted, error: dbError } = await supabaseAdmin
        .from('saban_master_dispatch')
        .insert([{
          customer_name: customer,
          container_action: type,
          warehouse_source: warehouse,
          scheduled_time: time,
          order_id_comax: details,
          status: 'פתוח',
          scheduled_date: new Date().toISOString().split('T')[0],
          created_by: 'Saban AI Pro Brain'
        }]).select();

      if (dbError) {
        console.error("❌ [שגיאת DB] ההזרקה נכשלה:", dbError.message);
      } else if (inserted?.[0]) {
        const realId = inserted[0].id;
        console.log("🚀 [הצלחה] הזמנה נוצרה בסידור עם מזהה:", realId);
        // החלפת TEMP_ID בטקסט אם קיים
        aiText = aiText.replace("TEMP_ID", realId);
      }
    } else {
      console.log("⚠️ [לוג] לא נמצא תג [CREATE_ORDER] בתשובה. לא תבוצע הזרקה ל-DB.");
    }

    // 5. שמירת תיעוד בצאט
    await supabaseAdmin.from('chat_history').insert([
      { session_id: sessionId, role: 'assistant', content: aiText }
    ]);
    
    return NextResponse.json({ answer: aiText });

  } catch (error: any) {
    console.error("💥 [קריסה קריטית]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
