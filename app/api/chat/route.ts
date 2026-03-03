import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content?.toString().trim() || "";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    );

    // שליפת נתונים מהמחסן של סבן
    const { data: products } = await supabase
      .from("inventory")
      .select("*")
      .or(`sku.eq.${lastMsg},product_name.ilike.%${lastMsg}%`)
      .limit(1);

    const googleAI = createGoogleGenerativeAI({ 
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! 
    });

    // רשימת מודלים לבדיקה
    const models = [
      "gemini-1.5-flash-latest",
      "gemini-3.1-flash-image-preview",
      "gemini-3-flash-preview",
      "gemini-2.0-flash-exp"
    ];

    let result = null;
    let activeModel = "";

    // לולאת הדילוג עם ה"מלשינון"
    for (const modelId of models) {
      try {
        console.log(`[מלשינון] מנסה להתחבר למודל: ${modelId}...`);
        
        result = await generateText({
          model: googleAI(modelId),
          tools: [
            {
              // שילוב חיפוש גוגל מותאם (Grounding)
              // המערכת משתמשת ב-CSE_API_KEY מה-env באופן אוטומטי אם הוגדר ב-Google Generative AI
              googleSearch: {} 
            }
          ],
          system: `אתה עוזר טכני של "ח. סבן". 
          נתוני מלאי: ${JSON.stringify(products || [])}.
          הוראות:
          1. אם יש מוצר במלאי, השתמש בנתונים שלו.
          2. אם חסר מידע, בצע חיפוש בגוגל (Google Search Tool) למציאת דפי מוצר או מפרטים.
          3. תמיד ציין בסוף התשובה באיזה מודל השתמשת.
          4. ענה ב-HTML בלבד.`,
          messages,
        });

        if (result) {
          activeModel = modelId;
          console.log(`[מלשינון] הצלחה! מודל פעיל: ${activeModel}`);
          break;
        }
      } catch (err) {
        console.error(`[מלשינון] מודל ${modelId} נכשל. עובר לבא בתור...`);
        continue;
      }
    }

    if (!result) throw new Error("כל המודלים נכשלו");

    // הוספת ה"מלשין" לטקסט הסופי כדי שתראה אותו בצ'אט
    const footer = `<br><small style="color: gray;">[מעבד: ${activeModel} | חיפוש גוגל: פעיל]</small>`;
    const finalContent = result.text + footer;

    return new Response(JSON.stringify({
      text: finalContent,
      grounding: result.groundingMetadata || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ text: "תקלה במלשינון המודלים." }), { status: 500 });
  }
}
