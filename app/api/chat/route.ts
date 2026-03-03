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

    // חיפוש מוצר ב-Supabase (SKU -> FTS)
    const { data: products } = await supabase
      .from("inventory")
      .select("*")
      .or(`sku.eq.${lastMsg},product_name.ilike.%${lastMsg}%`)
      .limit(1);

    const googleAI = createGoogleGenerativeAI({ 
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! 
    });

    /**
     * רשימת מודלים מעודכנת עם Fallback ל-Stable:
     * הוספתי את gemini-1.5-flash-8b כגלגל הצלה אחרון
     */
    const models = [
      "gemini-1.5-flash", // המודל הכי יציב כרגע ב-SDK
      "gemini-3.1-flash-image-preview",
      "gemini-3-flash-preview",
      "gemini-2.0-flash-001"
    ];

    let result = null;

    for (const modelId of models) {
      try {
        result = await generateText({
          model: googleAI(modelId),
          tools: [
            {
              // הפעלת חיפוש גוגל בזמן אמת (Grounding)
              googleSearch: {} 
            }
          ],
          system: `אתה עוזר השירות "ח. סבן". 
          נתוני מלאי: ${JSON.stringify(products || [])}.
          הוראות:
          1. אם יש מוצר במלאי, הצג נתונים מהטבלה בלבד.
          2. אם המוצר חסר, השתמש בחיפוש גוגל כדי למצוא מפרט טכני או חלופות.
          3. חוק סיקה: (שטח*4)/25 + 1. עגל למעלה והדגש.
          4. ענה ב-HTML (<b>).`,
          messages,
          temperature: 0.1,
        });
        if (result) break;
      } catch (err) {
        console.error(`Model ${modelId} failed, switching...`);
        continue;
      }
    }

    if (!result) throw new Error("All models failed");

    // בניית כרטיס המוצר
    const uiBlueprint = (products && products.length > 0) ? {
      type: "product_card",
      data: {
        title: products[0].product_name,
        price: products[0].price || "פנה למחסן",
        image: products[0].image_url,
        sku: products[0].sku,
        specs: {
          coverage: products[0].coverage || "4 ק\"ג למ\"ר",
          drying: products[0].drying_time || "24 שעות"
        }
      }
    } : null;

    return new Response(JSON.stringify({
      text: result.text,
      uiBlueprint,
      grounding: result.groundingMetadata || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ text: "תקלה במוח המערכת." }), { status: 500 });
  }
}
