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
    
    const body = await req.json().catch(() => ({}));
    const { messages, phone, userName } = body;
    const lastUserMsg = messages?.[messages.length - 1]?.content;

    if (!lastUserMsg) {
      return NextResponse.json({ error: "No query found" }, { status: 400 });
    }

    // --- 1. חיפוש מלאי חכם בטבלת inventory ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    
    // שליפת כל השדות (product_name, price, image_url, video_url, description, sku)
    const { data: product, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`)
      .order('stock_quantity', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) console.error("Supabase Error:", dbError.message);

    // --- 2. בניית ה-DNA המעודכן (Saban Intelligence DNA V5.2) ---
    const finalDNA = `
      אתה המוח הלוגיסטי של חמ"ל סבן חומרי בניין.
      המנהל והשותף שלך: ראמי.
      שם הלקוח הנוכחי: ${userName || 'לקוח'}.
      
      ### נתוני מוצר מהמערכת (JSON):
      ${product ? JSON.stringify(product) : "סטטוס: לא נמצא מוצר תואם במלאי כרגע."}
      
      ### חוקי הברזל למענה:
      1. **UI FIRST**: אם נמצא מוצר, פתח בתיאור קצר שלו. הממשק יציג את הכרטיס אוטומטית.
      2. **דיוק טכני**: שלוף מה-JSON מחיר, כמות ושימושים (אם קיימים).
      3. **מחשבון**: בלה חול = 700 ק"ג. לוח גבס = 3 מ"ר. דבק = 5 ק"ג למ"ר.
      4. **סגנון**: עברית מקצועית, פסקאות קצרות (עד 2 שורות), ללא חפירות.
      
      ### חתימה מחייבת:
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. מחכה לפקודה. 🦾
    `.trim();

    // --- 3. סבב מודלים יציב (Gemini 3.1) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 20);
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];
    
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
            console.error(`Skipping model ${modelName}`);
          }
        }
      } catch (e) {
        console.error("Key failure, rotating...");
      }
    }

    // --- 4. עדכון Firebase Pipeline (לצורך WhatsApp/Monitoring) ---
    if (phone && aiResponse) {
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
          text: aiResponse,
          product: product || null,
          timestamp: Date.now(),
          status: "pending"
        });
      } catch (fbError) {
        console.warn("Firebase update skipped");
      }
    }

    // --- 5. החזרת התשובה לממשק ---
    return NextResponse.json({ 
      answer: aiResponse || "מצטער ראמי, יש עומס במוח. נסה שוב בעוד רגע.", 
      product: product || null // חשוב מאוד: זה מה שמציג את כרטיס המוצר ב-chat7
    });

  } catch (error) {
    console.error("Critical System Failure:", error);
    return NextResponse.json({ error: "Internal System Error" }, { status: 500 });
  }
}
