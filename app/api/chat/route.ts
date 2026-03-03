import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];

    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!geminiKey || !supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ text: "שגיאת תצורה בשרת." }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const lastMsg = (messages[messages.length - 1]?.content || "").toString().trim();
    
    let products: any[] = [];
    if (lastMsg) {
      const searchWord = lastMsg.split(' ').filter((w: string) => w.length > 2)[0] || lastMsg;
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .or(`product_name.ilike.%${searchWord}%,sku.ilike.%${searchWord}%`)
        .limit(1);
      if (data) products = data;
    }

    const googleAI = createGoogleGenerativeAI({ apiKey: geminiKey });
    
    /**
     * עדכון מודלים - פברואר 2026:
     * gemini-3.1-flash-image-preview (הכי מהיר)
     * gemini-3.1-pro-preview (הכי חזק)
     * gemini-3-flash-preview (יציב)
     */
    const models = [
      "gemini-3.1-flash-image-preview",
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview"
    ];
    
    let finalResponse = "";
    for (const modelId of models) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: `אתה מנהל המכירות של "ח. סבן". 
          מידע מהטבלה: ${JSON.stringify(products)}.
          הנחיות:
          1. ענה ב-HTML (תגיות <b>).
          2. חוק סיקה: (שטח*4)/25 + 1. עגל למעלה והדגש.
          3. אם יש מוצר, ציין שפרטיו מופיעים בכרטיס למטה.`,
          messages,
          temperature: 0.2,
        });
        if (text) { finalResponse = text.trim(); break; }
      } catch (e) {
        console.error(`Model ${modelId} failed, trying next...`);
        continue;
      }
    }

    const uiBlueprint = products.length > 0 ? {
      type: "product_card",
      data: {
        title: products[0].product_name,
        price: products[0].price || "פנה למחסן",
        image: products[0].image_url || null,
        sku: products[0].sku,
        specs: {
          coverage: products[0].coverage || "4 ק\"ג למ\"ר",
          drying: products[0].drying_time || "24 שעות"
        }
      }
    } : null;

    return new Response(JSON.stringify({ 
      text: finalResponse || "<b>סליחה, המערכת בעומס. נסה שנית.</b>", 
      uiBlueprint 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ text: "שגיאה פנימית." }), { status: 500 });
  }
}
