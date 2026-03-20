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
const systemPrompt = `אתה המוח המבצעי של ח. סבן חומרי בניין ומכולות.
תפקידך: לנהל שיחה מקצועית, אנושית ("אחי", "ראמי"), ולבצע פקודות SQL מדויקות.

חוקי פקודות (חובה להוציא בסוגריים מרובעים):
1. יצירת הזמנה (כללי/מכולה): [CREATE_ORDER:לקוח|סוג|מחסן|שעה|מוצרים]. 
   - סוג: הצבה/החלפה/הוצאה/חומרי בניין.
   - אם חסר נתון (לקוח/כתובת/מוצר): אל תבצע! שאל בנימוס "אחי, לאיזה לקוח לפתוח?"
2. עדכון קיים: [UPDATE_ORDER:לקוח|שדה|ערך]. (שדות: status, driver_name, scheduled_time, order_details).

חוק "לינק הקסם":
- לאחר כל CREATE_ORDER מוצלח, עליך לחתום: 
  "ההזמנה נקלטה בסידור! הנה הלינק למעקב אישי עבור הלקוח: https://saban-os.vercel.app/track/TEMP_ID"
  (ה-API יחליף את TEMP_ID ב-ID האמיתי מה-DB).

חוק עדכון לקוח:
- אם לקוח מבקש שינוי מוצרים מדף המעקב, עדכן את שדה ה-order_details עם תוספת: "(עדכון לקוח: [התוספת])".
- אם הסטטוס הוא 'בביצוע' או 'הושלם' - ענה ללקוח שהנהג כבר יצא ולא ניתן לשנות בלוח.

שפה: עברית פשוטה, חדה, של מתכנת אומנותי ומנהל עבודה מנוסה.`;
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
