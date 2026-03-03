import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // בדיקה שהגוף קיים למניעת קריסה
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];

    if (messages.length === 0) {
      return new Response(JSON.stringify({ text: "שלום! סבן AI מוכן לעזור לך." }), { status: 200 });
    }

    // אימות מפתחות - שים לב לשמות המשתנים ב-Vercel!
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!geminiKey || !supabaseUrl || !supabaseKey) {
      console.error("Missing Environment Variables");
      return new Response(JSON.stringify({ text: "שגיאה בתצורת השרת - חסרים מפתחות אימות." }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const lastMsg = (messages[messages.length - 1]?.content || "").toString().trim();
    
    let products: any[] = [];
    
    // חיפוש חכם ב-Supabase
    if (lastMsg) {
      const searchWord = lastMsg.split(' ').filter((w: string) => w.length > 2)[0] || lastMsg;
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .or(`product_name.ilike.%${searchWord}%,sku.ilike.%${searchWord}%`)
        .limit(1);
      
      if (!error && data) products = data;
    }

    const googleAI = createGoogleGenerativeAI({ apiKey: geminiKey });
    
    // שימוש במודלים קיימים ויציבים למניעת 500
    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
    
    let finalResponse = "";
    for (const modelId of models) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: `אתה מנהל המכירות של "ח. סבן חומרי בניין". 
          הנחיות קריטיות:
          1. השתמש במידע מהטבלה בלבד: ${JSON.stringify(products)}.
          2. ענה בפורמט HTML נקי (<b> בלבד).
          3. אם נמצא מוצר, ציין: "הנה הפרטים הטכניים של המוצר:".
          4. חוק סיקה: (שטח*4)/25 + 1 רזרבה. עגל למעלה והדגש תוצאה.`,
          messages,
          temperature: 0.2,
        });
        if (text) { finalResponse = text.trim(); break; }
      } catch (e) { 
        console.error(`Model ${modelId} failed:`, e);
        continue; 
      }
    }

    // בניית ה-uiBlueprint לעיצוב הויזואלי
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
      text: finalResponse || "מצטער, לא הצלחתי לעבד את הבקשה.", 
      products,
      uiBlueprint 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Critical API Error:", error);
    return new Response(JSON.stringify({ text: "שגיאה פנימית בשרת.", error: error.message }), { status: 500 });
  }
}
