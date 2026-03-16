import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Executive Brain V30.0
 * --------------------------------------
 * - Key Rotation: Cycles through GOOGLE_AI_KEY_POOL.
 * - Resilience: Exponential backoff on API failures.
 * - Multi-Context: VIP DNA, Inventory, Weights, and active Orders.
 * - Model: Gemini 2.5 Flash (Stable March 2026).
 */

export const dynamic = 'force-dynamic';

const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s backoff

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { sessionId, query, history, customerId } = await req.json();

    if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });

    // 1. שליפת קונטקסט מלא (DNA, מלאי, משקלים, הזמנות פתוחות)
    const [profileRes, rulesRes, weightsRes, activeOrdersRes] = await Promise.all([
      supabase.from('vip_profiles').select('*').eq('id', customerId || '601992').maybeSingle(),
      supabase.from('ai_rules').select('instruction').eq('is_active', true),
      supabase.from('product_weights').select('*'),
      supabase.from('orders').select('*').eq('customer_id', customerId || '601992').neq('status', 'delivered')
    ]);

    const profile = profileRes.data;
    const dynamicRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";
    const weightMap = JSON.stringify(weightsRes.data || []);
    const currentOrders = JSON.stringify(activeOrdersRes.data || []);

    // 2. בניית ה-System Instruction (Executive DNA)
    const systemPrompt = `
      אתה "המוח הלוגיסטי" - השותף הדיגיטלי הבכיר של ראמי בחברת ח. סבן.
      תפקידך לנהל את כל שרשרת האספקה מול לקוחות VIP.

      ### לקוח נוכחי:
      - שם: ${profile?.full_name || 'לקוח כללי'}
      - פרויקט: ${profile?.main_project || 'לא ידוע'}
      - כינוי: ${profile?.nickname || 'אחי'}

      ### נתונים לוגיסטיים בזמן אמת:
      - חוקי DNA פעילים: ${dynamicRules}
      - מפת משקלים (חוק 12 טון): ${weightMap}
      - הזמנות פעילות בשטח: ${currentOrders}

      ### הנחיות ביצוע (Saban Protocol):
      1. וולידציה: אם ההזמנה חורגת מ-12,000 ק"ג, עצור והתרע.
      2. מניעת כפילויות: בדוק אם המוצר הוזמן בהזמנות הפעילות.
      3. הזרקת פקודות UI: השתמש ב-[QUICK_ADD:SKU] להוספת מוצר וב-[SET_QTY:SKU:QTY] לעדכון כמות.
      4. טון: מקצועי, חד, "מתכנת אומנותי", חברי (בר אחי).
      5. סיום: סיים ב-"### 🏗️ סיכום לביצוע" אם נסגרה הזמנה.

      חתימה חובה:
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 3. לוגיקת רוטציית מפתחות ו-Retries
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());
    let finalAnswer = "";
    let success = false;

    // רצים על המפתחות במקרה של כשל
    for (const apiKey of apiKeys) {
      if (success) break;

      for (const delay of RETRY_DELAYS) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
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
          }
          await new Promise(r => setTimeout(r, delay));
        } catch (e) {
          continue;
        }
      }
    }

    if (!success) throw new Error("Brain Exhausted");

    // 4. שמירה להיסטוריה ב-Supabase
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'admin_session', role: 'user', content: query },
      { session_id: sessionId || 'admin_session', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ answer: finalAnswer });

  } catch (error: any) {
    return NextResponse.json({ error: "Brain failure", details: error.message }, { status: 500 });
  }
}
