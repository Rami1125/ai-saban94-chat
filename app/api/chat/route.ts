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

// פונקציית התקשורת בין סוכנים
async function callSidorConsultant(message: string) {
  try {
    const res = await fetch(`https://sidor.vercel.app/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    return await res.json();
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const { messages, phone, user_id } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 1. שליפת חוקי ה-DNA של הביצועיסט מהטבלה החדשה
    const { data: rules } = await supabase.from('system_rules')
      .select('instruction').eq('agent_type', 'executor').eq('is_active', true);
    const executorDNA = rules?.map(r => r.instruction).join("\n") || "";

    // 2. בדיקה האם נדרשת התייעצות טכנית (התקשורת בין הסוכנים)
    let technicalInsight = "";
    if (lastUserMsg.includes("איך") || lastUserMsg.includes("כמה") || lastUserMsg.length > 30) {
        const advisorResponse = await callSidorConsultant(lastUserMsg);
        technicalInsight = advisorResponse?.reply || "";
    }

    // 3. חיפוש מוצר במלאי
    const { data: products } = await supabase.from('inventory')
      .select('*, product_magic_link').textSearch('product_name', lastUserMsg, { config: 'hebrew' }).limit(1);
    const foundProduct = products?.[0] || null;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: `אתה נציג ח. סבן. הנחיות ביצוע: ${executorDNA}
      מידע טכני מהיועץ: ${technicalInsight}
      - אם זו רשימה, שלח לינק לתיקוף: https://sidor.vercel.app/validation/
      - חתימה: H.SABAN 1994 | AI Logistics System`
    });

    const result = await model.generateContent(lastUserMsg);
    let aiResponse = result.response.text();

    // הזרקת לינקים
    if (foundProduct) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link);
    }

    if (phone) {
      await pushToPipeline(phone, aiResponse, foundProduct);
    }

    return NextResponse.json({ text: aiResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
