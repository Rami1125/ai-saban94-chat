import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content.trim();

    // 1. חיפוש ב-Knowledge Base (מידע כללי, נהלים, שאלות נפוצות)
    const { data: knowledge } = await supabase
      .from('saban_unified_knowledge')
      .select('content, title')
      // שימוש ב-ilike לחיפוש גמיש יותר
      .or(`title.ilike.%${lastUserMessage}%,content.ilike.%${lastUserMessage}%`)
      .limit(1);

    if (knowledge && knowledge.length > 0) {
      return NextResponse.json({ text: knowledge[0].content });
    }

    // 2. חיפוש ב-Inventory (נתונים טכניים מה-SQL שהעלית)
    const { data: product } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${lastUserMessage}%,sku.ilike.%${lastUserMessage}%`)
      .limit(1);

    if (product && product.length > 0) {
      const p = product[0];
      
      // בניית תשובה טכנית עשירה מהנתונים שהזרקנו
      let response = `מצאתי פרטים על <b>${p.product_name}</b> (מק"ט: ${p.sku}):<br/><br/>`;
      
      if (p.description) response += `${p.description}<br/><br/>`;
      if (p.drying_time) response += `• <b>זמן ייבוש:</b> ${p.drying_time}<br/>`;
      if (p.coverage) response += `• <b>כושר כיסוי:</b> ${p.coverage}<br/>`;
      if (p.features && p.features.length > 0) {
        response += `• <b>תכונות בולטות:</b> ${p.features.join(", ")}<br/>`;
      }
      if (p.youtube_url) {
        response += `<br/><a href="${p.youtube_url}" target="_blank" style="color: #2563eb; font-weight: bold;">צפה בסרטון הדרכה 🎥</a>`;
      }

      return NextResponse.json({ text: response });
    }

    // 3. חיפוש ב-Answers Cache (תשובות מוכנות)
    const { data: cached } = await supabase
      .from('answers_cache')
      .select('answer_text')
      .ilike('question_text', `%${lastUserMessage}%`)
      .limit(1);

    if (cached && cached.length > 0) {
      return NextResponse.json({ text: cached[0].answer_text });
    }

    // 4. אם לא נמצא כלום - הודעת ברירת מחדל (אפשר להוסיף כאן קריאה ל-Gemini כגיבוי)
    return NextResponse.json({ 
      text: "מצטער, לא מצאתי מידע מדויק במאגר לגבי '" + lastUserMessage + "'. האם תרצה שאעביר אותך לנציג אנושי של ח. סבן או שאנסה לחפש שוב לפי שם מוצר אחר?" 
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "שגיאת מערכת בשליפת נתונים" }, { status: 500 });
  }
}
