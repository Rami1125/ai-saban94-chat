import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { messages, userName } = await req.json();
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const supabase = getSupabase();

    // --- חיפוש מלאי חכם ב-Supabase ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    
    // שאילתה שמחפשת גם בשם וגם ב-SKU (מק"ט)
    const { data: product, error: searchError } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`)
      .limit(1)
      .maybeSingle();

    if (searchError) console.error("Supabase Search Error:", searchError);

    // --- סבב מפתחות ומודלים (תיקון ה-404 של גוגל) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim());
    const modelPool = ["gemini-1.5-flash-002", "gemini-1.5-pro-002"];
    
    let aiResponse = "";
    let success = false;

    for (const key of keys) {
      if (success) break;
      try {
        const genAI = new GoogleGenerativeAI(key);
        for (const modelName of modelPool) {
          if (success) break;
          try {
            const model = genAI.getGenerativeModel({ 
              model: modelName,
              systemInstruction: `אתה העוזר של ח. סבן. מלאי זמין: ${product ? JSON.stringify(product) : "לא נמצא"}. ענה בשם ראמי.`
            });
            const result = await model.generateContent(lastUserMsg);
            aiResponse = result.response.text();
            if (aiResponse) success = true;
          } catch (e) { continue; }
        }
      } catch (e) { continue; }
    }

    return NextResponse.json({ 
      answer: aiResponse || "המערכת בתחזוקה, נסה שוב בעוד רגע.", 
      product: product || null 
    });

  } catch (error) {
    console.error("Critical Failure:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
