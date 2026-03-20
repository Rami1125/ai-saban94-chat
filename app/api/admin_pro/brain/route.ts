import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { query } = await req.json();
    const apiKey = process.env.GOOGLE_AI_KEY;
    const MODEL_NAME = "gemini-3.1-flash-lite-preview";
    const WHATSAPP_GROUP = "+972508860896";

    if (!apiKey) return NextResponse.json({ error: "Missing API Key" });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: `אתה המוח של ח. סבן. 
          1. לעדכון קיים: [UPDATE_ORDER:לקוח|שדה|ערך] (שדות: סטטוס, נהג, שעה, מחסן).
          2. ליצירת פינוי פסולת: [CREATE_WASTE_ORDER:לקוח|פעולה|מחסן|שעה|קומקס]. פעולה: הצבה/החלפה/הוצאה. מחסן: שארק (30)/כראדי (32)/שי שרון (40).
          ענה קצר, מקצועי ובסוף הצע לשתף לקבוצה.` }] }
      }),
    });

    const aiData = await res.json();
    const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let executionResult = "LOGGED";
    let shareLink = "";

    // לוגיקה 1: יצירת הזמנת פסולת
    const createMatch = aiText.match(/\[CREATE_WASTE_ORDER:(.*?)\]/);
    if (createMatch) {
      const [customer, action, warehouse, time, comax] = createMatch[1].split('|').map(s => s.trim());
      const { error } = await supabaseAdmin.from('saban_master_dispatch').insert([{
        customer_name: customer, container_action: action, warehouse_source: warehouse,
        scheduled_time: time, order_id_comax: comax || "999", driver_name: "פינוי פסולת",
        status: "פתוח", scheduled_date: new Date().toISOString().split('T')[0]
      }]);
      if (!error) {
        executionResult = `✅ נוצרה הזמנת ${action}: ${customer}`;
        shareLink = `https://wa.me/${WHATSAPP_GROUP}?text=${encodeURIComponent(`🚚 *ח. סבן - הזמנה חדשה*\n👤 לקוח: ${customer}\n♻️ פעולה: ${action}\n🏗 אתר: ${warehouse}\n⏰ שעה: ${time}`)}`;
      }
    }

    // לוגיקה 2: עדכון קיים
    const updateMatch = aiText.match(/\[UPDATE_ORDER:(.*?)\]/);
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      const mapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time', 'מחסן': 'warehouse_source' };
      const { data } = await supabaseAdmin.from('saban_master_dispatch').update({ [mapping[field] || field]: value }).ilike('customer_name', `%${customer}%`).select();
      if (data?.length) executionResult = `✅ עודכן: ${customer}`;
    }

    // שמירה להיסטוריה
    await supabaseAdmin.from('saban_brain_history').insert([{ user_query: query, ai_response: aiText, execution_status: executionResult }]);

    return NextResponse.json({ aiResponse: aiText, executionResult, shareLink, latency: `${Date.now() - startTime}ms` });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
