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

    // 1. שליפת DNA של העסק וחיפוש מוצר במלאי
    const [configRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku, price, unit_type')
        .or(`product_name.ilike.%${lastUserMsg}%,sku.ilike.%${lastUserMsg}%`)
        .limit(1)
        .maybeSingle()
    ]);

    const executorDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "נציג מכירות ח. סבן";

    const foundProduct = inventoryRes.data;

    // 2. ניהול מפתחות ומודלים - Key Pool
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-1.5-flash", "gemini-1.5-pro"]; // מודלים יציבים לשימוש ייצורי
    
    let aiResponse = "";
    let success = false;

    // 3. לוגיקת רוטציה בין מפתחות ומודלים
    for (const key of keys) {
      if (success) break;const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite-preview",
            systemInstruction: `
              ${executorDNA}
              
              תפקיד: מנהל מכירות ב-"ח. סבן חומרי בניין".
              סגנון: מקצועי, תכליתי ("תכל'ס"), אמין.
              
              --- כלי עבודה: כרטיס מוצר ---
              ${foundProduct ? `
              מצאתי במלאי מוצר רלוונטי:
              📦 *${foundProduct.product_name}*
              --------------------------------
              💰 מחיר: ₪${foundProduct.price} ${foundProduct.unit_type ? `ל-${foundProduct.unit_type}` : ""}
              ✅ סטטוס: ${foundProduct.stock_quantity > 0 ? "זמין במלאי" : "חסר זמנית - צור קשר לבדיקה"}
              🆔 מק"ט: ${foundProduct.sku}
              --------------------------------
              🔗 להזמנה ותשלום: MAGIC_URL
              ` : "לא נמצא מוצר ספציפי במלאי לשאילתה זו. ענה באופן כללי על מגוון חומרי הבניין שלנו."}

              הנחיות למענה:
              1. ענה בעברית פשוטה וישירה.
              2. אם יש foundProduct, הצג אותו בדיוק במבנה ה"כרטיס" שלמעלה.
              3. אם המשתמש שאל שאלה כללית, הצע לו עזרה בחישוב כמויות או הובלה.
              4. חתימה: תודה שבחרתה בח.סבן חומרי בנין.
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();
          
          if (responseText) {
            aiResponse = responseText;
            success = true;
          }
        } catch (e) {
          console.warn(`Key/Model error: ${modelName}. Trying next...`);
        }
      }
    }

    // 4. עיבוד סופי: החלפת לינקים ועדכון Firebase Pipeline
    if (foundProduct && aiResponse.includes("MAGIC_URL")) {
      const finalLink = foundProduct.product_magic_link || `https://saban.co.il/p/${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", finalLink);
    }

    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ 
      text: aiResponse || "אהלן, כאן ח.סבן. איך אפשר לעזור לכם היום בפרויקט?" 
    });

  } catch (error: any) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
