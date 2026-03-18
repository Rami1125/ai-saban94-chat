import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V55.0 - Master Brain (SQL Cart Integration)
 * -------------------------------------------
 * - Context: Pulls data from public.shopping_carts before generating response.
 * - Precision: Uses customerId as user_id for row isolation.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // שימוש ב-Service Role לעקיפת RLS בשרת
);

const MODELS = ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite-preview"];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();

    // 1. שליפת קונטקסט: מלאי + סל קניות נוכחי מהטבלה החדשה
    const [inventoryRes, cartRes, profileRes] = await Promise.all([
      supabase.from('inventory').select('*').or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`).limit(3),
      supabase.from('shopping_carts').select('*').eq('user_id', customerId),
      supabase.from('vip_profiles').select('*').eq('id', customerId).maybeSingle()
    ]);

    const cartContext = cartRes.data?.map(i => `${i.product_name} (x${i.quantity})`).join(", ") || "ריק";
    const profile = profileRes.data;

    const systemPrompt = `
      אתה המוח הלוגיסטי של ח. סבן. המנהל: ראמי הבוס.
      זהות לקוח: ${profile?.full_name || 'VIP Client'} | פרויקט: ${profile?.main_project || 'כללי'}
      
      מצב סל קניות נוכחי ב-SQL: ${cartContext}.

      חוקי הזרקה (DNA):
      1. אם הלקוח מבקש מוצר קיים, הזרק תגיות:
         [GALLERY: url1, url2]
         [QUICK_ADD:SKU]
      2. אם פריט כבר בסל, ציין זאת בחום ("אחי, כבר שמרנו לך ${cartContext} בסל").
      3. טון דיבור: מקצועי, חברי ("אחי"), חד.
      חתימה:תודה, הכל מוכן לביצוע. 🦾
    `.trim();

    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());
    let finalAnswer = "מצטער אחי, יש נתק קטן ב-DNA. נסה שוב.";

    for (const key of apiKeys) {
      if (!key) continue;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELS[0]}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: query }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });
      if (res.ok) {
        const data = await res.json();
        finalAnswer = data.candidates[0].content.parts[0].text;
        break;
      }
    }

    return NextResponse.json({ answer: finalAnswer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
