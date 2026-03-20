import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ סעיף 4: שימוש ב-Service Role (עוקף 401 ו-RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());
    
    // ✅ סעיף 2: מודל אחד קבוע ויציב (מונע 404)
    const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    let aiText = "";
    let success = false;

    // ✅ סעיף 3: מנגנון Fallback על מפתחות בלבד (מונע 429 כפול)
    for (const key of API_KEYS) {
      try {
        const res = await fetch(`${MODEL_URL}?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: query }] }],
            systemInstruction: { parts: [{ text: "אתה המוח של ח. סבן. פקודות: [UPDATE_ORDER:לקוח|שדה|ערך] או [CREATE_ORDER:לקוח|שעה|נהג|מחסן|פעולה|כתובת]" }] }
          }),
        });

        if (res.status === 429) continue; // Rate Limit? עוברים למפתח הבא
        if (!res.ok) continue;

        const data = await res.json();
        aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (aiText) { success = true; break; }
      } catch (err) { continue; }
    }

    if (!success) return NextResponse.json({ answer: "ראמי, כל מפתחות ה-API בעומס. נסה שוב בעוד דקה. 🦾" });

    // ✅ סעיף 6: תיקון מנגנון UPDATE_ORDER + המתנה ל-SQL (await)
    let executionLog = "";
    const updateMatch = aiText.match(/\[UPDATE_ORDER:(.*?)\]/);
    
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      const mapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = mapping[field] || field;

      const { data, error } = await supabaseAdmin
        .from('saban_master_dispatch')
        .update({ [dbField]: value })
        .ilike('customer_name', `%${customer}%`)
        .select();

      if (error) executionLog = `❌ שגיאה: ${error.message}`;
      else if (data && data.length > 0) executionLog = `✅ עודכן ב-SQL: ${customer} -> ${value}`;
      else executionLog = `⚠️ לקוח '${customer}' לא נמצא.`;
    }

    // ✅ סעיף 5: כתיבה להיסטוריה דרך השרת (מונע 401 מהדפדפן)
    await supabaseAdmin.from('saban_brain_history').insert([{
      user_query: query,
      ai_response: aiText,
      status: executionLog.includes('✅') ? 'success' : 'logged'
    }]).catch(() => console.log("History log failed, continuing..."));

    return NextResponse.json({ answer: `${aiText}\n\n---\n**סינכרון Saban-OS:** ${executionLog}` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
