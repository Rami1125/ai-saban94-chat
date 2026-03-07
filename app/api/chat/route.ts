import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

// פונקציית עזר להזרקת הודעה ל-JONI Pipeline
async function pushToPipeline(to: string, text: string, productData: any = null) {
  const cleanPhone = to.replace('+', '').trim();
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
    const { messages, phone, user_id } = await req.json();
    
    // 1. שליפת חוקים דינמיים מהמוח של רמי ב-Supabase
    const { data: dbRules } = await supabase
      .from('system_rules')
      .select('instruction')
      .eq('is_active', true);
    const customInstructions = dbRules?.map(r => r.instruction).join("\n") || "";

    // 2. זיהוי מוצר ולינק קסם מהמלאי
    const lastUserMsg = messages[messages.length - 1].content;
    const { data: products } = await supabase
      .from('inventory')
      .select('*, product_magic_link')
      .textSearch('product_name', lastUserMsg, { config: 'hebrew', type: 'websearch' })
      .limit(1);
    const foundProduct = products?.[0] || null;

    // 3. בריכת מודלים Gemini 3.1 (מרץ 2026)
    const modelPool = [
      "gemini-3.1-flash-lite-preview",
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview"
    ];

    // 4. ניהול בריכת מפתחות (Failover)
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim()).filter(k => k !== "");
    
    let aiResponse = "";
    let lastError = "";

    // 5. לוגיקת הרצה ודילוג בין מפתחות ומודלים
    for (const key of keyPool) {
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: `אתה נציג רשמי של ח. סבן 1994 בע"מ. 
            זהות המשתמש כרגע: ${user_id || 'לקוח כללי'}.
            
            הנחיות מחייבות מבעל הבית:
            ${customInstructions}
            
            חוקי פורמט והנעה לפעולה (CTA):
            - השתמש ב-<b> להדגשות וב-<br> לירידת שורה.
            - בסיום כל תשובה, הוסף הנעה לפעולה רלוונטית לפי ההקשר.
            - אם נמצא לינק מוצר, הזרק אותו ככפתור HTML עם MAGIC_URL.
            - חתימה בסוף ההודעה: Sent via JONI-Pipeline`
          });

          const prompt = foundProduct 
            ? `${lastUserMsg}\n(מידע מלאי: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪, לינק: ${foundProduct.product_magic_link})`
            : lastUserMsg;

          const result = await model.generateContent(prompt);
          aiResponse = result.response.text();
          
          if (aiResponse) break; 
        } catch (e: any) {
          lastError = e.message;
          continue; 
        }
      }
      if (aiResponse) break; 
    }

    if (!aiResponse) {
        throw new Error("AI failed to generate response: " + lastError);
    }

    // 6. הזרקת לינק הקסם וניקוי HTML
    if (foundProduct && foundProduct.product_magic_link) {
        aiResponse = aiResponse.replace("MAGIC_URL", foundProduct.product_magic_link);
    }
    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // 7. שליחה ל-Pipeline ותיעוד
    if (phone) {
      await pushToPipeline(phone, aiResponse, foundProduct);
      
      const chatSidorRef = ref(rtdb, 'chat-sidor');
      await push(chatSidorRef, {
          text: aiResponse,
          sender: 'ai',
          user_name: 'סבן-AI',
          timestamp: Date.now()
      });
    }

    return NextResponse.json({ text: aiResponse, product: foundProduct });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
