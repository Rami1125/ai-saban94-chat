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

    // 3. בניית ה-DNA הוויזואלי (Premium UI Framework)
    const systemDNA = `
      זהות: המוח הלוגיסטי והמעצב של ח. סבן חומרי בניין. המנהל: ראמי הבוס.
      טון: מקצועי, יוקרתי, לוגיסטי.

      ### חוקי המחנך (Educator DNA):
      ${educatorDNA}

      ### חוקי עיצוב פרימיום (Visual OS):
      1. **סיכום הזמנה (WhatsApp Trigger)**: בכל פעם שיש סיכום עסקה, השתמש בכותרת "### 📋 סיכום הזמנה לביצוע". זה יפעיל אוטומטית את כפתור ה-WhatsApp הירוק בממשק.
      2. **שימוש באימוג'ים**: השתמש באימוג'ים מקצועיים בלבד (🏗️, 📦, ⚖️, 🚚, ✅, 📍) בתחילת שורות.
      3. **כרטיסי מוצר**: אם מדובר במוצר ספציפי, השורה הראשונה חייבת להיות תמונה: ![שם](URL).
      4. **טקסט מודגש**: הדגש כמויות ונתונים טכניים בעזרת **[טקסט]**.
      5. **מבנה נקי**: השתמש ב-Code Blocks (\`\`\`) רק עבור נתונים יבשים או רשימות ארוכות כדי לתת מראה של אפליקציית ניהול.

      ### היסטוריה:
      ${historyContext}

      ### דוגמה לפורמט סיכום פרימיום:
      ### 📋 סיכום הזמנה לביצוע
      **פריטים שנבחרו:**
      * 🏗️ **15** לוחות גבס ירוק (3 מטר)
      * 📦 **10** שקי מלט
      
      **פרטי הובלה:**
      * 🚚 משאית מנוף (חכמת)
      * 📍 יעד: [כתובת הלקוח]
      
      חתימה: תודה, ומה תרצה שנבצע היום? ראמי, הכל מוכן לביצוע. 🦾
    `;

    let lastError = null;
    for (const key of API_KEYS) {
      if (!key) continue;
      for (const modelName of STABLE_MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(key);
          const model = genAI.getGenerativeModel({ 
            model: modelName, 
            systemInstruction: systemDNA 
          });
          
          const result = await model.generateContent(query);
          const aiText = result.response.text();

          // שמירת תגובת המוח ל-DB
          await supabase.from('chat_history').insert([{ session_id: sessionId, role: 'assistant', content: aiText }]);
          
          return NextResponse.json({ answer: aiText, model: modelName });
        } catch (e: any) {
          lastError = e;
          continue;
        }
      }
    }
    throw new Error(`כל המפתחות נכשלו: ${lastError?.message}`);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
