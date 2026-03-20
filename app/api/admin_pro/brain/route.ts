import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V58.0 - Master Dispatch Integration
 * -------------------------------------------
 * - Target Table: saban_master_dispatch
 * - Validation: Ensures all NOT NULL columns are filled.
 * - Realtime: Triggers instant UI update in Dispatch Studio.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DISCOVERY_MATRIX = [
  { name: "gemini-2.0-flash-lite", versions: ["v1beta", "v1"] },
  { name: "gemini-1.5-flash-002", versions: ["v1", "v1beta"] },
  { name: "Gemini 3.1 Flash-Lite", versions: ["v1", "v1beta"] },
  { name: "gemini-1.5-pro", versions: ["v1beta", "v1"] }
];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת קונטקסט (מלאי, סל ופרופיל)
    const [rulesRes, profileRes] = await Promise.all([
      supabase.from('saban_brain_rules').select('rule_description').eq('is_active', true),
      supabase.from('vip_profiles').select('*').eq('id', customerId).maybeSingle()
    ]);

    const activeRules = rulesRes.data?.map(r => r.rule_description).join("\n") || "";
    const profile = profileRes.data;

    const systemPrompt = `
      אתה המוח הלוגיסטי של ח. סבן. המנהל: ראמי הבוס.
      זהות לקוח נוכחי: ${profile?.full_name || 'לקוח VIP'}.

      חוקים פעילים מתוך ספר החוקים:
      ${activeRules}

      פרוטוקול פקודות לביצוע (חובה):
      - פתיחת הזמנה: החזר [CREATE_ORDER:לקוח|שעה|נהג|מחסן|פעולה|כתובת]
      - העברה: החזר [TRANSFER:מוצר|כמות|מקור|יעד]

      הנחיה חשובה: השדות 'לקוח', 'מספר קומקס' ו'נהג' הם חובה ב-DB. 
      אם חסר לך מספר קומקס, המערכת תייצר אחד אוטומטית.
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. הכנת בריכת מפתחות
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 10);

    let finalAnswer = "";
    let success = false;

    // 3. Discovery Loop (רוטציה חכמה)
    for (const entry of DISCOVERY_MATRIX) {
      if (success) break;
      for (const version of entry.versions) {
        if (success) break;
        for (const key of apiKeys) {
          if (success) break;
          try {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${entry.name}:generateContent?key=${key}`;
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
              })
            });

            if (res.ok) {
              const data = await res.json();
              finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (finalAnswer) {
                success = true;
                break;
              }
            }
          } catch (e) { continue; }
        }
      }
    }

    if (!success) return NextResponse.json({ answer: "ראמי אחי, המוח עמוס. נסה שוב בעוד רגע. 🦾" });

    // 4. לוגיקת ביצוע מול saban_master_dispatch
const orderMatch = finalAnswer.match(/\[CREATE_ORDER:(.*?)\]/);
if (orderMatch) {
    const params = orderMatch[1].split('|');
    const [customer, time, driver, warehouse, action, address] = params;

    await supabase.from('saban_master_dispatch').insert([{
        customer_name: customer?.trim() || "לקוח כללי",
        scheduled_time: time?.trim() || "08:00",
        driver_name: driver?.trim() || "לא שובץ",
        warehouse_source: warehouse?.trim() || "כללי",
        container_action: action?.trim() || "הובלה",
        address: address?.trim() || "לא צוינה",
        order_id_comax: `AI-${Math.floor(100000 + Math.random() * 900000)}`,
        status: (driver && driver.trim() !== 'לא שובץ') ? 'אושר להפצה' : 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0]
    }]);

      if (error) console.error("DB Insert Error:", error.message);
    }

    return NextResponse.json({ answer: finalAnswer });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
