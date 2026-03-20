import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.GOOGLE_AI_KEY; // מפתח יחיד!

    if (!apiKey) {
      return NextResponse.json({ answer: "ראמי אחי, חסר מפתח API ב-Vercel. 🦾" });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: "אתה המוח של ח. סבן. לעדכון: [UPDATE_ORDER:לקוח|שדה|ערך]" }] }
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Gemini Error:", data);
      return NextResponse.json({ error: data.error?.message || "Gemini Failed" }, { status: res.status });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // לוגיקת עדכון SQL (נשארת זהה)
    let sqlReport = "לא זוהתה פקודה";
    const updateMatch = aiText.match(/\[UPDATE_ORDER:(.*?)\]/);
    
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      const mapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = mapping[field] || field;

      const { data: dbData, error } = await supabaseAdmin
        .from('saban_master_dispatch')
        .update({ [dbField]: value })
        .ilike('customer_name', `%${customer}%`)
        .select();

      if (error) sqlReport = `❌ שגיאה: ${error.message}`;
      else if (dbData && dbData.length > 0) sqlReport = `✅ עודכן ב-SQL: ${customer}`;
      else sqlReport = `⚠️ לקוח '${customer}' לא נמצא.`;
    }

    return NextResponse.json({ 
      answer: aiText,
      sqlReport: sqlReport 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
