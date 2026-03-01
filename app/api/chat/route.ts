import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // חיבור ל-Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    );

    // 1. חיפוש מוצרים רלוונטיים ב-Database (RAG)
    const { data: products } = await supabase
      .from("inventory")
      .select("*")
      .or(`product_name.ilike.%${lastMessage}%,sku.ilike.%${lastMessage}%`)
      .limit(3);

    // 2. הגדרת המודל (Gemini)
    const googleAI = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    
    const { text } = await generateText({
      model: googleAI("gemini-1.5-flash"),
      system: `אתה יועץ המכירות והמומחה הטכני של "ח. סבן". 
      נתוני מוצרים מהמחסן: ${JSON.stringify(products)}.
      תפקידך: לספק פתרונות הנדסיים, לחשב כמויות (מ"ר לשקים) ולתת "טיפי זהב" ליישום.
      אם המוצר לא נמצא, הצע חלופה דומה מהמלאי.`,
      messages,
    });

    // 3. שמירה במאגר המידע (זיכרון ארגוני)
    await supabase.from("chat_history").insert({
      user_id: userId,
      query: lastMessage,
      response: text,
      metadata: { products_shown: products?.map(p => p.sku) }
    });

    return Response.json({ text, products });

  } catch (error) {
    return Response.json({ error: "שגיאת מערכת" }, { status: 500 });
  }
}
