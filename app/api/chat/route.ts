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

    // --- 1. חיפוש מלאי חכם (התאמה למבנה הטבלה החדש) ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    
    const { data: product, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%,search_text.ilike.%${cleanSearch}%`)
      .order('stock_quantity', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) console.error("Supabase Error:", dbError.message);

    // --- 2. בניית ה-DNA המעודכן (Saban Intelligence DNA V6 - Magic Link Edition) ---
    const finalDNA = `
      אתה המוח הלוגיסטי המבצעי של חמ"ל סבן חומרי בניין. המנהל שלך: ראמי.
      שם הלקוח: ${userName || 'לקוח'}.
      
      ### נתוני מוצר מזהים (מהטבלה):
      ${product ? JSON.stringify({
        name: product.product_name,
        price: product.price,
        sku: product.sku,
        link: product.product_magic_link, // לינק הקסם
        features: product.features,
        description: product.description,
        coverage: product.coverage,
        video: product.video_url || product.youtube_url
      }) : "סטטוס: מוצר לא נמצא במלאי."}
      
      ### הנחיות שליפה וביצוע:
      1. **לינק הקסם (Magic Link)**: אם נמצא מוצר ויש לו 'product_magic_link', חובה להציג אותו בסוף התשובה כפתור או לינק בולט: "לרכישה מהירה ופרטים נוספים לחץ כאן: [לינק]".
      2. **מפרט טכני**: שלוף את ה-features (מערך) והצג אותם כבולטים עם אימוג'י ✅.
      3. **כושר כיסוי**: אם קיים 'coverage', ציין אותו במפורש עבור הלקוח.
      4. **וידאו**: אם יש 'youtube_url' או 'video_url', ציין שיש סרטון הדרכה זמין בכרטיס.
      
      ### חוקי עיצוב:
      - עברית סמכותית, קצרה, ללא הקדמות "שלום רב".
      - רווח כפול בין פסקאות.
      - חתימה: "תודה, ומה תרצה שנבצע היום? ראמי, הכל מוכן לביצוע. 🦾"
    `.trim();

    // --- 3. סבב מודלים Gemini 3.1 ---
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
            const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: finalDNA });
            const result = await model.generateContent(lastUserMsg);
            aiResponse = result.response.text();
            if (aiResponse) success = true;
          } catch (e) { console.error(`Error with ${modelName}`); }
        }
      } catch (e) { console.error("Key failure"); }
    }

    // --- 4. עדכון Firebase ---
    if (phone && aiResponse) {
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
          text: aiResponse,
          product_link: product?.product_magic_link || null,
          timestamp: Date.now()
        });
      } catch (fbError) { console.warn("Firebase skip"); }
    }

    // --- 5. תגובה סופית ---
    return NextResponse.json({ 
      answer: aiResponse || "מצטער ראמי, המוח עמוס. נסה שוב.", 
      product: product || null 
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
