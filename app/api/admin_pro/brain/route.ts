import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V55.3 - Cast Iron Brain Engine
 * -------------------------------------------
 * - Fix: Resolve 404 errors by updating model strings (2.0-flash stable).
 * - Fix: Multi-version API fallback (v1 & v1beta).
 * - Context: SQL Cart Memory + VIP Profile.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// רשימת מודלים מעודכנת ויציבה
const MODELS = [
  "gemini-2.0-flash", 
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro"
];

// גרסאות API לניסיון
const API_VERSIONS = ["v1", "v1beta"];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();

    if (!query) return NextResponse.json({ error: "No query provided" }, { status: 400 });

    // 1. שליפת קונטקסט (זהה לגרסה הקודמת)
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
      מצב סל קניות נוכחי ב-SQL: ${cartItems}.

      חוקי הזרקה (DNA):
      - הצעת מוצר: [GALLERY: url] [QUICK_ADD:SKU].
      - אם הפריט כבר בסל: "אחי, כבר שמרנו לך ${cartItems} לביצוע...".
      - טון: חברי ("אחי"), מקצועי, חד.
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // ניקוי מפתחות AI
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 10);

    if (apiKeys.length === 0) {
      console.error("Saban OS Error: Empty API Key Pool");
      return NextResponse.json({ answer: "אחי, המפתחות לא מוגדרים ב-Vercel. בדוק Environment Variables." });
    }

    let finalAnswer = "";
    let success = false;

    // רוטציה משולשת: גרסת API -> מודל -> מפתח
    for (const version of API_VERSIONS) {
      if (success) break;

      for (const model of MODELS) {
        if (success) break;

        for (const key of apiKeys) {
          try {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
            
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
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
              // לוג לצורך אבחון ב-Vercel
              console.warn(`Saban Brain: ${version}/${model} failed with key ***${key.slice(-4)}. Status: ${res.status}`);
            }
          } catch (e: any) {
            continue;
          }
        }
      }
    }

    if (!success) {
      return NextResponse.json({ 
        answer: "ראמי אחי, יש כרגע עומס זמני על מנועי ה-AI העולמיים (404/429). המערכת מבצעת חיבור מחדש, נסה לשלוח שוב בעוד כמה שניות. 🦾" 
      });
    }

    return NextResponse.json({ answer: finalAnswer });
  } catch (error: any) {
    console.error("Critical Brain Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
