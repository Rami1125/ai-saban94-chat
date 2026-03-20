import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DISCOVERY_MATRIX = [
  { name: "gemini-2.0-flash-lite", versions: ["v1beta", "v1"] },
  { name: "gemini-1.5-flash-002", versions: ["v1"] }
];

export async function POST(req: Request) {
  try {
    const { query, history, customerId } = await req.json();

    const { data: allOrders } = await supabase
      .from('saban_master_dispatch')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const ordersContext = allOrders?.map(o => 
      `[${o.scheduled_time} | ${o.customer_name} | נהג: ${o.driver_name} | סטטוס: ${o.status}]`
    ).join("\n") || "אין הזמנות";

    const systemPrompt = `
      אתה המוח של ח. סבן. המנהל: ראמי.
      מצב נוכחי: ${ordersContext}
      חוקים: 
      1. פתיחה: [CREATE_ORDER:לקוח|שעה|נהג|מחסן|פעולה|כתובת]
      2. עדכון: [UPDATE_ORDER:לקוח|שדה|ערך] (שדה: סטטוס/נהג/שעה)
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    let finalAnswer = "";
    let success = false;
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());

    for (const entry of DISCOVERY_MATRIX) {
      if (success) break;
      for (const key of apiKeys) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${entry.name}:generateContent?key=${key}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: query }] }],
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

    if (!success) return NextResponse.json({ answer: "ראמי, המוח עמוס. נסה שוב. 🦾" });

    // --- לוגיקת ביצוע UPDATE ---
    const updateMatch = finalAnswer.match(/\[UPDATE_ORDER:(.*?)\]/);
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|');
      const fieldMapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = fieldMapping[field.trim()] || field.trim();

      await supabase
        .from('saban_master_dispatch')
        .update({ [dbField]: value.trim() })
        .ilike('customer_name', `%${customer.trim()}%`);
    }

    // --- לוגיקת ביצוע CREATE ---
    const orderMatch = finalAnswer.match(/\[CREATE_ORDER:(.*?)\]/);
    if (orderMatch) {
      const [cust, time, driver, wh, act, addr] = orderMatch[1].split('|');
      await supabase.from('saban_master_dispatch').insert([{
        customer_name: cust?.trim(),
        scheduled_time: time?.trim(),
        driver_name: driver?.trim(),
        warehouse_source: wh?.trim() || "החרש (4)",
        order_id_comax: `AI-${Math.floor(100000 + Math.random() * 900000)}`,
        status: (driver && driver.trim() !== 'לא שובץ') ? 'אושר להפצה' : 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0]
      }]);
    }

    return NextResponse.json({ answer: finalAnswer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
