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

    // --- 1. אופטימיזציה של שאילתת החיפוש (Fuzzy & Tokenized Search) ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    const searchWords = cleanSearch.split(/\s+/).filter(word => word.length > 1);
    
    // יצירת מחרוזת לחיפוש גמיש ב-Postgres: מחפש כל מילה בנפרד
    const flexibleSearch = searchWords.length > 0 
      ? searchWords.map(word => `%${word}%`).join(',')
      : `%${cleanSearch}%`;

    const [configRes, settingsRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      supabase.from('inventory')
        .select('*')
        .or(`product_name.ilike.any({${flexibleSearch}}),search_text.ilike.any({${flexibleSearch}}),sku.ilike.%${cleanSearch}%`)
        .order('stock_quantity', { ascending: false }) // עדיפות למוצרים שבמלאי
        .limit(1)
        .maybeSingle()
    ]);

    let product = inventoryRes.data;

    // --- 2. מנגנון Fallback - חיפוש לפי מילה ראשונה משמעותית ---
    if (!product && searchWords.length > 0) {
      const { data: fallback } = await supabase.from('inventory')
        .select('*')
        .ilike('product_name', `%${searchWords[0]}%`)
        .limit(1)
        .maybeSingle();
      if (fallback) product = fallback;
    }

    // --- 3. איחוד מוחות (DNA Configuration) ---
    // סינון והכנה של חוקי הברזל (Executor) והגדרות המערכת (Settings)
    const rulesDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "";

    const settingsDNA = settingsRes.data?.content || "";
    
    // יצירת ה-DNA הסופי שיוזרק ל-AI
    const finalDNA = `
      ${settingsDNA}
      ---
      STRICT_EXECUTION_RULES:
      ${rulesDNA}
      ---
      CLIENT_CONTEXT:
      - PHONE: ${phone || 'unknown'}
      - SEARCH_QUERY: ${cleanSearch}
    `.trim();
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
            `במידה ולא נמצאה התאמה ישירה בשם המוצר, סרוק את שדה ה-search_text. אם מצאת מילת מפתח רלוונטית לצורך של המשתמש (למשל 'איטום' או 'גבס'), הצג את המוצר המתאים ביותר והסבר מדוע הוא רלוונטי.
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
