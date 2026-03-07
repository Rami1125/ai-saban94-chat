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

// פונקציית תקשורת עם ה"יועץ" (gemini.js) בתוך מאגר SIDOR
async function consultWithTechnicalAdvisor(message: string) {
  try {
    const response = await fetch(`https://sidor.vercel.app/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context: "logistics_validation" })
    });
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Advisor Communication Failed:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, phone, user_id } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;
    
    // 1. תקשורת בין מפתחות: התייעצות עם ה"יועץ" ב-SIDOR
    const advisorData = await consultWithTechnicalAdvisor(lastUserMsg);
    const technicalTip = advisorData?.reply || "";

    // 2. שליפת חוקים דינמיים מה-Supabase
    const { data: dbRules } = await supabase
      .from('system_rules')
      .select('instruction')
      .eq('is_active', true);
    const customInstructions = dbRules?.map(r => r.instruction).join("\n") || "";

    // 3. זיהוי מוצר ולינק קסם מהמלאי
    const { data: products } = await supabase
      .from('inventory')
      .select('*, product_magic_link')
      .textSearch('product_name', lastUserMsg, { config: 'hebrew', type: 'websearch' })
      .limit(1);
    const foundProduct = products?.[0] || null;

    // 4. בריכת מודלים ומפתחות (Failover)
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-3-flash-preview"];
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim()).filter(k => k !== "");
    
    let aiResponse = "";
    let lastError = "";

    for (const key of keyPool) {
      const genAI = new GoogleGenerativeAI(key);
      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: `אתה נציג רשמי של ח. סבן 1994 בע"מ. זהות המשתמש: ${user_id || 'לקוח'}.
            
            הנחיות בעל הבית:
            ${customInstructions}
            
            מידע טכני מהיועץ (SIDOR):
            ${technicalTip}
            
            חוקי פורמט:
            - השתמש ב-<b> להדגשות וב-<br> לירידת שורה.
            - אם המשתמש שלח רשימת מוצרים מבולגנת, הפנה אותו לתקף אותה כאן:
              <a href="https://sidor.vercel.app/validation/" style="display:block; background:#1e293b; color:white; padding:10px; border-radius:10px; text-align:center; margin-top:10px;">📋 לחץ כאן לתיקוף ואישור הרשימה</a>
            
            - אם נמצא מוצר בודד, הזרק כפתור MAGIC_URL:
              <a href="MAGIC_URL" style="display:block; background:#059669; color:white; padding:12px; border-radius:15px; text-align:center; text-decoration:none; font-weight:bold; margin-top:15px; border:2px solid #10b981;">👁️ לצפייה במפרט טכני ומחשבון</a>
            
            חתימה: H.SABAN 1994 | AI Logistics System`
          });

          const result = await model.generateContent(lastUserMsg);
          aiResponse = result.response.text();
          if (aiResponse) break; 
        } catch (e: any) {
          lastError = e.message;
          continue; 
        }
      }
      if (aiResponse) break; 
    }

    if (!aiResponse) throw new Error("AI Fail: " + lastError);

    // 5. הזרקת לינקים וניקוי
    if (foundProduct) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link);
    }
    aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // 6. תיעוד ושליחה
    if (phone) {
      await pushToPipeline(phone, aiResponse, foundProduct);
      const chatSidorRef = ref(rtdb, 'chat-sidor');
      await push(chatSidorRef, { text: aiResponse, sender: 'ai', user_name: 'סבן-AI', timestamp: Date.now() });
    }

    return NextResponse.json({ text: aiResponse, product: foundProduct });

  } catch (error: any) {
    console.error("Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
