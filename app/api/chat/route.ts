import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = (messages[messages.length - 1]?.content || "").toString().trim();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE!
    );
    
    let products: any[] = [];
    
    if (lastMsg) {
      // תיקון: מחפשים את כל הביטוי ולא רק מילה אחת
      const cleanSearch = lastMsg.replace(/[^\w\sא-ת]/g, ''); // ניקוי תווים מיוחדים
      
      const { data: prodRes } = await supabase
        .from("inventory")
        .select("*")
        .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`)
        .limit(1);
        
      products = prodRes || [];
    }

    const googleAI = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
    
    // מנגנון דילוג בין מודלים (Gemini 3 Series)
    const models = ["gemini-3.1-pro-preview", "gemini-3.1-flash-image-preview", "gemini-3-flash-preview"];
    let finalResponse = "";

    for (const modelId of models) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: `אתה מנהל המכירות של "ח. סבן חומרי בניין". 
          נתוני מלאי בזמן אמת: ${JSON.stringify(products)}.
          הנחיות קריטיות:
          1. אם המערך products מכיל נתונים, המוצר קיים! אל תגיד שהוא חסר.
          2. אם המערך ריק, תגיד שאתה בודק במחסן המרכזי.
          3. ענה ב-HTML (<b>) בלבד.
          4. חוק סיקה: (שטח*4)/25 + 1 רזרבה. הצג את החישוב בבירור.`,
          messages,
          temperature: 0.2,
        });
        if (text) { finalResponse = text.trim(); break; }
      } catch (e) { continue; }
    }

    // בניית ה-uiBlueprint לעיצוב המובייל
    const uiBlueprint = products.length > 0 ? {
      type: "product_card",
      data: {
        title: products[0].product_name,
        price: products[0].price,
        image: products[0].image_url || null,
        sku: products[0].sku,
        specs: { coverage: "4 ק\"ג למ\"ר", drying: "24 שעות" }
      }
    } : null;

    return Response.json({ text: finalResponse, products, uiBlueprint });

  } catch (error: any) {
    return Response.json({ text: "שגיאה בחיבור הנתונים." }, { status: 500 });
  }
}
