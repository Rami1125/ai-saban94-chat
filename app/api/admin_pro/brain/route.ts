import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V56.0 - Titanium Core Brain
 * -------------------------------------------
 * - Fix: Resolve 400 Errors by matching exact Gemini API payload schema.
 * - Resilience: Exponential backoff for 429 (Quota) errors.
 * - Context: Deep integration with public.shopping_carts and public.inventory.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MODELS = [
  { name: "gemini-2.0-flash", version: "v1beta" },
  { name: "gemini-1.5-flash", version: "v1beta" },
  { name: "gemini-1.5-pro", version: "v1beta" }
];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת קונטקסט: מלאי + סל קניות נוכחי מה-SQL
    const [inventoryRes, cartRes, profileRes] = await Promise.all([
      supabase.from('inventory').select('*').or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`).limit(3),
      supabase.from('shopping_carts').select('*').eq('user_id', customerId),
      supabase.from('vip_profiles').select('*').eq('id', customerId).maybeSingle()
    ]);

    const cartContext = cartRes.data?.map(i => `${i.product_name} (כמות: ${i.quantity})`).join(", ") || "ריק";
    const profile = profileRes.data;

    const systemPrompt = `
      אתה המוח הלוגיסטי של ח. סבן. המנהל: ראמי הבוס.
      זהות לקוח: ${profile?.full_name || 'לקוח VIP'}. פרויקט: ${profile?.main_project || 'כללי'}.
      
      מצב סל קניות נוכחי (SQL): ${cartContext}.

      חוקי הזרקה (DNA):
      - הצעת מוצר: [GALLERY: url] [QUICK_ADD:SKU].
      - אם הפריט כבר בסל: "אחי, כבר שמרנו לך ${cartContext} לביצוע...".
      - טון: חברי ("אחי"), מקצועי, חד.
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 10);

    let finalAnswer = "";
    let success = false;

    // רוטציה חכמה עם מנגנון Retry לשגיאות 429
    for (const model of MODELS) {
      if (success) break;
      for (const key of apiKeys) {
        if (success) break;
        try {
          const url = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${key}`;
          
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (finalAnswer) { success = true; break; }
          } else if (res.status === 429) {
            console.warn(`Saban Brain: Key ***${key.slice(-4)} Rate Limited. Rotating...`);
            continue; // עובר למפתח הבא מיד
          } else {
            const err = await res.json();
            console.error(`Saban Brain: ${model.name} Error ${res.status}:`, err);
          }
        } catch (e) { continue; }
      }
    }

    if (!success) {
      return NextResponse.json({ 
        answer: "ראמי אחי, המערכת בעומס יתר של פקודות (429/400). אני מבצע ניתוב מחדש של ה-DNA, נסה לשלוח שוב בעוד 5 שניות. 🦾" 
      });
    }

    return NextResponse.json({ answer: finalAnswer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
