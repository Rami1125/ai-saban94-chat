import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    
    // 1. סריקת הקשר (Context) - 3 הודעות אחרונות לזיהוי מוצר (גבס/סיקה)
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
      ? `\n[מוצר מזוהה בשיחה: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪, SKU: ${foundProduct.sku}]`
      : "";

    // 2. הגדרת המודל לפי הטבלה שלך (Gemini 3.1 Flash Lite)
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    const lastUserMsg = messages[messages.length - 1].content;
    
    let aiResponse = "";
    let lastError = "";

    for (const key of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite", // המודל עם ה-4,000 RPM מהטבלה שלך
          systemInstruction: `אתה נציג מכירות מקצועי של ח. סבן. 
          חוקים:
          1. אל תשתמש ב-** להדגשה. השתמש ב-<b>טקסט</b>.
          2. השתמש ב-<br> לירידת שורה.
          3. תמיד הצע עזרה בחישוב כמויות או הצעת מחיר.`
        });

        // הגדרות בטיחות למניעת חסימות שווא
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: lastUserMsg + productContext }] }],
          generationConfig: { maxOutputTokens: 1000 }
        });

        aiResponse = result.response.text();
        
        // ניקוי כוכביות אם המודל חרג מההנחיות
        aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        if (aiResponse) break; 
      } catch (e: any) {
        lastError = e.message;
        console.error(`Key failed: ${key.substring(0,5)} | Error: ${lastError}`);
        continue;
      }
    }

    if (!aiResponse) throw new Error(`כל המפתחות נכשלו. שגיאה: ${lastError}`);

    // 3. סנכרון ל-Firebase
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: aiResponse,
        timestamp: Date.now(),
        product: foundProduct 
      });
    }

    // 4. תשובה ל-Frontend (מעדכן את הצ'אט ואת ה-ActionOverlays)
    return NextResponse.json({ 
      text: aiResponse, 
      product: foundProduct 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
