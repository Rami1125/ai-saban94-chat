import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content?.toString().trim() || "";

    // 1. חיבור למפתחות ומסד הנתונים
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    );

    const googleAI = createGoogleGenerativeAI({ 
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! 
    });

    // 2. מנגנון חיפוש היברידי ב-Supabase (SKU -> FTS -> Trigrams)
    let inventoryData = [];
    const cleanSearch = lastMsg.replace(/[^\w\sא-ת]/g, '').trim();

    // ניסיון שליפה ראשון (SKU/FTS)
    const { data: products } = await supabase
      .from("inventory")
      .select("*")
      .or(`sku.eq.${cleanSearch},product_name.ilike.%${cleanSearch}%`)
      .limit(1);
    
    inventoryData = products || [];

    // 3. הגדרת המודלים המובילים (לפי עדכוני פברואר 2026)
    const models = [
      "gemini-3.1-pro-preview",       // הכי חזק (הושק 19.2)
      "gemini-3.1-flash-image-preview", // הכי מהיר (הושק 26.2)
      "gemini-3-flash-preview"        // יציב (Fallback)
    ];

    let finalResponse = null;

    // 4. המוח של האפליקציה - לולאת דילוג בין מודלים עם Grounding
    for (const modelId of models) {
      try {
        finalResponse = await generateText({
          model: googleAI(modelId),
          tools: [
            {
              // הפעלת מפתח גוגל לחיפוש חי (Grounding)
              googleSearch: {} 
            }
          ],
          system: `אתה עוזר השירות "ח. סבן". 
          נתוני מלאי מ-Supabase: ${JSON.stringify(inventoryData)}.
          תפקידך:
          1. אם נמצא מוצר, הצג תשובת HTML (<b>, <ul>).
          2. אם חסר מידע טכני, השתמש בחיפוש גוגל (Grounding) כדי להשלים מפרט יצרן.
          3. חוק סיקה: (שטח*4)/25 + 1 רזרבה. עגל למעלה והדגש.
          4. אם אין מוצר במלאי, הצע חלופות על בסיס חיפוש ברשת.`,
          messages,
          temperature: 0.1,
        });

        if (finalResponse) break; // הצלחה - עוצרים את הדילוג
      } catch (error) {
        console.error(`Model ${modelId} failed, switching...`);
        continue; // המלשינון מזהה שגיאה ועובר למודל הבא
      }
    }

    // 5. הפקת כרטיס מוצר (uiBlueprint)
    const uiBlueprint = inventoryData.length > 0 ? {
      type: "product_card",
      data: {
        title: inventoryData[0].product_name,
        price: inventoryData[0].price || "פנה למחסן",
        image: inventoryData[0].image_url,
        sku: inventoryData[0].sku,
        specs: {
          coverage: inventoryData[0].coverage || "לפי מפרט",
          drying: inventoryData[0].drying_time || "24 שעות"
        }
      }
    } : null;

    // 6. החזרת תשובה מבוססת מקורות (Citations)
    return new Response(JSON.stringify({
      text: finalResponse?.text,
      uiBlueprint,
      sources: finalResponse?.groundingMetadata?.groundingChunks || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Critical System Error:", error);
    return new Response(JSON.stringify({ text: "שגיאה במוח המערכת." }), { status: 500 });
  }
}
