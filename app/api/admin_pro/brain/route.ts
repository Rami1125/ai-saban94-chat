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
    const MODEL_NAME = "gemini-3.1-flash-lite-preview";

    // הנחיית מערכת משודרגת שכוללת את מצב הפירוק (Parser)
    const systemPrompt = `אתה המוח של ח. סבן. 
    תפקידים:
    1. עדכון SQL: [UPDATE_ORDER:לקוח|שדה|ערך]
    2. יצירת מכולה: [CREATE_WASTE_ORDER:לקוח|פעולה|מחסן|שעה|קומקס]
    3. פירוק הודעת וואטסאפ להזמנה: אם המשתמש מבקש לנתח/לפרק הודעה, החזר אך ורק פורמט JSON כזה:
    {
      "type": "PARSED_ORDER",
      "customer": "שם הלקוח",
      "items": [{"product": "שם המוצר", "qty": "כמות"}],
      "address": "כתובת למשלוח"
    }`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      }),
    });

    const data = await res.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // בדיקה אם המוח החזיר JSON של הזמנה מפורקת
    if (aiText.includes("PARSED_ORDER")) {
      try {
        // חילוץ ה-JSON מתוך הטקסט של ה-AI
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            success: true,
            mode: "PARSER",
            ...parsedData
          });
        }
      } catch (e) {
        console.error("JSON Parsing Error", e);
      }
    }

    // לוגיקת UPDATE ו-CREATE הרגילה (נשארת ללא שינוי)
    // ... (כאן מגיע הקוד הקודם של ה-UPDATE_ORDER וה-CREATE_WASTE_ORDER)

    return NextResponse.json({ 
      aiResponse: aiText,
      success: true 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
