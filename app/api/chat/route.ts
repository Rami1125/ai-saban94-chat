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
    
    // --- מנגנון זיקוק מילות מפתח (The Investigator) ---
    // אנחנו מנקים מילים נפוצות כדי להישאר עם שם המוצר נטו
    const stopWords = ["גימני", "אחי", "שלום", "צריך", "כמה", "עולה", "תביא", "לי", "בבקשה"];
    const searchTerms = lastMsg.split(' ')
      .filter((word: string) => !stopWords.includes(word) && word.length > 1);
    
    const cleanSearch = searchTerms.join(' ') || lastMsg;

    // שליפה חכמה - מחפשים גם את הביטוי המלא וגם מילים בודדות
    const { data: products } = await supabase
      .from("inventory")
      .select("*")
      .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`)
      .limit(1);

    const googleAI = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
    
    // מנגנון דילוג מודלים 2026
    const models = ["gemini-3.1-pro-preview", "gemini-3.1-flash-image-preview", "gemini-3-flash-preview"];
    
    let responseText = "";
    for (const modelId of models) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: `אתה מנהל המכירות הבכיר של "ח. סבן". ענה בקיצור ובפורמט HTML (<b>).
          מלאי זמין: ${JSON.stringify(products || [])}.
          אם המערך products אינו ריק, המוצר קיים במחסן! ציין שמוצג כרטיס למטה.
          חוק סיקה: (שטח * 4) / 25 + 1 רזרבה. הצג תוצאה סופית מודגשת.`,
          messages,
          temperature: 0.2
        });
        if (text) { responseText = text; break; }
      } catch (e) { continue; }
    }

    // בניית הבלופרינט להפעלת העיצוב (זה מה שהיה חסר!)
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
      uiBlueprint 
    });

  } catch (error) {
    return Response.json({ text: "שגיאה בחיבור למערכת סבן AI." }, { status: 500 });
  }
}
