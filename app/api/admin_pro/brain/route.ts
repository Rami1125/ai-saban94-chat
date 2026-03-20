import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // וודא שזה מוגדר ב-Vercel!
);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim());
    
    // מודלים יציבים בלבד למניעת 404/429
    const modelName = "gemini-1.5-flash";

    let finalAnswer = "";
    let success = false;

    // ניסיון הרצה מול מאגר המפתחות
    for (const key of apiKeys) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: query }] }],
            systemInstruction: { parts: [{ text: "אתה המוח של ח. סבן. לעדכון השתמש ב: [UPDATE_ORDER:לקוח|שדה|ערך]" }] }
          })
        });

        if (res.ok) {
          const data = await res.json();
          finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (finalAnswer) { success = true; break; }
        }
      } catch (e) { continue; }
    }

    if (!success) return NextResponse.json({ answer: "ראמי, הקווים עמוסים. נסה שוב. 🦾" });

    // --- ביצוע הפעולה ב-SQL ---
    const updateMatch = finalAnswer.match(/\[UPDATE_ORDER:(.*?)\]/);
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      const mapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = mapping[field] || field;

      await supabase
        .from('saban_master_dispatch')
        .update({ [dbField]: value })
        .ilike('customer_name', `%${customer}%`);
    }

    // --- ניסיון כתיבה להיסטוריה (עטוף ב-Try כדי שלא יפיל את התשובה) ---
    try {
      await supabase.from('saban_brain_history').insert([{
        user_query: query,
        ai_response: finalAnswer,
        model_used: modelName,
        status: 'success'
      }]);
    } catch (e) { console.log("History log failed, but update continued."); }

    return NextResponse.json({ answer: finalAnswer });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
