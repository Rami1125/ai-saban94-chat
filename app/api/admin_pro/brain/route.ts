import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// שימוש ב-Admin Client לעקיפת RLS (פותר את ה-401)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());
    
    // ✅ שימוש במודל אחד יציב בלבד (פותר את ה-404 וה-429 הכפול)
    const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    let aiText = "";
    let success = false;

    // מנגנון Fallback על מפתחות בלבד (בדיוק לפי ההמלצה)
    for (const key of API_KEYS) {
      try {
        const res = await fetch(`${MODEL_URL}?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: query }] }],
            systemInstruction: { parts: [{ text: "אתה המוח של ח. סבן. לעדכון: [UPDATE_ORDER:לקוח|שדה|ערך]" }] }
          }),
        });

        if (res.status === 429) continue; // מפתח חסום? עוברים למפתח הבא באותו מודל
        if (!res.ok) throw new Error(`Gemini API Error`);

        const data = await res.json();
        aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (aiText) { success = true; break; }
      } catch (err) { continue; }
    }

    if (!success) return NextResponse.json({ answer: "ראמי, יש עומס זמני על ה-API. נסה שוב בעוד רגע. 🦾" });

    // --- ביצוע העדכון ב-SQL (עם AWAIT מלא) ---
    const updateMatch = aiText.match(/\[UPDATE_ORDER:(.*?)\]/);
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      const mapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = mapping[field] || field;

      await supabaseAdmin
        .from('saban_master_dispatch')
        .update({ [dbField]: value })
        .ilike('customer_name', `%${customer}%`);
    }

    return NextResponse.json({ answer: aiText });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
