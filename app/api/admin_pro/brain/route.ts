import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. יצירת Client "על-חלל" (עוקף RLS בשרת בלבד)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔥 המפתח הסודי שלך ב-Vercel
);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // 2. ניהול מפתחות Gemini (Rotation & Fallback)
    const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());
    const MODEL = "gemini-1.5-flash"; // מודל יציב בלבד (מונע 404)

    let aiText = "";
    let success = false;

    for (let i = 0; i < API_KEYS.length; i++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEYS[i]}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: query }] }],
            systemInstruction: { parts: [{ text: "אתה המוח של ח. סבן. לעדכון: [UPDATE_ORDER:לקוח|שדה|ערך]" }] }
          }),
        });

        if (res.status === 429) continue; // אם המפתח חסום, דלג לבא
        if (!res.ok) throw new Error(`Gemini Error: ${res.status}`);

        const data = await res.json();
        aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (aiText) { success = true; break; }
      } catch (err) { continue; }
    }

    if (!success) return NextResponse.json({ answer: "ראמי, כל הקווים תפוסים. נסה בעוד דקה. 🦾" });

    // 3. לוגיקת ביצוע חכמה (Execution Layer)
    let executionStatus = "";
    const updateMatch = aiText.match(/\[UPDATE_ORDER:(.*?)\|(.*?)\|(.*?)\]/);

    if (updateMatch) {
      const [_, customer, fieldLabel, newValue] = updateMatch;
      const mapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = mapping[fieldLabel.trim()] || fieldLabel.trim();

      // 🔥 מחכים ל-DB באמת (await)
      const { data, error } = await supabaseAdmin
        .from('saban_master_dispatch')
        .update({ [dbField]: newValue.trim() })
        .ilike('customer_name', `%${customer.trim()}%`)
        .select();

      if (error) {
        executionStatus = `❌ שגיאת SQL: ${error.message}`;
      } else if (data && data.length > 0) {
        executionStatus = `✅ עודכן בהצלחה ב-SQL!`;
      } else {
        executionStatus = `⚠️ לקוח '${customer}' לא נמצא בטבלה.`;
      }
    }

    // 4. החזרת תשובה רק אחרי סיום הפעולה
    return NextResponse.json({ 
      answer: `${aiText}\n\n---\n**סטטוס ביצוע:** ${executionStatus}` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
