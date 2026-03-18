import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V55.2 - Bulletproof Brain Engine
 * -------------------------------------------
 * - Context: SQL Cart Memory + VIP Profile.
 * - Resilience: Multi-Model & Multi-Key full rotation.
 * - Debug: Detailed error logging for Vercel environment.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MODELS = ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();

    if (!query) return NextResponse.json({ error: "No query provided" }, { status: 400 });

    // 1. שליפת קונטקסט מלא: פרופיל + מלאי + סל קיים מהטבלה החדשה
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

    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 10);

    if (apiKeys.length === 0) {
      console.error("Saban OS Error: No API Keys found in GOOGLE_AI_KEY_POOL");
      return NextResponse.json({ answer: "אחי, המערכת לא מוגדרת עם מפתחות AI. בדוק את ה-Environment Variables." });
    }

    let finalAnswer = "";
    let success = false;

    // רוטציה כפולה: מנסים כל מודל מול כל מפתח עד שמצליחים
    for (const model of MODELS) {
      if (success) break;

      for (const key of apiKeys) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { temperature: 0.2, topP: 0.8, maxOutputTokens: 1024 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (finalAnswer) {
              success = true;
              break;
            }
          } else {
            const errData = await res.json();
            console.warn(`Saban Brain Warning: Model ${model} failed with key ***${key.slice(-4)}. Status: ${res.status}`, errData);
          }
        } catch (e: any) {
          console.error(`Saban Brain Fetch Error: ${e.message}`);
          continue;
        }
      }
    }

    if (!success) {
      return NextResponse.json({ 
        answer: "מצטער אחי, כל מנועי ה-AI עמוסים או שהמפתחות הגיעו למכסה. נסה שוב בעוד דקה. 🦾" 
      });
    }

    return NextResponse.json({ answer: finalAnswer });
  } catch (error: any) {
    console.error("Critical Brain Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
