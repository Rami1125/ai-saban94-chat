import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban OS V23.0 - Stable Dynamic Brain Engine
 * -------------------------------------------
 * - Strategy: Multi-Model Pool (1.5 Flash, 3.1 Flash Lite, 3.1 Pro).
 * - Resilience: Exponential backoff (1s, 2s, 4s, 8s, 16s).
 * - Context: Real-time VIP DNA Injection (Truck limits, History, Projects).
 */

export const dynamic = 'force-dynamic';

const STABLE_MODELS = [
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-1.5-flash"
];

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    
    // קבלת נתוני הבקשה
    const body = await req.json().catch(() => ({}));
    const { sessionId, query, history, customerId } = body;

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // 1. שליפת פרופיל הלקוח (DNA) - ברירת מחדל בר אורניל
    const targetId = customerId || '601992';
    const { data: profile } = await supabase
      .from('vip_profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    // 2. שליפת היסטוריית רכישות אחרונה למניעת כפילויות (48 שעות)
    const { data: recentOrders } = await supabase
      .from('vip_customer_history')
      .select('product_name, quantity, created_at')
      .eq('customer_id', targetId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. בניית ה-System Instruction המקצועי של ח. סבן
    const systemInstruction = `
      אתה המוח הלוגיסטי והשותף המבצע של "ח. סבן חומרי בניין". המנהל והסמכות העליונה שלך הוא ראמי.
      
      זהות הלקוח הנוכחי:
      - שם מלא: ${profile?.full_name || 'לקוח VIP'}
      - פרויקט פעיל: ${profile?.main_project || 'כללי'}
      - פנייה אישית: ${profile?.nickname || 'אחי'} (חובה להשתמש בכינוי זה).

      חוקי הבלמים והלוגיסטיקה (DNA מחייב):
      1. חוק ה-12 טון: המשאית של ח.סבן מוגבלת ל-12,000 ק"ג. בלה ממוצעת = 700 ק"ג (גג 18 בלות). אם הלקוח חורג - עצור אותו והסבר את סכנת הבטיחות והדו"ח.
      2. חוק מניעת כפילויות: היסטוריה אחרונה: ${JSON.stringify(recentOrders)}. אם המשתמש מזמין מוצר דומה שנקנה ביומיים האחרונים, שאל: "בר אחי, הזמנו את זה שלשום ל[פרויקט], אתה בטוח שצריך עוד?".
      3. יועץ שטח: גבס דורש ניצבים/מסלולים. מלט דורש חול. אל תהיה רק "לוקח הזמנות", וודא שלא חסר לו ציוד קצה לביצוע.

      סגנון וטון:
      - פתח בברכה חמה לפי הזמן (בוקר טוב/ערב טוב) ושם הלקוח.
      - היה מקצועי, חד, ותמציתי.
      - בסיום כל הזמנה, הפק "### 🏗️ סיכום הזמנה לביצוע" מעוצב עם מק"טים וכמויות.

      חתימה:
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    const apiKey = ""; // המפתח מוזרק בזמן ריצה ע"י הסביבה
    let finalAiText = "";
    let success = false;

    // 4. לוגיקת ריצה על בריכת המודלים עם Exponential Backoff
    for (const modelName of STABLE_MODELS) {
      if (success) break;

      for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          
          const payload = {
            contents: [{
              role: "user",
              parts: [{ text: `היסטוריית שיחה:\n${JSON.stringify(history || [])}\n\nבקשת הלקוח: ${query}` }]
            }],
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const result = await response.json();
            finalAiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (finalAiText) {
              success = true;
              break;
            }
          }
          
          // אם נכשל, נמתין לפי הדיליי המוגדר (Exponential Backoff)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        } catch (err) {
          if (attempt === RETRY_DELAYS.length - 1) break; // ניסיון אחרון נכשל
        }
      }
    }

    if (!success) {
      return NextResponse.json({ 
        answer: "בר אחי, המוח עמוס כרגע בחישובי משקלים. תן לי רגע לנשום ונסה שוב. 🦾" 
      });
    }

    // 5. תיעוד ההיסטוריה ב-Supabase
    if (sessionId) {
      await supabase.from('chat_history').insert([
        { session_id: sessionId, role: 'user', content: query },
        { session_id: sessionId, role: 'assistant', content: finalAiText }
      ]);
    }

    return NextResponse.json({ answer: finalAiText });

  } catch (error: any) {
    return NextResponse.json({ error: "שגיאת מערכת פנימית" }, { status: 500 });
  }
}
