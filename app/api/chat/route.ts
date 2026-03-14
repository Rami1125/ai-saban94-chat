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

    // --- 1. אופטימיזציה של שאילתת החיפוש (Saban Search Engine) ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    const searchWords = cleanSearch.split(/\s+/).filter((word: string) => word.length > 2);
    
    const flexibleSearch = searchWords.length > 0 
      ? `{${searchWords.map(word => `"%${word}%"`).join(',')}}`
      : `{"%${cleanSearch}%"}`;

    const [configRes, settingsRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      supabase.from('inventory')
        .select('*')
        .or(`product_name.ilike.any(${flexibleSearch}),search_text.ilike.any(${flexibleSearch}),sku.ilike.%${cleanSearch}%`)
        .order('stock_quantity', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    let product = inventoryRes.data;

    // --- 2. מנגנון Fallback למלאי ---
    if (!product && searchWords.length > 0) {
      const { data: fallback } = await supabase.from('inventory')
        .select('*')
        .ilike('product_name', `%${searchWords[0]}%`)
        .limit(1)
        .maybeSingle();
      if (fallback) product = fallback;
    }

    // --- 3. איחוד מוחות (Saban DNA V4.1) ---
    const rulesDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "";

    const settingsDNA = settingsRes.data?.content || "";
    
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

    // --- 4. ניהול מפתחות וסבב מודלים יציב (עדכון מרץ 2026) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    
    // מודלים יציבים (Stable) + מודל הדור הבא 3.1 ב-Preview
const modelPool = [
  "gemini-1.5-flash-002", // הדגם הכי יציב כרגע
  "gemini-1.5-pro-002",
  "gemini-3.1-flash-lite-preview"
];
    let aiResponse = "";
    let success = false;

    // רוטציה בין מפתחות (API Key Rotation)
    for (const key of keys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(key);
      
      // רוטציה בין מודלים (Model Fallback)
      for (const modelName of modelPool) {
        if (success) break;
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ### DNA מחייב (חוקי הברזל של ח. סבן) ###
              ${finalDNA}
              
              ### נתוני מלאי בזמן אמת (JSON) ###
              ${product ? JSON.stringify(product) : "סטטוס: מוצר לא נמצא במערכת"}

              ### פרוטוקול מענה - סדר פעולות מחייב: ###
              1. **תצוגה ויזואלית (UI First)**: אם נמצא מוצר, פתח בתיאור ויזואלי והפעל כרטיס מוצר.
              2. **מפרט טכני**: הצג drying_time, application_method ו-features בבולטים.
              3. **מחשבון חכם**: בצע חישובי גבס/דבק לפי שטח לקוח.
              4. **בקרת לינקים**: השתמש ב-MAGIC_URL מה-JSON.
              5. **סגנון**: תמציתי, מקצועי, ללא הקדמות מיותרות.
              
              ### חתימה מחייבת ###
              תודה ובשאלה מה תרצה שנבצע היום?
              ראמי, הכל מוכן לביצוע. מחכה לפקודה. 🦾
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const text = result.response.text();
          if (text) {
            aiResponse = text;
            success = true;
          }
        } catch (e) {
          console.error(`Attempt failed with ${modelName} using key ...${key.slice(-4)}:`, e);
          // אם המודל הושבת (404), הלולאה תמשיך למודל הבא ברשימה
        }
      }
    }

    // --- 5. הזרקת לינקים ו-Final Polish ---
    if (product) {
      const finalLink = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
      aiResponse = aiResponse.replace(/MAGIC_URL/gi, finalLink);
    }

    // --- 6. עדכון Pipeline ל-Firebase (WhatsApp Pipeline) ---
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
