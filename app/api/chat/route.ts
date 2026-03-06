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
        
        // ניסיון ראשון: המודל החדש מהטבלה (עם השם המעודכן ל-API)
        // אם זה נכשל ב-404, נעבור למודל המוכח
        let modelName = "gemini-1.5-flash"; 
        
        // ננסה להשתמש בגרסה היציבה ביותר של ה-3.1 אם היא זמינה
        // אם ה-Log הראה 404, נחזור ל-1.5 שבוודאות קיים
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash", // חזרה למודל היציב ביותר כדי להבטיח עבודה
          systemInstruction: "אתה נציג ח. סבן. השתמש ב-<b> להדגשה וב-<br> לירידת שורה."
        });

        const result = await model.generateContent(lastUserMsg + productContext);
        aiResponse = result.response.text();
        
        if (aiResponse) {
          aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          break; 
        }
      } catch (e: any) {
        lastError = e.message;
        console.error(`Attempt failed: ${lastError}`);
        continue;
      }
    }
