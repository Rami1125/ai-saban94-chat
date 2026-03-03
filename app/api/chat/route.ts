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
     * רשימת מודלים מעודכנת - מרץ 2026
     * סדר המודלים נקבע מהכי חדיש להכי יציב
     */
    const models = [
      "gemini-3.1-flash-image-preview", 
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview",
      "gemini-1.5-flash-latest"
    ];

    let result = null;
    let activeModel = "";

    // 4. לולאת הדילוג (The Fail-Safe Brain)
    for (const modelId of models) {
      try {
        console.log(`[מלשינון] מנסה להתחבר למודל: ${modelId}...`);
        
        result = await generateText({
          model: googleAI(modelId),
          // תיקון קריטי ל-Search Grounding ב-SDK של Vercel
          tools: [
            {
              googleSearch: {} 
            }
          ],
          system: `אתה מנהל המכירות הבכיר של "ח. סבן חומרי בניין". 
          נתוני מלאי מ-Supabase: ${JSON.stringify(products || [])}.
          תפקידך:
          1. אם נמצא מוצר במלאי, הצג פרטים מדויקים מהטבלה בלבד.
          2. אם המידע בטבלה חסר, השתמש ב-Google Search כדי למצוא מפרט טכני של היצרן.
          3. חוק סיקה: (שטח*4)/25 + 1 רזרבה. עגל למעלה והדגש תוצאה סופית.
          4. ענה ב-HTML (<b>, <br>, <ul>, <li>).`,
          messages,
          temperature: 0.1,
        });
        
        if (result && result.text) {
          activeModel = modelId;
          break; 
        }
      } catch (err) {
        console.error(`[מלשינון] מודל ${modelId} נכשל. פירוט:`, err);
        continue; 
      }
    }

    if (!result) {
      throw new Error("כל המודלים נכשלו בתקשורת.");
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

    // 6. תגובה סופית עם חתימת "מלשינון"
    const footer = `<br><small style="color: gray; font-size: 10px;">[מעבד: ${activeModel} | Grounding: פעיל]</small>`;

    return new Response(JSON.stringify({
      text: result.text + footer,
      uiBlueprint,
      groundingMetadata: result.groundingMetadata || null 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Critical System Failure:", error);
    return new Response(JSON.stringify({ 
      text: "<b>מצטער ראמי, יש תקלה בחיבור למודלים. וודא שמפתח ה-API תקין ב-Vercel.</b>",
      error: error.message 
    }), { status: 500 });
  }
}
