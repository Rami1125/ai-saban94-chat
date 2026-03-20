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
    const model = "gemini-1.5-flash";

    // 1. בדיקת מפתח
    if (!apiKey) return NextResponse.json({ error: "מפתח API חסר ב-Vercel", status: "FAILED_ENV" });

    // 2. בדיקת קשר ל-SQL (שליפת לקוחות לדוגמה)
    const { data: testDb, error: dbError } = await supabaseAdmin.from('saban_master_dispatch').select('customer_name').limit(1);
    const dbStatus = dbError ? `שגיאה: ${dbError.message}` : "מחובר תקין ✅";

    // 3. פנייה למוח
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: "אתה המוח של ח. סבן. לעדכון: [UPDATE_ORDER:לקוח|שדה|ערך]" }] }
      }),
    });

    const aiData = await res.json();
    if (!res.ok) return NextResponse.json({ error: aiData.error?.message, status: "FAILED_GEMINI", dbStatus });

    const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // 4. בדיקת פקודה וביצוע ב-SQL
    let executionResult = "לא זוהתה פקודה";
    const updateMatch = aiText.match(/\[UPDATE_ORDER:(.*?)\]/);
    
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('saban_master_dispatch')
        .update({ [field === 'סטטוס' ? 'status' : field]: value })
        .ilike('customer_name', `%${customer}%`)
        .select();

      if (updateError) executionResult = `❌ כשל בעדכון: ${updateError.message}`;
      else if (updateData && updateData.length > 0) executionResult = `✅ בוצע בהצלחה ללקוח: ${customer}`;
      else executionResult = `⚠️ פקודה זוהתה, אך הלקוח '${customer}' לא נמצא בטבלה.`;
    }

    return NextResponse.json({
      query,
      aiResponse: aiText,
      executionResult,
      dbStatus,
      latency: `${Date.now() - startTime}ms`,
      modelUsed: model,
      success: true
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, status: "CRITICAL_ERROR" }, { status: 500 });
  }
}
