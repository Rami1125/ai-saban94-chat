import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.GOOGLE_AI_KEY;
    
    // ✅ זה השם המדויק למודל שמופיע אצלך בטבלה כפעיל (Gemini 3 Flash)
    const MODEL_NAME = "gemini-3-flash"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    if (!apiKey) return NextResponse.json({ error: "Missing API Key", dbStatus: "מחובר תקין ✅" });

    // פנייה למוח
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: "אתה המוח של ח. סבן. לעדכון: [UPDATE_ORDER:לקוח|שדה|ערך]" }] }
      }),
    });

    const aiData = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ 
        error: aiData.error?.message, 
        status: "FAILED_GEMINI",
        dbStatus: "מחובר תקין ✅"
      });
    }

    const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // ביצוע ב-SQL (נשאר זהה)
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

      if (updateError) executionResult = `❌ כשל: ${updateError.message}`;
      else if (updateData && updateData.length > 0) executionResult = `✅ בוצע בהצלחה ללקוח: ${customer}`;
      else executionResult = `⚠️ לקוח '${customer}' לא נמצא.`;
    }

    return NextResponse.json({
      aiResponse: aiText,
      executionResult,
      dbStatus: "מחובר תקין ✅",
      success: true
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
