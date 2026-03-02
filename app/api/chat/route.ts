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

    // הגדרת מפתחות
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

    let products = [];
    if (lastMsg && supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data } = await supabase
          .from("inventory")
          .select("*")
          .or(`product_name.ilike.%${lastMsg}%,sku.ilike.%${lastMsg}%`)
          .limit(2);
        if (data) products = data;
      } catch (e) {
        console.error("DB Error:", e);
      }
    }

    // רשימת מודלים מעודכנת לפי ה-Free Tier שלך
const { text } = await generateText({
  model: googleAI("gemini-3.1-flash-image-preview"), // המודל החדש ביותר
  system: `אתה יועץ המכירות של ח. סבן...`,
  messages
});

    if (!geminiKey) throw new Error("Missing Gemini API Key");
    const googleAI = createGoogleGenerativeAI({ apiKey: geminiKey });

    let finalResponseText = "";
    
    for (const modelId of modelsToTry) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: `אתה יועץ המכירות של ח. סבן חומרי בניין. ענה בעברית.
          נתוני מלאי זמינים: ${JSON.stringify(products)}.
          חוק חישוב כמויות:
          - עבור דבקי אריחים (כמו סיקה 255): (שטח מ"ר * 4 ק"ג) / 25 ק"ג שק. עגל תמיד למעלה + 1 שק רזרבה.
          - עבור איטום נוזלי: (שטח מ"ר * צריכה לקמ"ר מהמפרט) / משקל פח.
          בסוף כל תשובה טכנית, תן "טיפ זהב" ליישום והצע להוסיף לסל.`,
          messages,
          temperature: 0.4
        });

        finalResponseText = text?.trim() || "";
        activeModelName = modelId;
        break; 
      } catch (err) {
        continue;
      }
    }

    return Response.json({ 
      text: finalResponseText, 
      products, 
      activeModel: activeModelName 
    });

  } catch (error: any) {
    return Response.json({ 
      text: "חלה שגיאה בעיבוד. אנא וודא שמפתח ה-API תקין ב-Vercel.",
      debug: error.message
    });
  }
}
