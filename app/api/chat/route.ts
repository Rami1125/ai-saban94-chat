import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";
import { getRTDB } from "@/lib/firebase";
import { ref, update } from "firebase/database";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // 1. איתחול שירותים (בתוך ה-POST למניעת קריסת Build)
    const supabase = getSupabase();
    const rtdb = getRTDB();
    
    const { messages, phone, user_id } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 2. שליפת ה-DNA של העסק וחיפוש מוצר במקביל
    const [configRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku')
        .or(`product_name.ilike.%${lastUserMsg}%,sku.ilike.%${lastUserMsg}%`)
        .limit(1)
        .maybeSingle()
    ]);

    const executorDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "אתה נציג מכירות של ח. סבן חומרי בניין.";

    const foundProduct = inventoryRes.data;
    let stockAlert = "";
    if (foundProduct) {
      const stock = foundProduct.stock_quantity || 0;
      stockAlert = stock <= 0 ? "⚠️ חסר כרגע במלאי" : stock < 10 ? `⚠️ מלאי מוגבל: רק ${stock} יחידות!` : "זמין במלאי לאספקה מיידית";
    }

    // 3. ניהול ה-API Key Pool (מרץ 2026)
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];
    
    let aiResponse = "";
    let success = false;

    // 4. לוגיקת הרוטציה
    for (const key of keys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ${executorDNA}
              
              קונטקסט מלאי נוכחי:
              - מוצר שנמצא: ${foundProduct ? foundProduct.product_name : "לא זוהה מוצר ספציפי"}
              - סטטוס מלאי: ${stockAlert}
              - מק"ט: ${foundProduct?.sku || "N/A"}
              
              הנחיות קריטיות:
              1. ענה כנציג אנושי של ח. סבן (H.SABAN 1994). אל תגיד "אני מודל".
              2. אם הלקוח שואל על מוצר (כמו גבס/צבע), אשר שיש לנו במלאי גם אם לא נמצא מוצר מדויק.
              3. השתמש בשפה פשוטה, מקצועית וישירה.
              4. אם נמצא מוצר, בסוף התשובה הוסף את המילה MAGIC_URL.
              5. חתימה חובה בסוף כל הודעה: H.SABAN 1994
            `
          });

          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: lastUserMsg }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
          });

          aiResponse = result.response.text();
          if (aiResponse) { success = true; break; }
        } catch (e) {
          console.error(`Key/Model failed. Trying next...`);
        }
      }
    }

    // 5. עיבוד סופי: לינקים ו-Pipeline
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

    return NextResponse.json({ text: aiResponse || "מצטער, המערכת בעומס. נסה שוב בקרוב." });

  } catch (error: any) {
    console.error("Critical Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
