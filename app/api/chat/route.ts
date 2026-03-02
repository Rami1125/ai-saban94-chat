import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content?.toString().trim() || "";

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
    
    // שליפה ממוקדת - Limit 1 כדי למנוע הצפה של נתונים לא קשורים
    const { data: products } = await supabase
      .from("inventory")
      .select("*")
      .or(`product_name.ilike.%${lastMsg}%,sku.ilike.%${lastMsg}%`)
      .limit(1);

    const googleAI = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
    
    // מנגנון דילוג בין מודלים (Fallback)
    const models = ["gemini-3.1-flash-image-preview", "gemini-3-flash-preview", "gemini-1.5-flash-latest"];
    
    let responseText = "";
    for (const modelId of models) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: `אתה מנהל המכירות של "ח. סבן". ענה בקיצור וב-HTML (<b>).
          התמקד אך ורק במוצר שנמצא: ${JSON.stringify(products)}.
          אם נמצא מוצר, ציין שמוצג כרטיס מוצר מתחת.
          חוק סיקה: (שטח*4)/25 + 1. הצג תוצאה סופית מודגשת.`,
          messages,
          temperature: 0.2
        });
        if (text) { responseText = text; break; }
      } catch (e) { continue; }
    }

    return Response.json({ text: responseText, products: products || [] });
  } catch (error) {
    return Response.json({ text: "שגיאה בחיבור." }, { status: 500 });
  }
}
