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
    const body = await req.json();
    const { messages, phone, userName } = body;
    const lastUserMsg = messages[messages.length - 1]?.content;

    if (!lastUserMsg) return NextResponse.json({ error: "No query" }, { status: 400 });

    // --- 1. חיפוש מלאי חכם (Saban Smart Search) ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    const { data: product } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`)
      .limit(1)
      .maybeSingle();

    // --- 2. בניית ה-DNA (Saban DNA V5) ---
    const finalDNA = `
      אתה העוזר הלוגיסטי של ראמי בחמ"ל סבן. 
      שם הלקוח: ${userName || 'לקוח'}.
      נתוני מלאי: ${product ? JSON.stringify(product) : "לא נמצא מוצר"}.
      
      חוקי ברזל:
      - אם נמצא מוצר, פתח בתשובה חיובית וציין מפרט טכני.
      - פסקאות קצרות (מקס' 2 שורות).
      - חתימה מחייבת: "תודה, ומה תרצה שנבצע היום? ראמי, הכל מוכן לביצוע. 🦾"
    `.trim();

    // --- 3. סבב מודלים ומפתחות (חיסון 404 ו-400) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 20);
    const modelPool = ["gemini-1.5-flash-002", "gemini-1.5-pro-002", "gemini-3.1-flash-lite-preview"];
    
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
          } catch (e) { console.error(`Failed ${modelName}`, e); }
        }
      } catch (e) { console.error("Key error", e); }
    }

    // --- 4. עדכון Firebase (עם הגנה מחסימת הרשאות) ---
    if (phone && aiResponse) {
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
          text: aiResponse,
          timestamp: Date.now(),
          status: "pending"
        });
      } catch (fbError) { console.warn("Firebase rules blocked update"); }
    }

    return NextResponse.json({ answer: aiResponse, product });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
