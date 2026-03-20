import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SABAN OS PRO - V9.0 (Armor Edition)
 * -----------------------------------
 * - Bypass RLS: Using SUPABASE_SERVICE_ROLE_KEY
 * - Key Rotation: Prevents 429 Errors
 * - Wait Logic: Confirms DB update before response
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔥 חובה להגדיר ב-Vercel!
);

const STABLE_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro"];

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());
    
    // 1. שליפת שמות לקוחות קיימים לצורך התאמה מדויקת (Fuzzy Match Prevention)
    const { data: currentOrders } = await supabaseAdmin
      .from('saban_master_dispatch')
      .select('customer_name')
      .limit(15);
    
    const contextStr = currentOrders?.map(o => o.customer_name).join(", ") || "אין הזמנות";

    const systemPrompt = `
      אתה המוח הלוגיסטי של ח. סבן. המנהל: ראמי.
      שמות לקוחות בסידור כרגע (חובה לדייק בשמות!): ${contextStr}
      
      חוקי ביצוע (חובה להחזיר תג בסוף):
      - עדכון: [UPDATE_ORDER:לקוח|שדה|ערך] (שדה: סטטוס/נהג/שעה)
      - יצירה: [CREATE_ORDER:לקוח|שעה|נהג|מחסן|פעולה|כתובת]
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `;

    // 2. מנגנון Fallback & Rotation (פותר שגיאות 429)
    let aiResponseText = "";
    let successAI = false;

    for (const key of API_KEYS) {
      if (successAI) break;
      for (const model of STABLE_MODELS) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: query }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] }
            })
          });

          if (res.status === 429) continue; // מפתח חסום, נסה מפתח הבא
          if (!res.ok) continue; // מודל לא קיים (404), נסה מודל הבא

          const data = await res.json();
          aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiResponseText) { successAI = true; break; }
        } catch (e) { continue; }
      }
    }

    if (!successAI) return NextResponse.json({ answer: "ראמי, הקווים עמוסים מדי. נסה שוב בעוד דקה. 🦾" });

    // 3. לוגיקת ביצוע ב-SQL (Execution Layer)
    let sqlReport = "";
    const updateMatch = aiResponseText.match(/\[UPDATE_ORDER:(.*?)\|(.*?)\|(.*?)\]/);
    const createMatch = aiResponseText.match(/\[CREATE_ORDER:(.*?)\]/);

    // ביצוע עדכון (Update)
    if (updateMatch) {
      const [_, customer, field, newValue] = updateMatch;
      const mapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = mapping[field.trim()] || field.trim();

      const { data, error } = await supabaseAdmin
        .from('saban_master_dispatch')
        .update({ [dbField]: newValue.trim() })
        .ilike('customer_name', `%${customer.trim()}%`)
        .select();

      if (error) sqlReport = `❌ שגיאת SQL: ${error.message}`;
      else if (data && data.length > 0) sqlReport = `✅ עודכן בהצלחה בסידור!`;
      else sqlReport = `⚠️ לא נמצא לקוח בשם '${customer}' בסידור.`;
    }

    // ביצוע יצירה (Create)
    if (createMatch) {
      const [cust, time, driver, wh, act, addr] = createMatch[1].split('|').map(s => s.trim());
      const { error } = await supabaseAdmin.from('saban_master_dispatch').insert([{
        customer_name: cust,
        scheduled_time: time,
        driver_name: driver,
        warehouse_source: wh || "החרש (4)",
        container_action: act || "הובלה",
        address: addr,
        order_id_comax: `AI-${Math.floor(100000 + Math.random() * 900000)}`,
        status: (driver && driver !== 'לא שובץ') ? 'אושר להפצה' : 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0]
      }]);
      
      sqlReport = error ? `❌ יצירה נכשלה: ${error.message}` : `✅ הזמנה חדשה הופיעה בלוח!`;
    }

    // 4. החזרת תשובה סופית (רק אחרי שה-SQL הסתיים)
    return NextResponse.json({ 
      answer: `${aiResponseText}\n\n---\n**סינכרון SQL:** ${sqlReport}` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
