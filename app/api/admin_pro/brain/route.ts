import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// חיבור מנהל לעקיפת RLS וכתיבה להיסטוריה
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const startTime = Date.now();
  let query = "";
  
  try {
    const body = await req.json();
    query = body.query;
    const apiKey = process.env.GOOGLE_AI_KEY;
    
    // הגדרות מודל Tier 1
    const MODEL_NAME = "gemini-3.1-flash-lite-preview"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    if (!apiKey) return NextResponse.json({ error: "Missing API Key", dbStatus: "מחובר תקין ✅" });

    // 1. פנייה למוח (AI)
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        systemInstruction: { 
          parts: [{ text: "אתה המוח של ח. סבן. פקודות: [UPDATE_ORDER:לקוח|שדה|ערך]" }] 
        },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
        }
      }),
    });

    const aiData = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ 
        error: aiData.error?.message || "Gemini API Error", 
        status: "FAILED_GEMINI"
      });
    }

    const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // 2. ביצוע ב-SQL (עדכון הסידור)
    let executionResult = "LOGGED"; // ברירת מחדל לתיעוד בלבד
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

      if (updateError) executionResult = `ERROR: ${updateError.message}`;
      else if (updateData && updateData.length > 0) executionResult = `SUCCESS: ${customer}`;
      else executionResult = `NOT_FOUND: ${customer}`;
    }

    // 3. 🔥 מנגנון הזיכרון: שמירה לטבלת saban_brain_history
    await supabaseAdmin.from('saban_brain_history').insert([{
      user_query: query,
      ai_response: aiText,
      execution_status: executionResult,
      model_used: MODEL_NAME,
      user_name: 'ראמי' // ניתן להחליף ב-User Auth בעתיד
    }]);

    // 4. החזרת תשובה לממשק
    return NextResponse.json({
      aiResponse: aiText,
      executionResult: executionResult.includes('SUCCESS') ? `✅ בוצע בהצלחה ללקוח: ${updateMatch ? updateMatch[1].split('|')[0] : ''}` : executionResult,
      dbStatus: "מחובר תקין ✅",
      latency: `${Date.now() - startTime}ms`,
      success: true
    });

  } catch (error: any) {
    console.error("Critical Brain Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
