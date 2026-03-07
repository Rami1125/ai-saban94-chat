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

// פונקציית התקשורת עם ה"יועץ" (SIDOR)
async function callSidorConsultant(message: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); 

    const res = await fetch(`https://sidor.vercel.app/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { 
    console.error("Advisor Communication Failed or Timed out");
    return null; 
  }
}

export async function POST(req: Request) {
  try {
    const { messages, phone, user_id } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 1. שליפת חוקי ה-DNA של הביצועיסט מה-Supabase
    const { data: rules } = await supabase.from('system_rules')
      .select('instruction').eq('agent_type', 'executor').eq('is_active', true);
    const executorDNA = rules?.map(r => r.instruction).join("\n") || "";

    // 2. התייעצות טכנית עם היועץ ב-SIDOR
    let technicalInsight = "";
    if (lastUserMsg.includes("איך") || lastUserMsg.includes("כמה") || lastUserMsg.length > 30) {
        const advisorResponse = await callSidorConsultant(lastUserMsg);
        technicalInsight = advisorResponse?.reply || "";
    }

    // 3. חיפוש מוצר ובדיקת "מלשינון מלאי"
    const { data: products } = await supabase.from('inventory')
      .select('*, product_magic_link, stock_quantity')
      .textSearch('product_name', lastUserMsg, { config: 'hebrew' })
      .limit(1);
    
    const foundProduct = products?.[0] || null;
    let stockAlert = "";

    if (foundProduct) {
      const stock = foundProduct.stock_quantity || 0;
      if (stock <= 0) {
        stockAlert = `\n\n⚠️ **מלשינון מלאי:** שימו לב, ${foundProduct.product_name} חסר כרגע במלאי בחרש 10. מומלץ להתייעץ על חלופה.`;
      } else if (stock < 10) {
        stockAlert = `\n\n⚠️ **מלאי מוגבל:** נותרו רק ${stock} יחידות אחרונות מהמוצר הזה.`;
      }
    }

    // 4. בריכת מודלים Gemini 3.1 (Failover) לניצול מכסה מקסימלית
    const modelPool = [
      "gemini-3.1-flash-lite-preview", // עדיפות 1: הכי חסכוני ומהיר
      "gemini-3.1-flash-preview",      // עדיפות 2: יציב
      "gemini-3.1-pro-preview"         // עדיפות 3: חכם
    ];

    let aiResponse = "";
    const apiKey = process.env.GEMINI_API_KEY || "";

    for (const modelName of modelPool) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: `אתה נציג ח. סבן 1994. זהות המשתמש: ${user_id || 'לקוח'}.
          הנחיות ביצוע: ${executorDNA}
          מידע טכני מהיועץ (SIDOR): ${technicalInsight}
          - במידה ויש התראת מלאי, שלב אותה בצורה ברורה בתוך התשובה.
          - אם זו רשימת מוצרים, שלח לינק לתיקוף: https://sidor.vercel.app/validation/
          - חתימה מחויבת: H.SABAN 1994 | AI Logistics System`,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        });

        const result = await model.generateContent(
          lastUserMsg + (stockAlert ? `\nהערת מלאי קריטית: ${stockAlert}` : "")
        );
        
        aiResponse = result.response.text();
        if (aiResponse) break; 
      } catch (e) {
        console.warn(`Model ${modelName} reached quota, trying next...`);
        continue;
      }
    }

    if (!aiResponse) {
      aiResponse = "רמי, המערכת עמוסה כרגע. אני מעבד את הבקשה שלך באופן ידני, נא להמתין.";
    }

    // 5. הזרקת לינקים, ניקוי והתראות מלאי
    if (foundProduct) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link);
      
      if (stockAlert && !aiResponse.includes("מלאי") && !aiResponse.includes("מלשינון")) {
        aiResponse += stockAlert;
      }
    }

    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // 6. שליחה ל-Pipeline ותיעוד ב-RTDB
    if (phone) {
      await pushToPipeline(phone, aiResponse, foundProduct);
      const chatRef = ref(rtdb, 'chat-sidor');
      await push(chatRef, { text: aiResponse, sender: 'ai', timestamp: Date.now() });
    }

    return NextResponse.json({ text: aiResponse });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
