import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content?.toString().trim() || "";

    // 1. חיבור למסד הנתונים Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    );

    // 2. חיפוש מוצר היברידי (SKU/FTS)
    const { data: products } = await supabase
      .from("inventory")
      .select("*")
      .or(`sku.eq.${lastMsg},product_name.ilike.%${lastMsg}%`)
      .limit(1);

    // 3. הגדרת המוח (Google AI)
    const googleAI = createGoogleGenerativeAI({ 
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! 
    });

    /**
     * רשימת מודלים מעודכנת לפי התיעוד (מרץ 2026)
     * השתמשנו בשמות ה-Alias היציבים ביותר כדי למנוע 404
     */
    const models = [
      "gemini-1.5-flash-latest", // המודל הכי יציב לגיבוי
      "gemini-3.1-flash-image-preview",
      "gemini-3-flash-preview",
      "gemini-1.5-pro-latest"
    ];

    let result = null;

    // 4. לולאת הדילוג (The Fail-Safe Brain)
    for (const modelId of models) {
      try {
        result = await generateText({
          model: googleAI(modelId),
          // הזרקת כלי החיפוש של גוגל (Grounding)
          tools: [
            {
              googleSearch: {} 
            }
          ],
          system: `אתה עוזר השירות הבכיר של "ח. סבן חומרי בניין". 
          נתוני מלאי בזמן אמת: ${JSON.stringify(products || [])}.
          תפקידך:
          1. אם נמצא מוצר במלאי, הצג פרטים מדויקים מהטבלה.
          2. אם המידע בטבלה חסר או שהמוצר לא נמצא, השתמש בכלי ה-Google Search כדי למצוא מפרט טכני.
          3. חוק סיקה: (שטח*4)/25 + 1 רזרבה. עגל למעלה והדגש תוצאה סופית.
          4. ענה ב-HTML (<b>, <br>, <ul>, <li>).`,
          messages,
          temperature: 0.1,
        });
        
        if (result) break; // אם הצלחנו, עוצרים
      } catch (err) {
        console.error(`Model ${modelId} failed:`, err);
        continue; // עוברים למודל הבא ברשימה
      }
    }

    if (!result) {
      throw new Error("All models failed to respond");
    }

    // 5. הפקת הבלופרינט לכרטיס המוצר
    const uiBlueprint = (products && products.length > 0) ? {
      type: "product_card",
      data: {
        title: products[0].product_name,
        price: products[0].price || "פנה למחסן",
        image: products[0].image_url || null,
        sku: products[0].sku,
        specs: {
          coverage: products[0].coverage || "לפי מפרט יצרן",
          drying: products[0].drying_time || "24 שעות"
        }
      }
    } : null;

    // 6. תגובה סופית כולל נתוני ה-Grounding
    return new Response(JSON.stringify({
      text: result.text,
      uiBlueprint,
      groundingMetadata: result.groundingMetadata || null // מחזיר ציטוטים ומקורות מגוגל
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Critical System Failure:", error);
    return new Response(JSON.stringify({ 
      text: "<b>מצטער, המערכת בעומס. אנחנו בודקים את החיבור למחסן.</b>",
      error: error.message 
    }), { status: 500 });
  }
}
