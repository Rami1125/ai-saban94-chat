import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// קליינט אדמין לעקיפת RLS - חובה להשתמש ב-SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// מפתח מוגדר ישירות - פשוט ונקי
const GOOGLE_API_KEY = process.env.GOOGLE_AI_KEY || "";
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

export async function POST(req: Request) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n🚀 [${timestamp}] --- התחלת הרצת מוח סבן (v12.5) ---`);

  try {
    const { sessionId, query, userName, history } = await req.json();
    console.log(`📝 שאילתה מ-${userName || 'אורח'}: "${query}"`);

    // 1. שליפת חוקי ה-DNA
    console.log("📡 שולף חוקים (ai_rules)...");
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('ai_rules')
      .select('instruction')
      .eq('is_active', true);

    if (rulesError) console.error("❌ שגיאה בשליפת חוקים:", rulesError.message);
    const educatorDNA = rules?.map(r => r.instruction).join("\n\n") || "";

    // 2. בניית System Prompt - אגרסיבי לביצוע
    const systemDNA = `
      זהות: המוח המבצע של ח. סבן. מנהל: ראמי.
      חוק ברזל: ברגע שנסגרת הזמנה/אספקה, חובה לסיים את התשובה בתג המדויק:
      [CREATE_ORDER:לקוח|סוג|מחסן|שעה|פרטים]
      דוגמה: [CREATE_ORDER:בר סטרומה 4|אספקה|ראשי|09:00|550 בלוק 20]
      חוק פחת: תמיד 10% פחת (40 מ"ר = 550 בלוקים). אל תשאל - תקבע.
      DNA נוסף: ${educatorDNA}
    `;

    // 3. פנייה ל-Gemini
    console.log("🤖 פונה ל-Gemini 1.5 Flash...");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemDNA 
    });

    const result = await model.generateContent(query);
    let aiText = result.response.text();
    console.log(`📝 תשובת ה-AI התקבלה:\n"${aiText.substring(0, 100)}..."`);

    // 4. המלשינון הלוגיסטי - ניתוח פקודות
    console.log("🔍 מחפש פקודת [CREATE_ORDER] בטקסט...");
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);

    if (createMatch) {
      console.log("✅ נמצאה פקודה! מפרק נתונים...");
      const parts = createMatch[1].split('|').map(s => s.trim());
      
      const orderData = {
        customer_name: parts[0] || userName || "לקוח כללי",
        container_action: parts[1] || "אספקה",
        warehouse_source: parts[2] || "ראשי",
        scheduled_time: parts[3] || "08:00",
        order_id_comax: parts[4] || "הזמנת AI",
        status: 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0],
        created_by: 'Saban AI Pro'
      };

      console.log("📡 מזריק ל-Database (saban_master_dispatch)...");
      const { data: inserted, error: dbError } = await supabaseAdmin
        .from('saban_master_dispatch')
        .insert([orderData])
        .select();

      if (dbError) {
        console.error("❌ כשל בהזרקה ל-DB:", dbError.message);
        console.error("❌ פרטי השגיאה המלאים:", JSON.stringify(dbError));
      } else {
        const newId = inserted?.[0]?.id;
        console.log(`🚀 הצלחה! הזמנה נוצרה בסידור. ID: ${newId}`);
        aiText = aiText.replace("TEMP_ID", newId);
      }
    } else {
      console.log("⚠️ המוח לא הוציא תג [CREATE_ORDER]. לא בוצעה הזרקה לסידור.");
    }

    // 5. שמירת היסטוריה
    console.log("💾 שומר היסטוריית צאט...");
    await supabaseAdmin.from('chat_history').insert([
      { session_id: sessionId, role: 'user', content: query },
      { session_id: sessionId, role: 'assistant', content: aiText }
    ]);

    console.log(`✨ [${timestamp}] סיום עיבוד מוצלח.`);
    return NextResponse.json({ answer: aiText });

  } catch (error: any) {
    console.error("💥 קריסת API קריטית:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
