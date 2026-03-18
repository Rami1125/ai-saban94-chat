import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V57.0 - Discovery Core Brain
 * -------------------------------------------
 * - Discovery Mode: Automatically probes v1/v1beta and various model names.
 * - Resilience: Instant key rotation on 429 and intelligent skip on 404.
 * - Context: Full SQL Cart & Inventory integration.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// מטריצת המודלים לסריקה (ממויינת לפי מהירות ויציבות)
const DISCOVERY_MATRIX = [
  { name: "gemini-2.0-flash", versions: ["v1beta", "v1"] },
  { name: "gemini-1.5-flash", versions: ["v1", "v1beta"] },
  { name: "gemini-1.5-flash-8b", versions: ["v1", "v1beta"] },
  { name: "gemini-1.5-pro", versions: ["v1beta", "v1"] },
  { name: "gemini-2.0-flash-lite-preview-02-05", versions: ["v1beta"] }
];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת קונטקסט (זהה ל-V56)
    const [inventoryRes, cartRes, profileRes] = await Promise.all([
      supabase.from('inventory').select('*').or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`).limit(3),
      supabase.from('shopping_carts').select('*').eq('user_id', customerId),
      supabase.from('vip_profiles').select('*').eq('id', customerId).maybeSingle()
    ]);

    const cartContext = cartRes.data?.map(i => `${i.product_name} (x${i.quantity})`).join(", ") || "ריק";
    const profile = profileRes.data;

    const systemPrompt = `
      אתה המוח הלוגיסטי של ח. סבן. המנהל: ראמי הבוס.
      זהות לקוח: ${profile?.full_name || 'לקוח VIP'}.
      פרויקט: ${profile?.main_project || 'כללי'}.
      מצב סל ב-SQL: ${cartContext}.

      חוקי הזרקה (DNA):
      - מוצר: [GALLERY: url] [QUICK_ADD:SKU].
      - אם בסל: "אחי, כבר דאגנו לזה בסל...".
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. הכנת בריכת מפתחות נקייה
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 10);

    let finalAnswer = "";
    let success = false;

    // 3. אלגוריתם הזרקה רב-שכבתי (Discovery Loop)
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
                generationConfig: { temperature: 0.15, maxOutputTokens: 800 }
              })
            });

            if (res.ok) {
              const data = await res.json();
              finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (finalAnswer) {
                console.log(`Saban Brain Discovery: Worked with ${entry.name} (${version})`);
                success = true;
                break;
              }
            } else if (res.status === 429) {
              console.warn(`Saban Brain: Key ***${key.slice(-4)} Quota Exceeded. Rotating...`);
              continue; // מנסה מפתח אחר לאותו מודל
            } else if (res.status === 404) {
              // המודל לא קיים בגרסה הזו - דלג לגרסה/מודל הבא
              break; 
            } else {
              const errJson = await res.json();
              console.error(`Saban Brain: ${entry.name} Status ${res.status}:`, errJson.error?.message);
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (!success) {
      return NextResponse.json({ 
answer: "ראמי אחי, יש כרגע 'חסימת עורקים' במנועי ה-AI העולמיים. סרקתי את כל הנתיבים והם עמוסים. נסה לשלוח שוב בעוד 10 שניות, אני מאפס את המערכת. 🦾"      });
    }

    return NextResponse.json({ answer: finalAnswer });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
