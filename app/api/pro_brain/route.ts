import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

// מאגר מפתחות ורוטציה (הכנס את המפתחות שלך מופרדים בפסיק ב-ENV)
const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || process.env.GOOGLE_AI_KEY || "").split(',').map(k => k.trim());
// רשימת מודלים יציבים לפי עדכון מרץ 2026
const STABLE_MODELS = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash", "gemini-3.1-pro-preview"];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { sessionId, query, userName, history } = await req.json();

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // שמירת הודעת משתמש ב-DB
    await supabase.from('chat_history').insert([{ session_id: sessionId, role: 'user', content: query }]);

    const historyContext = history?.map((m: any) => `${m.role === 'user' ? 'לקוח' : 'עוזר'}: ${m.content}`).join("\n") || "";

    const systemDNA = `
      שם המותג: ח. סבן חומרי בניין. מנהל: ראמי.
      הנחיה: אתה מנהל מכירות מקצועי. ענה קצר, ממוקד, עם אימוג'ים לוגיסטיים.
      היסטוריה: ${historyContext}
      חתימה: תודה, ומה תרצה שנבצע היום? , הכל מוכן לביצוע. 🦾
    `;

    let lastError = null;

    // לוגיקת רוטציה: מנסים כל מפתח על המודל הכי יציב
    for (const key of API_KEYS) {
      if (!key) continue;
      
      for (const modelName of STABLE_MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemDNA });
          const result = await model.generateContent(query);
          const aiText = result.response.text();

          // שמירת תשובת ה-AI ב-DB
          await supabase.from('chat_history').insert([{ session_id: sessionId, role: 'assistant', content: aiText }]);

          return NextResponse.json({ answer: aiText, model: modelName });
        } catch (e: any) {
          lastError = e;
          console.warn(`Failed with model ${modelName} on current key. Trying next...`);
          continue; // עובר למודל הבא או למפתח הבא
        }
      }
    }

    throw new Error(`כל המפתחות והמודלים נכשלו. שגיאה אחרונה: ${lastError?.message}`);

  } catch (error: any) {
    console.error("Critical Brain Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
