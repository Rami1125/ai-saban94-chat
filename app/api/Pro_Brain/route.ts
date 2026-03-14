import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { sessionId, query, productContext } = await req.json();
    const supabase = getSupabase();

    // 1. שליפת היסטוריה אמיתית מה-DB
    const { data: history } = await supabase
      .from('chat_history')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    // 2. שמירת הודעת המשתמש ב-DB
    await supabase.from('chat_history').insert([
      { session_id: sessionId, role: 'user', content: query, product_context: productContext }
    ]);

    // 3. בניית ה-DNA עם ההיסטוריה שנשלפה
    const historyText = history?.map(m => `${m.role === 'user' ? 'לקוח' : 'עוזר'}: ${m.content}`).join("\n") || "";

    const systemDNA = `
      אתה מנהל המכירות המקצועי של ח. סבן. 
      היסטוריית שיחה נוכחית:
      ${historyText}

      הנחיות:
      - אם הלקוח שואל על מוצר, בדוק אם חסרה כמות. אם כן - שאל "כמה יחידות?".
      - הצע תמיד מוצרים משלימים (גבס -> ניצבים).
      - אל תנחש - אם ההקשר מההיסטוריה לא ברור, שאל שאלת הבהרה.
      - שמור על סגנון קצר, מקצועי וחותם בשם ראמי.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemDNA 
    });

    const result = await model.generateContent(query);
    const aiResponse = result.response.text();

    // 4. שמירת תגובת ה-AI ב-DB
    await supabase.from('chat_history').insert([
      { session_id: sessionId, role: 'assistant', content: aiResponse }
    ]);

    return NextResponse.json({ answer: aiResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
