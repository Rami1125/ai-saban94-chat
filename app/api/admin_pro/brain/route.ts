import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const MODEL_POOL = ["gemini-1.5-pro", "gemini-1.5-flash"];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || body.message || body.content;
    const { sessionId, history, phone } = body;

    if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });

    // 1. שליפת DNA: חוקים + מלאי + סל נוכחי של המשתמש
    const [{ data: rules }, { data: cartItems }] = await Promise.all([
      supabase.from('ai_rules').select('instruction').eq('is_active', true),
      supabase.from('shopping_carts').select('*').eq('user_id', sessionId)
    ]);

    const dna = rules?.map(r => r.instruction).join("\n") || "";
    const cartContext = cartItems?.length 
      ? `הסל הנוכחי של הלקוח: ${cartItems.map(i => `${i.product_name} (כמות: ${i.quantity})`).join(', ')}`
      : "הסל כרגע ריק.";

    // 2. בניית פרומפט מערכת - הבוס הוא ראמי
    const systemPrompt = `
      אתה המוח המנהל של Saban OS. ראמי הוא הבוס.
      חוקי DNA: ${dna}
      ${cartContext}
      הנחיות: ענה בעברית קצרה ומקצועית. אם הלקוח שואל על מוצר, עודד אותו להוסיף לסל.
      חתימה חובה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 3. רוטציה וביצוע (Failover Keys)
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 5);
    let finalAnswer = "";
    let success = false;

    for (const model of MODEL_POOL) {
      if (success) break;
      for (const apiKey of apiKeys) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאלה: ${query}` }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { temperature: 0.15 }
            })
          });
          const data = await res.json();
          if (res.ok) {
            finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            success = true; break;
          }
        } catch (e) { continue; }
      }
    }

    // 4. חיפוש מוצר לזיהוי כרטיס ויזואלי
    const { data: product } = await supabase.from('inventory').select('*').or(`product_name.ilike.%${query}%,sku.eq.${query}`).limit(1).maybeSingle();

    return NextResponse.json({ 
      answer: finalAnswer, 
      reply: finalAnswer, 
      product: product,
      success: true 
    });

  } catch (error: any) {
    return NextResponse.json({ reply: "ראמי, יש תקלה ברוטציה. אני בודק מפתחות. 🦾" }, { status: 200 });
  }
}
