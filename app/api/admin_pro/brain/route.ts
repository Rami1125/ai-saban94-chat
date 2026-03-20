import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V57.1 - Execution Core Brain
 * -------------------------------------------
 * - Logistics: Auto-inserts to saban_requests & inventory_transfers.
 * - Discovery Mode: Robust key rotation & model probing.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DISCOVERY_MATRIX = [
  { name: "gemini-2.0-flash-lite", versions: ["v1beta", "v1"] },
  { name: "gemini-1.5-flash-002", versions: ["v1", "v1beta"] },
  { name: "Gemini 3.1 Flash-Lite", versions: ["v1", "v1beta"] },
  { name: "gemini-1.5-pro", versions: ["v1beta", "v1"] },
  { name: "gemini-2.0-flash-lite-preview-02-05", versions: ["v1beta"] }
];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת קונטקסט (מלאי, סל ופרופיל)
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

      יכולות ביצוע (DNA):
      1. פתיחת הזמנה: אם המשתמש מבקש לפתוח הזמנה/סידור, החזר בתגובה: [CREATE_ORDER:customer_name|hour|driver_name].
      2. העברה בין סניפים: אם מבקשים להעביר סחורה, החזר: [TRANSFER:item_name|qty|from_branch|to_branch].
      3. הזרקת מוצר: [GALLERY: url] [QUICK_ADD:SKU].

      חוקים:
      - אם המוצר כבר בסל: "אחי, כבר דאגנו לזה בסל...".
      - ענה בעברית חדה, מקצועית וישירה.
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
                generationConfig: { temperature: 0.15, maxOutputTokens: 800 }
              })
            });

            if (res.ok) {
              const data = await res.json();
              finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (finalAnswer) {
                success = true;
                break;
              }
            } else if (res.status === 429) continue;
            else if (res.status === 404) break;
          } catch (e) { continue; }
        }
      }
    }

    if (!success) {
      return NextResponse.json({ answer: "ראמי אחי, יש כרגע עומס במנועי ה-AI. נסה שוב בעוד כמה שניות. 🦾" });
    }

    // 4. לוגיקת ביצוע (Execution Logic) - כתיבה לטבלאות SQL
    
    // א. זיהוי פתיחת הזמנה
const orderMatch = finalAnswer.match(/\[CREATE_ORDER:(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/);
if (orderMatch) {
  const [_, customer, time, driver, warehouse, action] = orderMatch;
  
  await supabase.from('saban_master_dispatch').insert([{
    customer_name: customer.trim(),
    scheduled_time: time.trim(),
    driver_name: driver.trim(),
    warehouse_source: warehouse.trim(),
    container_action: action.trim(),
    status: driver.trim() === 'לא שובץ' ? 'פתוח' : 'אושר להפצה',
    scheduled_date: new Date().toISOString().split('T')[0], // תאריך של היום
    created_by: 'AI_BRAIN',
    order_id_comax: `AI-${Math.floor(1000 + Math.random() * 9000)}`
  }]);
}

    // ב. זיהוי העברה בין סניפים
    const transferMatch = finalAnswer.match(/\[TRANSFER:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/);
    if (transferMatch) {
      const [_, item, qty, fromB, toB] = transferMatch;
      await supabase.from('inventory_transfers').insert([{
        item_name: item.trim(),
        quantity: parseInt(qty),
        from_branch: fromB.trim(),
        to_branch: toB.trim(),
        status: 'scheduled',
        created_at: new Date()
      }]);
    }

    return NextResponse.json({ answer: finalAnswer });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
