import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

// פונקציית עזר להזרקת הודעה ל-JONI
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
    const { messages, phone } = await req.json();
    
    // 1. שליפת חוקים מ-Supabase (המוח של רמי)
    const { data: dbRules } = await supabase
      .from('system_rules')
      .select('instruction')
      .eq('is_active', true);
    const customInstructions = dbRules?.map(r => r.instruction).join("\n") || "";

    // 2. זיהוי מוצר מהמלאי
    const lastUserMsg = messages[messages.length - 1].content;
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('product_name', lastUserMsg, { config: 'hebrew', type: 'websearch' })
      .limit(1);
    const foundProduct = products?.[0] || null;

// מבוסס על עדכוני ינואר-מרץ 2026: השמות היציבים ביותר כרגע
const modelPool = [
  "gemini-3-flash-preview",   // המהיר והחכם ביותר לסדרת Gemini 3
  "gemini-3.1-flash-lite-preview", // המודל החדש ביותר (הושק לפני 3 ימים!)
  "gemini-3.1-pro-preview"    // לחישובים לוגיסטיים מורכבים
];
    // 4. בריכת מפתחות (מ-Environment Variables)
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim()).filter(k => k !== "");
    
    let aiResponse = "";
    let lastError = "";

    // 5. מנגנון הדילוג (Failover Logic)
    for (const key of keyPool) {
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: `אתה נציג רשמי של ח. סבן 1994 בע"מ.
            הנחיות מחייבות מבעל הבית:
            ${customInstructions}
            
            חוקי פורמט:
            - הדגשות ב-<b> בלבד.
            - ירידת שורה ב-<br>.
            - בסוף כל הודעה חובה לכתוב: תודה מסבן-AI`
          });

          const prompt = foundProduct 
            ? `${lastUserMsg}\n(מידע מהמלאי: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪)`
            : lastUserMsg;

          const result = await model.generateContent(prompt);
          aiResponse = result.response.text();
          
          if (aiResponse) break; 
        } catch (e: any) {
          lastError = e.message;
          console.warn(`ניסיון כשל עם ${modelName}: ${lastError}`);
          continue; 
        }
      }
      if (aiResponse) break; 
    }

    if (!aiResponse) {
      return NextResponse.json({ error: "כל המודלים והמפתחות כשלו. בדוק מפתחות API ב-Vercel." }, { status: 500 });
    }

    // 6. ניקוי כוכביות (ליתר ביטחון)
    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // 7. הזרקה ל-JONI ולסטודיו
    if (phone) {
      await pushToPipeline(phone, aiResponse, foundProduct);
    }

    return NextResponse.json({ text: aiResponse, product: foundProduct });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
