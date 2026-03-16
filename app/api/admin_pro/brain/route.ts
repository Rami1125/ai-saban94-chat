import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Executive Brain V31.0 (Stable March 2026)
 * ---------------------------------------------------------
 * - Model Pool: Updated to Gemini 2.5 series (Flash & Pro).
 * - Key Rotation: Advanced cycle through GOOGLE_AI_KEY_POOL.
 * - Logic: Real-time context injection from DNA and Inventory.
 */

export const dynamic = 'force-dynamic';

// רשימת המודלים היציבים ביותר למרץ 2026
const MODEL_POOL = [
  "gemini-2.5-flash",      // המהיר והיציב ביותר לביצועים לוגיסטיים
  "gemini-2.5-pro",       // החכם ביותר לפתרון בעיות מורכבות
  "gemini-2.0-pro-exp-02-05" // מודל גיבוי חזק
];

const RETRY_DELAYS = [1000, 2000, 4000];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const { sessionId, query, history, customerId } = body;

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת קונטקסט (DNA, מלאי, משקלים, הזמנות)
    const targetId = customerId || '601992'; // ברירת מחדל בר אורניל
    
    const [profileRes, rulesRes, weightsRes, activeOrdersRes] = await Promise.all([
      supabase.from('vip_profiles').select('*').eq('id', targetId).maybeSingle(),
      supabase.from('ai_rules').select('instruction').eq('is_active', true),
      supabase.from('product_weights').select('*'),
      supabase.from('orders').select('*').eq('customer_id', targetId).neq('status', 'delivered')
    ]);

    const profile = profileRes.data;
    const dynamicRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";
    const weightMap = JSON.stringify(weightsRes.data || []);
    const currentOrders = JSON.stringify(activeOrdersRes.data || []);

    // 2. בניית ה-System DNA המעודכן
    const systemPrompt = `
      אתה "המוח הלוגיסטי" - השותף המבצע הבכיר של ראמי בחברת ח. סבן.
      
      ### לקוח VIP נוכחי:
      - שם: ${profile?.full_name || 'לקוח כללי'}
      - פרויקט: ${profile?.main_project || 'לא ידוע'}
      - כינוי: ${profile?.nickname || 'אחי'}

      ### חוקים ונתונים (DNA):
      ${dynamicRules}
      - מפת משקלים: ${weightMap}
      - הזמנות פתוחות בשטח: ${currentOrders}

      ### פרוטוקול ביצוע:
      1. חוק ה-12 טון: עצור חריגות מעל 12,000 ק"ג.
      2. מניעת כפילויות: בדוק היסטוריה מול הזמנות פתוחות.
      3. פקודות UI: הזרק [QUICK_ADD:SKU] או [SET_QTY:SKU:QTY] כשיש החלטה על מוצר.
      4. טון: מקצועי, חד, "מתכנת אומנותי", חברי.

      חתימה חובה:
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 3. לוגיקת רוטציית מפתחות וסבב מודלים
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 5);
    
    if (apiKeys.length === 0) throw new Error("API Keys Pool is empty");

    let finalAnswer = "";
    let success = false;

    // ניסיון ראשון עם המודל האופטימלי, ואז גיבוי
    for (const modelName of MODEL_POOL) {
      if (success) break;

      for (const apiKey of apiKeys) {
        if (success) break;

        for (const delay of RETRY_DELAYS) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ 
                    role: "user", 
                    parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] 
                  }],
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  generationConfig: { temperature: 0.1, topP: 0.8 }
                })
              }
            );

            if (response.ok) {
              const data = await response.json();
              finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (finalAnswer) {
                success = true;
                break;
              }
            } else if (response.status === 429) {
              // חריגת מכסה - עובר למפתח הבא
              break; 
            }
            
            await new Promise(r => setTimeout(r, delay));
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (!success) throw new Error("All models and keys failed to respond.");

    // 4. רישום להיסטוריה
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'admin_session', role: 'user', content: query },
      { session_id: sessionId || 'admin_session', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ answer: finalAnswer });

  } catch (error: any) {
    console.error("Brain System Error:", error.message);
    return NextResponse.json({ 
      error: "תקלה במוח הלוגיסטי", 
      details: error.message 
    }, { status: 500 });
  }
}
