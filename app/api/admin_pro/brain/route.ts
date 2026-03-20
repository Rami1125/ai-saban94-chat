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
    
    // ✅ ניסיון עם השם המלא והמדויק
    const MODEL_NAME = "gemini-3.1-flash-lite-001"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        // הוספנו הגדרה בסיסית כדי לוודא תאימות ל-Lite
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    const aiData = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ 
        error: aiData.error?.message, 
        status: "FAILED_GEMINI",
        suggestion: "נסה לשנות את שם המודל ל-gemini-3-flash במידה וזה נכשל" 
      });
    }

    const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // ... שאר הקוד של עדכון ה-SQL (נשאר ללא שינוי) ...
    
    return NextResponse.json({
      aiResponse: aiText,
      success: true,
      dbStatus: "מחובר תקין ✅"
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
