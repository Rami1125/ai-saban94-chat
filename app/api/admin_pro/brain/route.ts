import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V55.0 - Brain with SQL Cart Memory
 * -------------------------------------------
 * - Context: Pulls current shopping_carts state before generating response.
 * - Logic: Seamlessly connects User Device ID to Database records.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // שימוש ב-Service Role לעקיפת הגבלות
);

const MODELS = ["gemini-1.5-pro", "gemini-1.5-flash"];

export async function POST(req: Request) {
  try {
    const { sessionId, query, history, customerId } = await req.json();

    // 1. שליפת קונטקסט משולש: פרופיל + מלאי + סל קניות נוכחי
    const [profileRes, inventoryRes, cartRes] = await Promise.all([
      supabase.from('vip_profiles').select('*').eq('id', customerId).maybeSingle(),
      supabase.from('inventory').select('*').or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`).limit(3),
      supabase.from('shopping_carts').select('*').eq('user_id', customerId)
    ]);

    const cartContext = cartRes.data?.map(item => `${item.product_name} (כמות: ${item.quantity})`).join(", ") || "ריק";

    const systemPrompt = `
      אתה המוח הלוגיסטי של ח. סבן. המנהל: ראמי הבוס.
      זהות לקוח: ${profileRes.data?.full_name || 'VIP Client'}.
      
      מצב סל קניות נוכחי של הלקוח: ${cartContext}.

      חוקי הזרקה (DNA):
      1. אם הלקוח שואל על מוצר במלאי, השתמש בתגיות:
         [GALLERY: url1, url2]
         [QUICK_ADD:SKU]
      2. אם המוצר כבר בסל, ציין זאת בחום ("אחי, כבר דאגנו לך לזה בסל...").
      3. פנה תמיד בגובה העיניים, מקצועי וחברי.
      חתימה: חבר תודה על הפניה, ח.סבן חומרי בנין. 🦾
    `.trim();

    // רוטציית מפתחות וביצוע פנייה ל-AI
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",");
    let finalAnswer = "מצטער אחי, יש נתק קטן ב-DNA. נסה שוב.";

    for (const key of apiKeys) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELS[0]}:generateContent?key=${key.trim()}`, {
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
