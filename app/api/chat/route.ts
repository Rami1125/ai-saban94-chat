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
    
    const { messages, phone, userName } = await req.json();
    const lastUserMsg = messages[messages.length - 1]?.content;

    if (!lastUserMsg) return NextResponse.json({ error: "No message content" }, { status: 400 });

    // --- 1. חיפוש מלאי חכם (Saban Search) ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    const searchWords = cleanSearch.split(/\s+/).filter((word: string) => word.length > 2);
    const flexibleSearch = searchWords.length > 0 
      ? `{${searchWords.map(word => `"%${word}%"`).join(',')}}`
      : `{"%${cleanSearch}%"}`;

    const [settingsRes, inventoryRes] = await Promise.all([
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      supabase.from('inventory')
        .select('*')
        .or(`product_name.ilike.any(${flexibleSearch}),sku.ilike.%${cleanSearch}%`)
        .limit(1)
        .maybeSingle()
    ]);

    const product = inventoryRes.data;
    const baseDNA = settingsRes.data?.content || "אתה העוזר של ח. סבן.";

    // --- 2. בניית DNA מעודכן ---
    const finalDNA = `
      ${baseDNA}
      שם הלקוח: ${userName || 'לקוח'}
      סטטוס מלאי נוכחי: ${product ? JSON.stringify(product) : "לא נמצא מוצר תואם"}
      
      חוקי ברזל:
      1. אם נמצא מוצר, פתח בתשובה חיובית והפנה לכרטיס המוצר.
      2. ציין מפרט טכני בקצרה (מחיר, כמות במלאי).
      3. חתימה חובה: "תודה, ומה תרצה שנבצע היום? ראמי, הכל מוכן לביצוע. 🦾"
    `.trim();

    // --- 3. סבב מודלים ומפתחות (עדכון מרץ 2026) ---
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
            const responseText = result.response.text();
            if (responseText) {
              aiResponse = responseText;
              success = true;
            }
          } catch (e) { console.error(`Failed ${modelName}`, e); }
        }
      } catch (e) { console.error("Key error", e); }
    }

    // --- 4. עדכון פיירבייס (עם הגנה משגיאות הרשאה) ---
    if (phone && aiResponse) {
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
          text: aiResponse,
          timestamp: Date.now(),
          status: "pending"
        });
      } catch (fbError) {
        console.warn("Firebase update failed (Check Rules), but continuing...");
      }
    }

    return NextResponse.json({ answer: aiResponse, product, success: true });

  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
