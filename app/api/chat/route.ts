import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    
    // 1. שמירה על הקשר (Context) - חיפוש מוצר ב-3 הודעות אחרונות
    const contextSearch = messages.slice(-3).map((m: any) => m.content).join(" ");
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('product_name', contextSearch, { config: 'hebrew', type: 'websearch' })
      .limit(1);

    const foundProduct = products && products.length > 0 ? products[0] : null;
    const productContext = foundProduct 
      ? `\n[הקשר מוצר נוכחי: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪]` 
      : "";

    // 2. רשימת מודלים לדילוג (לפי סדר עדיפות מעודכן ל-2026)
    const modelPool = [
      "gemini-3.1-flash-lite-preview", // הכי חדש ומהיר (מרץ 2026)
      "gemini-3.1-flash-preview",      // יציב וחזק
      "gemini-3-flash-preview",        // גיבוי סדרה 3
      "gemini-1.5-flash-latest"        // ה-Fallback הסופי והבטוח
    ];

    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    const lastUserMsg = messages[messages.length - 1].content;
    
    let aiResponse = "";
    let lastError = "";

    // 3. מנגנון הדילוג הכפול: גם על מפתחות וגם על מודלים
    for (const key of keyPool) {
      if (!key) continue;
      
      const genAI = new GoogleGenerativeAI(key);

      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: "אתה נציג ח. סבן. השתמש ב-<b> להדגשה וב-<br> לירידת שורה. אל תשתמש ב-**."
          });

          const result = await model.generateContent(lastUserMsg + productContext);
          aiResponse = result.response.text();
          
          if (aiResponse) {
            aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            break; // הצלחנו עם המודל הזה!
          }
        } catch (e: any) {
          lastError = e.message;
          console.warn(`Model ${modelName} failed with key ${key.substring(0,5)}: ${lastError}`);
          continue; // נכשל? נסה את המודל הבא ברשימה
        }
      }
      if (aiResponse) break; // הצלחנו עם המפתח הזה!
    }

    if (!aiResponse) throw new Error(`נכשלו כל ניסיונות החיבור. שגיאה אחרונה: ${lastError}`);

    // 4. סנכרון לווטסאפ דרך Firebase
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: aiResponse,
        timestamp: Date.now(),
        product: foundProduct
      });
    }

    return NextResponse.json({ text: aiResponse, product: foundProduct });

  } catch (error: any) {
    console.error("Critical API Failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
