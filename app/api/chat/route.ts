import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let activeModelName = "None";
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];

    if (messages.length === 0) {
      return Response.json({ text: "שלום! סבן AI מוכן לעזור לך עם מוצרים וחישובים." });
    }

    const lastMsgObj = messages[messages.length - 1];
    const rawText = lastMsgObj.content || lastMsgObj.text || "";
    const lastMsg = rawText.toString().trim();

    // הגדרת מפתחות מה-Environment Variables
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

    if (!geminiKey) throw new Error("Missing Gemini API Key");

    // שליפת נתונים מ-Supabase (inventory)
    let products: any[] = [];
    if (lastMsg && supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        // חיפוש גמיש לפי שם מוצר או מק"ט
        const { data } = await supabase
          .from("inventory")
          .select("*")
          .or(`product_name.ilike.%${lastMsg}%,sku.ilike.%${lastMsg}%`)
          .limit(3);
        if (data) products = data;
      } catch (e) {
        console.error("DB Error:", e);
      }
    }

    const googleAI = createGoogleGenerativeAI({ apiKey: geminiKey });

    // רשימת מודלים מעודכנת לדילוג חכם (Fallback) - מרץ 2026
    const modelsToTry = [
      "gemini-3.1-flash-image-preview", // Nano Banana 2 (הכי חדש)
      "gemini-3-flash-preview",         // Gemini 3 Flash
      "gemini-3-flash",                 // Standard
      "gemini-1.5-flash-latest"         // גיבוי אחרון
    ];

    let finalResponseText = "";

    // לולאת הדילוג בין המודלים
for (const modelId of modelsToTry) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: `אתה מנהל המכירות הבכיר של "ח. סבן חומרי בניין". 
          
          כלל ברזל: ענה אך ורק על המוצר הספציפי שהלקוח ביקש. 
          אם נמצאו מספר מוצרים בנתונים: ${JSON.stringify(products)}, בחר רק את המתאים ביותר ואל תציג את האחרים.

          הנחיות מענה:
          1. ענה בפורמט HTML מקצועי (שימוש בתגיות <b> ו-<u>).
          2. אם מצאת את המוצר במלאי, הצג את הכרטיס שלו: 📦 מוצר: <b>[שם מדויק מהטבלה]</b> | 💰 מחיר: <b>[מחיר מהטבלה]</b> ש"ח.
          3. חוק חישוב: (שטח * 4) / 25 + 1 רזרבה. הצג רק את התוצאה הסופית המודגשת.
          4. אל תפרט על סניפים או שעות פעילות אלא אם נשאלת עליהם במפורש.
          5. בסוף כל תשובה טכנית, הוסף <u>טיפ זהב</u> קצר.
          6. חל איסור מוחלט להשתמש בסימני ** להדגשה.`,
          messages,
          temperature: 0.2, // הורדתי מעט את ה-Temperature כדי שיהיה פחות "יצירתי" ויותר ממוקד בנתונים
        });

        if (text) {
          finalResponseText = text.trim();
          activeModelName = modelId;
          break; 
        }
      } catch (err) {
        console.warn(`המודל ${modelId} נכשל, מנסה את הבא...`);
        continue;
      }
    }

    return Response.json({ 
      text: finalResponseText, 
      products: products.slice(0, 1), // שולח לפרונט-אנד רק את המוצר הראשון והכי רלוונטי
      activeModel: activeModelName 
    });
    
  } 
  catch (error: any) {
    console.error("Critical Chat Error:", error);
    return Response.json({ 
      text: "חלה שגיאה בעיבוד. סבן AI יחזור לפעילות בעוד רגע.",
      debug: error.message
    });
  }
}
