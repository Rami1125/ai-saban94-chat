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
    
    // ✅ שינוי לכתובת V1 יציבה (פותר את שגיאת ה-Not Found)
    const MODEL_NAME = "gemini-1.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    if (!apiKey) return NextResponse.json({ error: "מפתח API חסר ב-Vercel", status: "FAILED_ENV" });

    // בדיקת קשר ל-SQL
    const { error: dbError } = await supabaseAdmin.from('saban_master_dispatch').select('customer_name').limit(1);
    const dbStatus = dbError ? `שגיאה: ${dbError.message}` : "מחובר תקין ✅";

    // פנייה למוח בכתובת המעודכנת
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        // הערה: ב-v1 הפורמט של system_instruction מעט שונה, נכניס אותו כחלק מהפרומפט לביטחון
        generationConfig: { temperature: 0.1 }
      }),
    });

    const aiData = await res.json();
    if (!res.ok) return NextResponse.json({ error: aiData.error?.message, status: "FAILED_GEMINI", dbStatus });

    const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // בדיקת פקודה וביצוע ב-SQL
    let executionResult = "לא זוהתה פקודה";
    const updateMatch = aiText.match(/\[UPDATE_ORDER:(.*?)\]/);
    
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      const mapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = mapping[field] || field;

      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('saban_master_dispatch')
        .update({ [dbField]: value })
        .ilike('customer_name', `%${customer}%`)
        .select();

      if (updateError) executionResult = `❌ כשל בעדכון: ${updateError.message}`;
      else if (updateData && updateData.length > 0) executionResult = `✅ בוצע בהצלחה ללקוח: ${customer}`;
      else executionResult = `⚠️ לקוח '${customer}' לא נמצא בטבלה.`;
    }

    return NextResponse.json({
      aiResponse: aiText,
      executionResult,
      dbStatus,
      latency: `${Date.now() - startTime}ms`,
      success: true
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, status: "CRITICAL_ERROR" }, { status: 500 });
  }
}
