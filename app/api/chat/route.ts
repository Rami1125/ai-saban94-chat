import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";
import { getRTDB } from "@/lib/firebase";
import { ref, update } from "firebase/database";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const rtdb = getRTDB();
    
    const { messages, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 1. חיפוש DNA ומלאי
    const [configRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku, price')
        .or(`product_name.ilike.%${lastUserMsg}%,sku.ilike.%${lastUserMsg}%`)
        .limit(1)
        .maybeSingle()
    ]);

    const executorDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "נציג מכירות ח. סבן";

    const foundProduct = inventoryRes.data;

    // 2. ניהול מפתחות ומודלים (מעודכן למרץ 2026)
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];
    
    let aiResponse = "";
    let success = false;

    // 3. לוגיקת הרוטציה
    for (const key of keys) {
      if (success) break;
      
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        if (success) break;
        
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
  systemInstruction: `
    אתה נציג המכירות הדיגיטלי של "ח. סבן חומרי בניין". 
    המטרה שלך: למכור ולהיות פרקטי.
    
    כלי עבודה קריטי - חיפוש במלאי:
    ${foundProduct ? 
      `נמצא מוצר רלוונטי במלאי:
       שם: ${foundProduct.product_name}
       מחיר: ${foundProduct.price} ש"ח
       סטטוס: ${foundProduct.stock_quantity > 0 ? "זמין במלאי" : "חסר זמנית"}
       לינק לרכישה: ${foundProduct.product_magic_link}` 
      : "לא נמצא מוצר ספציפי בשאילתה, אבל יש לנו הכל במחסן."
    }  `
          });

          const result = await model.generateContent(lastUserMsg);
          const text = result.response.text();
          
          if (text) {
            aiResponse = text;
            success = true;
          }
        } catch (e) {
          console.warn(`Failed with model ${modelName}, trying next...`);
        }
      }
    }

    // 4. עיבוד לינקים ועדכון Pipeline
    if (foundProduct && aiResponse.includes("MAGIC_URL")) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product?sku=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link);
    }

    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ text: aiResponse || "המערכת זמינה, איך אפשר לעזור?" });

  } catch (error: any) {
    console.error("Critical Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
