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
      return Response.json({ text: "שלום ראמי, סבן AI מוכן לעבודה." });
    }

    const lastMsgObj = messages[messages.length - 1];
    const rawText = lastMsgObj.content || lastMsgObj.text || "";
    const lastMsg = rawText.toString().trim();

    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_KEY;
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

    const modelsToTry = [
      "gemini-3.1-flash-image-preview",
      "gemini-3-flash-preview",
      "gemini-1.5-flash-latest"
    ];

    if (!geminiKey) throw new Error("Missing Gemini API Key");
    const googleAI = createGoogleGenerativeAI({ apiKey: geminiKey });

    let finalResponseText = "";
    
    for (const modelId of modelsToTry) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: `אתה יועץ המכירות של ח. סבן חומרי בניין. ענה בעברית. נתוני מלאי: ${JSON.stringify(products)}. חוק חישוב: עבור סיקה 255, כמות = (שטח מ"ר * 4 ק"ג) / 25 ק"ג שק. עגל למעלה + 1 שק רזרבה.`,
          messages,
          temperature: 0.4
        });

        finalResponseText = text?.trim() || "";
        activeModelName = modelId;
        break; 
      } catch (err) {
        console.warn(`Model ${modelId} failed, trying next...`);
        continue;
      }
    }

    return Response.json({ 
      text: finalResponseText, 
      products, 
      activeModel: activeModelName 
    });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    return Response.json({ 
      text: "ראמי אחי, חלה שגיאה בעיבוד הבקשה. בדוק את מפתחות ה-API.",
      debug: error.message
    });
  }
}
