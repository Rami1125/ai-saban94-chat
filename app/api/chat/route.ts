import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

async function pushToPipeline(to: string, text: string, productData: any = null) {
  const cleanPhone = to.replace('+', '').trim();
  const pipelineRef = ref(rtdb, 'saban94/pipeline'); 
  await push(pipelineRef, { to: cleanPhone, text, product: productData, timestamp: Date.now(), status: "pending" });
}

async function callSidorConsultant(message: string) {
  try {
    // הוספת Timeout קצר כדי שהצ'אט לא יתקע אם היועץ לא זמין
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
    return null; // ממשיך הלאה גם אם היועץ נפל
  }
}
export async function POST(req: Request) {
  try {
    const { messages, phone, user_id } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 1. שליפת חוקי ה-DNA של הביצועיסט
    const { data: rules } = await supabase.from('system_rules')
      .select('instruction').eq('agent_type', 'executor').eq('is_active', true);
    const executorDNA = rules?.map(r => r.instruction).join("\n") || "";

    // 2. התייעצות טכנית
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

    // 4. הפעלת מודל Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: `אתה נציג ח. סבן. הנחיות ביצוע: ${executorDNA}
      מידע טכני מהיועץ: ${technicalInsight}
      - במידה ויש התראת מלאי, שלב אותה בצורה ברורה.
      - אם זו רשימה, שלח לינק לתיקוף: https://sidor.vercel.app/validation/
      - חתימה: H.SABAN 1994 | AI Logistics System`
    });

    const result = await model.generateContent(lastUserMsg + (stockAlert ? `\nהערת מלאי חשובה: ${stockAlert}` : ""));
    let aiResponse = result.response.text();

    // 5. הזרקת לינקים וניקוי
    if (foundProduct) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link);
    }
    
    // אם ה-AI לא שילב את ההתראה באופן טבעי, נוסיף אותה בסוף
    if (stockAlert && !aiResponse.includes("מלשינון")) {
      aiResponse += stockAlert;
    }

    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // 6. שליחה ל-Pipeline
    if (phone) {
      await pushToPipeline(phone, aiResponse, foundProduct);
      const chatRef = ref(rtdb, 'chat-sidor');
      await push(chatRef, { text: aiResponse, sender: 'ai', timestamp: Date.now() });
    }

    return NextResponse.json({ text: aiResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
