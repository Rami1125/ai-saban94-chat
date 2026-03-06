import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 1. שליפת מידע מה-Inventory (ללא שינוי בדינמיקה)
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('product_name', lastUserMsg, { config: 'hebrew', type: 'websearch' })
      .limit(1);

    let productContext = "";
    let foundProduct = null;
    if (products && products.length > 0) {
      foundProduct = products[0];
      productContext = `\n[מצאתי במלאי: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪, SKU: ${foundProduct.sku}]`;
    }

    // 2. אתחול ה-AI עם הנחיית עיצוב HTML
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    
    let aiResponse = "";
    for (const key of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite-preview",
          systemInstruction: `אתה נציג ח. סבן. 
          חוק עיצוב קריטי: אל תשתמש בסימני ** להדגשה. 
          במקום זה, השתמש בתגיות <b>טקסט מודגש</b> עבור שמות מוצרים, מחירים או דגשים חשובים. 
          השתמש ב-<br> לירידת שורה.`
        });

        const result = await model.generateContent(lastUserMsg + productContext);
        aiResponse = result.response.text();
        
        // ניקוי שאריות כוכביות אם המודל שכח את עצמו
        aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        if (aiResponse) break;
      } catch (e) { continue; }
    }

    // 3. הזרקה לווטסאפ (ללא שינוי) ולממשק
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: aiResponse,
        timestamp: Date.now()
      });
    }

    return NextResponse.json({ 
      text: aiResponse, 
      product: foundProduct 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
