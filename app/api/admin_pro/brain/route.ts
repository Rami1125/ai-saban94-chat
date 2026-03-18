import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban OS V46.1 - Precision Master Brain
 * -------------------------------------------
 * Fix: Forced clean tag output for Elite Cards.
 * Context: VIP Profile + Real-time Inventory lookup.
 */

export const dynamic = 'force-dynamic';

const MODELS = ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite-preview"];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { sessionId, query, history, customerId } = await req.json().catch(() => ({}));

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת קונטקסט (לקוח, חוקים, מלאי)
    const [profileRes, rulesRes, inventoryRes] = await Promise.all([
      supabase.from('vip_profiles').select('*').eq('id', customerId).maybeSingle(),
      supabase.from('ai_rules').select('*').eq('is_active', true),
      supabase.from('inventory').select('*').or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`).limit(3)
    ]);

    const profile = profileRes.data;
    const rules = rulesRes.data?.map(r => r.instruction).join("\n") || "";
    const inventory = inventoryRes.data || [];

    const systemPrompt = `
      אתה המוח הלוגיסטי של ח. סבן. המנהל: ראמי הבוס.
      
      ### זהות לקוח VIP:
      - שם: ${profile?.full_name || 'לקוח'} | פרויקט: ${profile?.main_project || 'כללי'}

      ### נתוני מלאי אמת:
      ${JSON.stringify(inventory)}

      ### חוקי ביצוע Elite (חובה):
      בכל פעם שאתה מציע מוצר שקיים במלאי, חובה להתחיל את התגובה במבנה התגיות הבא ללא רווחים מיותרים:
      [GALLERY: image_url, image_url_2, image_url_3]
      [QUICK_ADD:SKU]

      ${rules}

      ### דגשים:
      - אם חסר נתון טכני, רשום "--". 
      - פנה ללקוח בשמו (למשל: "בר אחי").
      - חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 5);
    let finalAnswer = "";
    let success = false;

    for (const model of MODELS) {
      if (success) break;
      for (const key of apiKeys) {
        if (success) break;
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { temperature: 0.1 }
            })
          });
          if (res.ok) {
            const data = await res.json();
            finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (finalAnswer) { success = true; break; }
          }
        } catch (e) { continue; }
      }
    }

    if (!success) throw new Error("Brain Link Failure");

    // תיעוד לחדר הבקרה
    await supabase.from('chat_history').insert([
      { session_id: customerId || 'guest', role: 'user', content: query },
      { session_id: customerId || 'guest', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ answer: finalAnswer, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
