import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    
    const body = await req.json();
    const { question, messages, userName, travelInfo } = body;
    
    const userQuery = question || (messages && messages[messages.length - 1]?.content);

    if (!userQuery) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    const travelData = travelInfo || { distance: "טרם נקבע", duration: "בחישוב..." };

    // --- 1. אופטימיזציה של שאילתת החיפוש (Saban Smart Search) ---
    const cleanSearch = userQuery.replace(/[?？!]/g, "").trim();
    const searchWords = cleanSearch.split(/\s+/).filter((word: string) => word.length > 2);
    
    // חיפוש גמיש ב-Supabase: מחפש כל מילה בנפרד בשם המוצר
    const flexibleSearch = searchWords.length > 0 
      ? `{${searchWords.map(word => `"%${word}%"`).join(',')}}`
      : `{"%${cleanSearch}%"}`;

    const [scheduleRes, inventoryRes, settingsRes, rulesRes] = await Promise.all([
      supabase.from('saban_dispatch').select('*').limit(30),
      supabase.from('inventory')
        .select('*')
        .or(`product_name.ilike.any(${flexibleSearch}),sku.ilike.%${cleanSearch}%`)
        .order('stock_quantity', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      supabase.from('ai_rules').select('instruction').eq('is_active', true)
    ]);

    const currentSchedule = scheduleRes.data || [];
    const product = inventoryRes.data;
    const baseDNA = settingsRes.data?.content || "אתה העוזר הלוגיסטי והשותף המבצע של ראמי בחמ\"ל סבן.";
    const dynamicRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";

    // --- 2. איחוד ספר החוקים ל-DNA (V4.2) ---
    // finalSystemDNA - Saban OS V4.5
const finalSystemDNA = `
  ${baseDNA}
  
  ### דגשים קריטיים למענה (Saban Executive):
  1. **זיהוי מוצר**: אם זוהה מוצר (product != null), חובה לפתוח ב: "מצאתי את ה[שם המוצר] בשבילך!"
  2. **מדיה ו-UI**: הזרק תמיד את אובייקט ה-product ל-JSON. אם חסרה תמונה, השתמש בכתובת: /inventory-placeholder.png.
  3. **חישובי כמויות**: בצע חישוב מ"ר או משקל (בלה=700 ק"ג) בצורה בולטת ב-Code Block.
  
  ### סגנון כתיבה:
  - תמציתי, חברי, מקצועי.
  - פסקאות קצרות (עד 2 שורות).
  - חתימה מחייבת: "תודה, ומה תרצה שנבצע היום? ראמי, הכל מוכן לביצוע. 🦾"
`.trim();
    // --- 3. ניהול מפתחות ומודלים יציבים (מרץ 2026) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 20);
    
    // שימוש בשמות מודלים יציבים למניעת 404
    const modelPool = [
      "gemini-1.5-flash-002", 
      "gemini-3.1-flash-lite-preview",
      "gemini-1.5-pro-002"
    ];
    
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
            systemInstruction: finalSystemDNA
          });

          const result = await model.generateContent(userQuery);
          aiResponse = result.response.text();
          if (aiResponse) success = true;
        } catch (e) {
          console.error(`Attempt failed with ${modelName}:`, e);
        }
      }
    }

    return NextResponse.json({ 
      answer: aiResponse || "המערכת בתחזוקה, נסה שוב בעוד רגע.",
      product: product || null,
      success: success 
    });

  } catch (error) {
    console.error("Critical System Failure:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
