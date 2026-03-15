import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || process.env.GOOGLE_AI_KEY || "").split(',').map(k => k.trim());
const STABLE_MODELS = ["gemini-1.5-flash", "gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { sessionId, query, userName, history } = await req.json();

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת חוקים מה"מחנך" (ai_rules)
    const { data: rules } = await supabase.from('ai_rules').select('instruction').eq('is_active', true);
    const educatorDNA = rules?.map(r => r.instruction).join("\n\n") || "";

    // 2. שמירת הודעת משתמש למוניטור
    await supabase.from('chat_history').insert([{ session_id: sessionId, role: 'user', content: query }]);

    const historyContext = history?.map((m: any) => `${m.role === 'user' ? 'לקוח' : 'עוזר'}: ${m.content}`).join("\n") || "";

    const systemDNA = `
      זהות: המוח הלוגיסטי של ח. סבן חומרי בניין. מנהל: ראמי הבוס.
      
      ### חוקי המחנך (Educator DNA):
      ${educatorDNA}

      ### היסטוריה:
      ${historyContext}

      ### הנחיות עיצוב (UI/UX):
      - תמונה: ![שם המוצר](URL) - תמיד בשורה הראשונה אם יש מוצר.
      - כותרת: ### [שם נושא]
      - הדגשה: **[טקסט חשוב]**
      - בסיום הזמנה: כתוב תמיד את המילה "סיכום הזמנה" כדי להפעיל את כפתור ה-WhatsApp.
      
      חתימה: תודה, ומה תרצה שנבצע היום?, הכל מוכן לביצוע. 🦾
    `;

    let lastError = null;
    for (const key of API_KEYS) {
      if (!key) continue;
      for (const modelName of STABLE_MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemDNA });
          const result = await model.generateContent(query);
          const aiText = result.response.text();

          await supabase.from('chat_history').insert([{ session_id: sessionId, role: 'assistant', content: aiText }]);
          return NextResponse.json({ answer: aiText, model: modelName });
        } catch (e: any) {
          lastError = e;
          continue;
        }
      }
    }
    throw new Error(`Rotation failed: ${lastError?.message}`);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
