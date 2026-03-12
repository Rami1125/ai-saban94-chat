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
      if (success) break;const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite-preview",
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
    }

    הנחיות למענה:
    1. אם נמצא מוצר (foundProduct): תציג אותו בפירוט כולל המחיר והלינק. אל תהיה כללי.
    2. אם לא נמצא מוצר ספציפי: תגיד "בוודאי שיש לנו [שם המוצר]", ותשאל מה הכמות הנדרשת.
    3. שפה: ישירה, קצרה, בלי "שלום רב". סגנון של "רמי": 'בטח שיש גבס, כמה לוחות אתה צריך?'.
    4. בסוף כל הצגת מוצר, אם יש לינק, תכתוב: "תוכל להזמין כאן: MAGIC_URL".
    5. חתימה קבועה: תודה שבחרתה בח.סבן חומרי בנין .
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
