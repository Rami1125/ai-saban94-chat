import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    
    // 1. חיפוש מוצר בהקשר השיחה (3 הודעות אחרונות)
    const contextSearch = messages.slice(-3).map((m: any) => m.content).join(" ");
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('product_name', contextSearch, { 
        config: 'hebrew', 
        type: 'websearch' 
      })
      .limit(1);

    const foundProduct = products && products.length > 0 ? products[0] : null;
    const productContext = foundProduct 
      ? `\n[מוצר מזוהה: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪]`
      : "";

    // 2. ניהול ה-API Keys
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    const lastUserMsg = messages[messages.length - 1].content;
    
    let aiResponse = "";
    let lastError = "";

    // לולאה על המפתחות
    for (const key of keyPool) {
      if (!key) continue;
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash", // המודל היציב ביותר
          systemInstruction: "אתה נציג ח. סבן. השתמש ב-<b> להדגשה וב-<br> לירידת שורה. אל תשתמש בכוכביות."
        });

        const result = await model.generateContent(lastUserMsg + productContext);
        aiResponse = result.response.text();
        
        if (aiResponse) {
          aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          break; // הצלחנו - יוצאים מהלולאה
        }
      } catch (e: any) {
        lastError = e.message;
        console.error(`Key failed: ${key.substring(0, 5)}... | Error: ${lastError}`);
        continue;
      }
    }

    if (!aiResponse) {
      throw new Error(`כל המפתחות נכשלו. שגיאה אחרונה: ${lastError}`);
    }

    // 3. עדכון Firebase לטובת הווטסאפ
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: aiResponse,
        timestamp: Date.now(),
        product: foundProduct
      });
    }

    // 4. החזרת תשובה תקינה לממשק
    return NextResponse.json({ 
      text: aiResponse, 
      product: foundProduct 
    });

  } catch (error: any) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
