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

    // 1. שליפת כל ההזמנות הקיימות מהטבלה לצורך קונטקסט (שליפה אונליין)
    const { data: allOrders } = await supabase
      .from('saban_master_dispatch')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const ordersContext = allOrders?.map(o => 
      `[${o.scheduled_time} | ${o.customer_name} | נהג: ${o.driver_name} | סטטוס: ${o.status}]`
    ).join("\n") || "אין הזמנות פעילות";

    const systemPrompt = `
      אתה המוח של ח. סבן. המנהל: ראמי הבוס.
      
      מצב הזמנות נוכחי ב-SQL:
      ${ordersContext}

      חוקי שליטה:
      - פתיחת הזמנה: החזר [CREATE_ORDER:לקוח|שעה|נהג|מחסן|פעולה|כתובת]
      - שליפת נתון: אם ראמי שואל "מה הסטטוס", ענה לו על סמך רשימת ההזמנות למעלה.
      - ענה בטקסט בולט (Black), חד ומקצועי.
      חתימה: ראמי, הכל מסונכרן ב-100%. 🦾
    `.trim();

    // 2. הפעלת ה-AI (Discovery Loop)
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
              generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            success = true;
            break;
          }
        } catch (e) { continue; }
      }
    }

// זיהוי הפקודה מהמוח
const orderMatch = finalAnswer.match(/\[CREATE_ORDER:(.*?)\]/);

if (orderMatch) {
  const params = orderMatch[1].split('|');
  // חילוץ פרמטרים (תמיכה ב-5 או 6 פרמטרים)
  const [customer, time, driver, warehouse, action, address] = params;

  // הזרקה לטבלת המאסטר עם ערכי ברירת מחדל לשדות חובה
  const { data, error } = await supabase.from('saban_master_dispatch').insert([{
    customer_name: customer?.trim() || "לקוח כללי",
    scheduled_time: time?.trim() || "08:00",
    driver_name: driver?.trim() || "לא שובץ",
    warehouse_source: warehouse?.trim() || "החרש (4)",
    container_action: action?.trim() || "הובלה",
    address: address?.trim() || "לא צוינה",
    // יצירת מספר קומקס חובה כדי שה-DB לא יחסום
    order_id_comax: `AI-${Math.floor(100000 + Math.random() * 900000)}`,
    // קביעת סטטוס לפי הנהג
    status: (driver && driver.trim() !== 'לא שובץ' && driver.trim() !== 'לעדכן') ? 'אושר להפצה' : 'פתוח',
    scheduled_date: new Date().toISOString().split('T')[0],
    created_by: 'SABAN_AI_BRAIN'
  }]);

  if (error) {
    console.error("❌ שגיאת SQL:", error.message);
  } else {
    console.log("✅ הזמנה נרשמה בהצלחה ב-Master Dispatch");
  }
}
