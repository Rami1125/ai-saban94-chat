// app/api/pro_brain/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// יצירת קליינט אדמין לעקיפת RLS וכתיבה לסידור
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || process.env.GOOGLE_AI_KEY || "").split(',').map(k => k.trim());
const STABLE_MODELS = ["gemini-1.5-flash", "gemini-3.1-flash-lite-preview"];

export async function POST(req: Request) {
  console.log("🚀 [PRO_BRAIN] Request received");
  try {
    const { sessionId, query, userName, history } = await req.json();

    if (!query) {
      console.error("❌ [PRO_BRAIN] Missing query");
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // 1. שליפת חוקי המוחות (Saban Master DNA)
    console.log("📡 Fetching AI Rules...");
    const { data: rules } = await supabaseAdmin.from('ai_rules').select('instruction').eq('is_active', true);
    const educatorDNA = rules?.map(r => r.instruction).join("\n\n") || "";

    const historyContext = history?.map((m: any) => `${m.role === 'user' ? 'לקוח' : 'עוזר'}: ${m.content}`).join("\n") || "";

    // 2. בניית ה-System Prompt
    const systemDNA = `
      זהות: המוח המשולב של ח. סבן. מנהל: ראמי. הלקוח הנוכחי: ${userName || 'אורח'}.
      חוקי ברזל:
      - בכל פעם שנסגרת הזמנה או בקשה לאספקה, חובה לסיים את התשובה עם התג: [CREATE_ORDER:לקוח|סוג|מחסן|שעה|פרטים].
      - דוגמה: [CREATE_ORDER:בר סטרומה 4|אספקה|ראשי|09:00|550 בלוק 20]
      - חובה להוסיף 10% פחת אוטומטית לכל חישוב.
      ${educatorDNA}
      היסטוריה: ${historyContext}
    `;

    // 3. יצירת תוכן ע"י ה-AI
    console.log("🤖 Sending to Gemini...");
    const genAI = new GoogleGenerativeAI(API_KEYS[0]);
    const model = genAI.getGenerativeModel({ 
      model: STABLE_MODELS[0], 
      systemInstruction: systemDNA 
    });
    
    const result = await model.generateContent(query);
    let aiText = result.response.text();
    console.log("📝 AI Response:", aiText);

    // 4. עיבוד פקודות והזרקה לסידור העבודה
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);

    if (createMatch) {
      console.log("✅ Found [CREATE_ORDER] tag! Extracting data...");
      const parts = createMatch[1].split('|').map(s => s.trim());
      
      const [customer, type, warehouse, time, details] = [
        parts[0] || userName || "לקוח כללי",
        parts[1] || "הובלה",
        parts[2] || "ראשי",
        parts[3] || "08:00",
        parts[4] || "הזמנת AI"
      ];

      console.log("📡 Injecting to saban_master_dispatch...");
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
          created_by: 'Saban AI Brain'
        }]).select();

      if (dbError) {
        console.error("❌ [DB_ERROR] Injection failed:", dbError.message);
      } else if (inserted?.[0]) {
        const realId = inserted[0].id;
        console.log("🚀 [SUCCESS] Order created in Dispatch with ID:", realId);
        // עדכון הלינק למעקב אם קיים TEMP_ID בטקסט
        aiText = aiText.replace("TEMP_ID", realId);
      }
    } else {
      console.log("⚠️ [LOG] No [CREATE_ORDER] tag found in AI response. Skipping DB injection.");
    }

    // 5. שמירת היסטוריית השיחה
    await supabaseAdmin.from('chat_history').insert([
      { session_id: sessionId, role: 'user', content: query },
      { session_id: sessionId, role: 'assistant', content: aiText }
    ]);
    
    return NextResponse.json({ answer: aiText });

  } catch (error: any) {
    console.error("💥 [CRITICAL_ERROR]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
