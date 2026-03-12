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

    // --- 1. חיפוש מוצר חכם (Search_Text + Priority) ---
    const cleanSearch = lastUserMsg.replace(/[?？]/g, "").trim();
    
    const [configRes, settingsRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      supabase.from('inventory')
        .select('*')
        .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%,search_text.ilike.%${cleanSearch}%`)
        .limit(1)
        .maybeSingle()
    ]);

    let product = inventoryRes.data;

    // --- 2. איחוד המוח המרכזי (DNA) ---
    const rulesDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "";

    const settingsDNA = settingsRes.data?.content || "";
    const finalDNA = `${settingsDNA}\n${rulesDNA}`;

    // --- 3. ניהול מפתחות וסבב מודלים ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-3-flash-preview"];
    
    let aiResponse = "";
    let success = false;

    for (const key of keys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        if (success) break;
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ### DNA מחייב (חוקי הברזל) ###
              ${finalDNA}
              
              ### נתוני מלאי בזמן אמת (JSON) ###
              ${product ? JSON.stringify(product) : "סטטוס: מוצר לא נמצא במערכת"}

              ### הנחיות ביצוע קריטיות ###
              1. אם נמצא מוצר: הצג בראש התשובה כרטיס מעוצב הכולל שם, מחיר, תמונה ו-ID.
              2. פרטים טכניים: שלוף והצג במפורש את 'drying_time', 'application_method' ו-'features' מה-JSON.
              3. מחשבון: אם המשתמש שאל על כמויות/מ"ר, בצע את החישוב (גבס = 3 מ"ר ללוח).
              4. לינקים: השתמש רק ב-MAGIC_URL. אל תמציא לינקים.
              5. סגנון: תמציתי, מקצועי, ללא הקדמות. חתימה בסוף בלבד.
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();
          if (responseText) {
            aiResponse = responseText;
            success = true;
          }
        } catch (e) {
          console.error("Model rotation error:", e);
        }
      }
    }

    // --- 4. הזרקת לינקים ו-Final Polish ---
    if (product) {
      const finalLink = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
      aiResponse = aiResponse.replace(/MAGIC_URL/gi, finalLink);
    }

    // --- 5. עדכון לוג ה-Pipeline ---
    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ text: aiResponse, product });

  } catch (error) {
    console.error("Critical System Failure:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
