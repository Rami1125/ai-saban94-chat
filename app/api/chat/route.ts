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

    // חיפוש היברידי במלאי
    const { data: products } = await supabase
      .from("inventory")
      .select("*")
      .or(`sku.eq.${lastMsg},product_name.ilike.%${lastMsg}%`)
      .limit(1);

    const googleAI = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
    
    // מנגנון דילוג מודלים (מלשינון)
    const models = ["gemini-3.1-flash-image-preview", "gemini-3.1-pro-preview", "gemini-1.5-flash-latest"];
    let result = null;
    let activeModel = "";

    for (const modelId of models) {
      try {
        result = await generateText({
          model: googleAI(modelId),
          tools: [{ googleSearch: {} }],
          system: `אתה עוזר השירות "ח. סבן". נתוני מלאי: ${JSON.stringify(products)}.
          חוק סיקה: (שטח*4)/25 + 1. עגל למעלה והדגש. ענה ב-HTML (<b>).`,
          messages,
        });
        if (result) { activeModel = modelId; break; }
      } catch (e) { continue; }
    }

    const uiBlueprint = products?.[0] ? {
      type: "product_card",
      data: {
        title: products[0].product_name,
        price: products[0].price,
        image: products[0].image_url,
        sku: products[0].sku,
        specs: { coverage: products[0].coverage, drying: products[0].drying_time }
      }
    } : null;

    return Response.json({ 
      text: result.text + `<br><small>[מעבד: ${activeModel}]</small>`, 
      uiBlueprint 
    });
  } catch (error) {
    return Response.json({ text: "שגיאה במערכת." }, { status: 500 });
  }
}
