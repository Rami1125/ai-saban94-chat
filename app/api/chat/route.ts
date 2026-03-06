import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    
    // 1. סריקת הקשר (Context) - לוקחים את 3 ההודעות האחרונות לחיפוש מוצר
    const contextSearch = messages.slice(-3).map((m: any) => m.content).join(" ");

    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('product_name', contextSearch, { 
        config: 'hebrew', 
        type: 'websearch' 
      })
      .limit(1);

    let foundProduct = products && products.length > 0 ? products[0] : null;
    let productContext = foundProduct 
      ? `\n[מידע על המוצר בשיחה: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪, SKU: ${foundProduct.sku}]`
      : "";

    // 2. אתחול ה-AI עם Key Pool
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    const lastUserMsg = messages[messages.length - 1].content;
    
    let aiResponse = "";

    // לולאת ה-Keys - מחפשת מפתח עובד
    for (const key of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash", // וודא שהמודל תואם לגרסה שלך
          systemInstruction: `אתה נציג ח. סבן. אל תשתמש ב-** להדגשה. השתמש ב-<b>טקסט</b> וב-<br> לירידת שורה.`
        });

        const result = await model.generateContent(lastUserMsg + productContext);
        aiResponse = result.response.text();
        
        // ניקוי כוכביות שאריות ל-HTML
        aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        if (aiResponse) break; // אם הצלחנו, יוצאים מהלולאה
      } catch (e) {
        console.error("Key failed, trying next...");
        continue;
      }
    }

    if (!aiResponse) throw new Error("כל המפתחות נכשלו או שאין תגובה מה-AI");

    // 3. הזרקה ל-Firebase (WhatsApp Send)
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: aiResponse,
        timestamp: Date.now(),
        product: foundProduct // שומרים את ההקשר גם ב-DB
      });
    }

    // 4. החזרת התשובה (מחוץ לכל לולאה!)
    return NextResponse.json({ 
      text: aiResponse, 
      product: foundProduct 
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
