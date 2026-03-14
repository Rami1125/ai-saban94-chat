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
    
    // קריאת ה-Body עם הגנה מקריסה
    const body = await req.json().catch(() => ({}));
    const { messages, phone, userName } = body;
    const lastUserMsg = messages?.[messages.length - 1]?.content;

    if (!lastUserMsg) {
      return NextResponse.json({ error: "No query found" }, { status: 400 });
    }

    // --- 1. חיפוש מלאי חכם (Saban Smart Search) ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    const { data: product } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`)
      .limit(1)
      .maybeSingle();

    // --- 2. בניית ה-DNA המעודכן (Saban Intelligence V5.1) ---
    const finalDNA = `
      אתה המוח הלוגיסטי של חמ"ל סבן.
      המנהל: ראמי.
      שם הלקוח הנוכחי: ${userName || 'לקוח'}.
      נתוני מוצר מהמערכת: ${product ? JSON.stringify(product) : "לא נמצא מוצר תואם במלאי"}.
      
      חוקי ברזל:
      - אם יש מוצר, שלוף נתונים טכניים (משקל, שימוש).
      - ענה בעברית מקצועית, קצרה וקולעת.
      - חתימה: "תודה, ומה תרצה שנבצע היום? ראמי, הכל מוכן לביצוע. 🦾"
    `.trim();

    // --- 3. סבב מודלים יציב (Gemini 3.1 - תיקון ה-404) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 20);
    
    // מודלים של סדרת 3.1 (היחידים שפעילים ב-v1beta עכשיו)
    const modelPool = [
      "gemini-3.1-flash-lite-preview", 
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview"
    ];
    
    let aiResponse = "";
    let success = false;

    for (const key of keys) {
      if (success) break;
      try {
        const genAI = new GoogleGenerativeAI(key);
        for (const modelName of modelPool) {
          if (success) break;
          try {
            const model = genAI.getGenerativeModel({ 
              model: modelName, 
              systemInstruction: finalDNA 
            });
            const result = await model.generateContent(lastUserMsg);
            aiResponse = result.response.text();
            if (aiResponse) success = true;
          } catch (e) {
            console.error(`Skipping model ${modelName} due to error`);
          }
        }
      } catch (e) {
        console.error("Key failure, rotating...");
      }
    }

    // --- 4. סנכרון Firebase (WhatsApp Pipeline) ---
    if (phone && aiResponse) {
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
          text: aiResponse,
          timestamp: Date.now(),
          status: "pending"
        });
      } catch (fbError) {
        console.warn("Firebase update skipped (check rules)");
      }
    }

    return NextResponse.json({ 
      answer: aiResponse || "מצטער, יש עומס במוח. נסה שוב בעוד רגע.", 
      product: product || null 
    });

  } catch (error) {
    console.error("Critical System Failure:", error);
    return NextResponse.json({ error: "Internal System Error" }, { status: 500 });
  }
}
