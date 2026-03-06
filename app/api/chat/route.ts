import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

// פונקציית עזר לשליחה רשמית דרך Infobip
async function sendOfficialWhatsApp(to: string, text: string) {
  const url = `https://${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/text`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `App ${process.env.INFOBIP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          from: "447860099299", // המספר שקיבלת ב-Sandbox
          to: to.replace('+', ''),
          content: { text: text }
        }]
      })
    });
    return await response.json();
  } catch (err) {
    console.error("Infobip Error:", err);
    return null;
  }
}

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

    // 2. רשימת מודלים לדילוג (מעודכן ל-2026)
    const modelPool = [
      "gemini-3.1-flash-lite-preview", 
      "gemini-3.1-flash-preview",      
      "gemini-1.5-flash-latest"        
    ];

    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    const lastUserMsg = messages[messages.length - 1].content;
    
    let aiResponse = "";
    let lastError = "";

    // 3. מנגנון הדילוג הכפול
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
            break; 
          }
        } catch (e: any) {
          lastError = e.message;
          console.warn(`Model ${modelName} failed: ${lastError}`);
          continue; 
        }
      }
      if (aiResponse) break; 
    }

    if (!aiResponse) throw new Error(`נכשלו כל ניסיונות החיבור. שגיאה: ${lastError}`);

    // 4. שליחה רב-ערוצית (Infobip + JONI)
    if (phone) {
      const cleanPhone = phone.replace('+', '');
      
      // א. אם יש מוצר מזוהה - שלח כרטיס רשמי דרך Infobip (למספר שביקשת)
      if (foundProduct) {
        const officialMsg = `🏗️ *ח. סבן - כרטיס מוצר*\n*מוצר:* ${foundProduct.product_name}\n*מחיר:* ${foundProduct.price}₪\n\nשלום, מצורפים הפרטים לבקשתך.`;
        await sendOfficialWhatsApp("972508861080", officialMsg);
      }

      // ב. סנכרון ל-Firebase עבור JONI (הערוץ החינמי)
      await push(ref(rtdb, 'saban94/send'), {
        to: cleanPhone,
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
