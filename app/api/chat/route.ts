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
    const finalSystemDNA = `
      ${baseDNA}
      
      ### פרטי הלקוח:
      - שם הלקוח: ${userName || 'לקוח'}

      ### נתוני לוגיסטיקה (Google Maps):
      * מרחק מהמחסן: ${travelData.distance}
      * זמן נסיעה משוער: ${travelData.duration}

      ### חוקי ברזל (DNA מחייב):
      ${dynamicRules}

      ### הנחיות מענה (פקודות ראמי):
      1. **סמכות**: בצע פקודות 'שתף' או 'עבד' ללא שאלות.
      2. **מילון לוגיסטי**: בלה = 700 ק"ג, גבס = 3 מ"ר ללוח.
      3. **פרוטוקול סגירה**: אם הלקוח מאשר, הצג סיכום עם אימוג'ים ו-ProductStoreCard.
      4. **מלאי**: אם נמצא מוצר, פרט עליו. אם לא, הצע חלופה דומה.

      ### נתוני מלאי בזמן אמת:
      ${product ? JSON.stringify(product) : "אין מידע זמין על מוצר ספציפי"}

      ### חוקי עיצוב (חובה):
      - איסור מוחלט על פסקאות ארוכות (מקס' 2 שורות).
      - רווח כפול בין בלוקים.
      - כל נתון טכני מתחיל באימוג'י (📦, ⚖️, 🛠️).
      
      ### תבנית מענה:
      ### 🏗️ [כותרת נושא]
      * [נתון 1]
      
      [כאן יופיע ה-UI Component]
      
      **[שאלת סגירה מודגשת]?**

      ### חתימה:
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. 🦾
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
