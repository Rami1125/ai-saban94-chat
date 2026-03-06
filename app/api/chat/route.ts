import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

/**
 * פונקציית עזר לשליחה רשמית דרך Infobip
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
          from: "447860099299", 
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
 * פונקציית עזר להזרקת הודעה לנתיב הצינור החדש ב-Firebase עבור JONI
 */
async function pushToPipeline(to: string, text: string, productData: any = null) {
  const cleanPhone = to.replace('+', '');
  const pipelineRef = ref(rtdb, 'saban94/pipeline'); 
  
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
    
    // 1. שליפת ספר החוקים וההנחיות מה-Supabase (התשתית החדשה שלך)
    const { data: dbRules } = await supabase
      .from('system_rules')
      .select('instruction')
      .eq('is_active', true);

    const customInstructions = dbRules?.map(r => r.instruction).join("\n") || "";

    // 2. חיפוש מוצר ב-Inventory לפי הקשר השיחה
    const contextSearch = messages.slice(-3).map((m: any) => m.content).join(" ");
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('product_name', contextSearch, { config: 'hebrew', type: 'websearch' })
      .limit(1);

    const foundProduct = products && products.length > 0 ? products[0] : null;
    const productContext = foundProduct 
      ? `\n[הקשר מוצר מהמלאי: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪]` 
      : "";

    // 3. מודלים ודילוג מעודכן 2026
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

    // 4. לוגיקת ה-AI עם הזרקת ספר החוקים
    for (const key of keyPool) {
      if (!key) continue;
      const genAI = new GoogleGenerativeAI(key);

      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: `אתה נציג רשמי של ח. סבן 1994 בע"מ. עליך לפעול בדיוק לפי ספר החוקים הבא:
            ${customInstructions}
            
            דגשי פורמט:
            - השתמש ב-<b> להדגשה וב-<br> לירידת שורה.
            - אל תשתמש בסימני כוכבית (**).
            - תמיד חתום בסוף ב: sent via JONI`
          });

          const result = await model.generateContent(lastUserMsg + productContext);
          aiResponse = result.response.text();
          
          if (aiResponse) break; 
        } catch (e: any) {
          lastError = e.message;
          console.warn(`Model ${modelName} failed: ${lastError}`);
          continue; 
        }
      }
      if (aiResponse) break; 
    }

    if (!aiResponse) throw new Error(`כשלו כל ניסיונות ה-AI. שגיאה: ${lastError}`);

    // 5. ניקוי ועיבוד סופי של הטקסט
    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // 6. הפעלת הצינור (Infobip + JONI)
    if (phone) {
      if (foundProduct) {
        const officialMsg = `🏗️ *ח. סבן - כרטיס מוצר*\n*מוצר:* ${foundProduct.product_name}\n*מחיר:* ${foundProduct.price}₪\n\nשלום, מצורפים הפרטים שביקשת.`;
        // שליחה למספר ספציפי או לטלפון של הלקוח
        await sendOfficialWhatsApp(phone, officialMsg);
      }

      // הזרקה ל-Pipeline עבור התוסף ו-Studio
      await pushToPipeline(phone, aiResponse, foundProduct);
    }

    return NextResponse.json({ text: aiResponse, product: foundProduct });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
