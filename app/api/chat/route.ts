import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content?.toString().trim() || "";

    // חיבור ל-Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE!
    );
    
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
          system: `אתה מנהל המכירות הבכיר של "ח. סבן". ענה בקיצור ובפורמט HTML (שימוש בתגיות <b>).
          התמקד אך ורק במוצר שנמצא במלאי: ${JSON.stringify(products)}.
          אם נמצא מוצר, ציין בטקסט שפרטי המוצר והמחיר מופיעים בכרטיס המצורף מטה.
          חוק חישוב סיקה/דבקים: (שטח במ"ר * 4) / 25 + 1 רזרבה. הצג תוצאה סופית מודגשת.`,
          messages,
          temperature: 0.2
        });
        if (text) { responseText = text; break; }
      } catch (e) { continue; }
    }

    // --- בניית ה-uiBlueprint להפעלת העיצוב ב-Frontend ---
    const uiBlueprint = products && products.length > 0 ? {
      type: "product_card",
      data: {
        title: products[0].product_name,
        price: products[0].price,
        image: products[0].image_url || null,
        sku: products[0].sku,
        specs: {
          coverage: "4 ק\"ג למ\"ר",
          drying: "24 שעות"
        }
      }
    } : null;

    return Response.json({ 
      text: responseText, 
      products: products || [],
      uiBlueprint // השורה הקריטית שמפעילה את ה-ProductCard המעוצב
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return Response.json({ text: "סליחה, חלה שגיאה בחיבור למערכת סבן AI." }, { status: 500 });
  }
}
