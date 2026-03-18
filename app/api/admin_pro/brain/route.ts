import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V55.1 - Brain with SQL Cart Memory
 * -------------------------------------------
 * - Context: Reliable SQL lookup for user_id.
 * - Logic: Multi-Model rotation with error handling.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MODELS = ["gemini-2.0-flash-exp", "gemini-1.5-pro"];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();

    // 1. שליפת קונטקסט מלא: פרופיל + מלאי + סל קיים
    const [inventoryRes, cartRes, profileRes] = await Promise.all([
      supabase.from('inventory').select('*').or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`).limit(3),
      supabase.from('shopping_carts').select('*').eq('user_id', customerId),
      supabase.from('vip_profiles').select('*').eq('id', customerId).maybeSingle()
    ]);

    const cartItems = cartRes.data?.map(i => `${i.product_name} (x${i.quantity})`).join(", ") || "ריק";
    const profile = profileRes.data;

    const systemPrompt = `
      אתה המוח הלוגיסטי של ח. סבן. המנהל: ראמי הבוס.
      זהות לקוח: ${profile?.full_name || 'VIP Client'}.
      פרויקט פעיל: ${profile?.main_project || 'כללי'}.
      
      מצב סל קניות נוכחי של הלקוח ב-Database: ${cartItems}.

      חוקי הזרקה (DNA):
      - הצעת מוצר: [GALLERY: url] [QUICK_ADD:SKU].
      - אם הפריט כבר בסל: "אחי, כבר שמרנו לך ${cartItems} לביצוע...".
      - טון: חברי ("אחי"), מקצועי, חד.
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());
    let finalAnswer = "מצטער אחי, יש נתק קטן ב-DNA המערכת. נסה שוב.";

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
