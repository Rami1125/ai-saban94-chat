import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

/**
 * פונקציית עזר לשליחה רשמית דרך Infobip
 * משתמשת ב-API Key וב-Base URL שהגדרת ב-Vercel
 */
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
          from: "447860099299", // מספר ה-Sandbox של Infobip
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

/**
 * פונקציית עזר להזרקת הודעה לנתיב הצינור החדש ב-Firebase
 */
async function pushToPipeline(to: string, text: string, productData: any = null) {
  const cleanPhone = to.replace('+', '');
  const pipelineRef = ref(rtdb, 'saban94/pipeline'); // הנתיב החדש שנבנה מ-0
  
  await push(pipelineRef, {
    to: cleanPhone,
    text: text,
    product: productData,
    timestamp: Date.now(),
    status: "pending"
  });
}

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    
    // 1. חיפוש מוצר ב-Inventory לפי הקשר השיחה
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

    // 2. רשימת מודלים לדילוג (Failover) מעודכן ל-2026
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

    // 3. מנגנון הדילוג על מפתחות ומודלים
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

    if (!aiResponse) throw new Error(`כל ניסיונות ה-AI נכשלו. שגיאה אחרונה: ${lastError}`);

    // 4. הפעלה של "הצינור הכפול" (Infobip + JONI)
    if (phone) {
      // א. שליחה רשמית במידה וזוהה מוצר
      if (foundProduct) {
        const officialMsg = `🏗️ *ח. סבן - כרטיס מוצר*\n*מוצר:* ${foundProduct.product_name}\n*מחיר:* ${foundProduct.price}₪\n\nשלום, מצורפים הפרטים שביקשת.`;
        await sendOfficialWhatsApp("972508861080", officialMsg);
      }

      // ב. הזרקה לנתיב הצינור החדש saban94/pipeline עבור JONI
      await pushToPipeline(phone, aiResponse, foundProduct);
    }

    return NextResponse.json({ text: aiResponse, product: foundProduct });

  } catch (error: any) {
    console.error("Critical API Failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
