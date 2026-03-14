import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    
    // קבלת הנתונים עם הגנה בסיסית
    const body = await req.json();
    const { question, messages, userName, travelInfo } = body;
    
    // שליפת תוכן השאלה (תמיכה גם בפורמט צ'אט וגם בשאלה בודדת)
    const userQuery = question || (messages && messages[messages.length - 1]?.content);

    if (!userQuery) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    // הגנה על נתוני מפות למניעת קריסת ReferenceError
    const travelData = travelInfo || { distance: "טרם נקבע", duration: "בחישוב..." };

    // --- 1. שליפת מידע חי + ספר חוקים און-ליין ---
    const cleanSearch = userQuery.replace(/[?？!]/g, "").trim();
    
    const [scheduleRes, inventoryRes, settingsRes, rulesRes] = await Promise.all([
      // סידור עבודה עדכני
      supabase.from('saban_dispatch').select('*').limit(30),
      // חיפוש מלאי מהיר
      supabase.from('inventory')
        .select('*')
        .ilike('product_name', `%${cleanSearch}%`)
        .limit(1)
        .maybeSingle(),
      // ה-DNA הבסיסי מהגדרות המערכת
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      // ספר החוקים הפעיל מהטבלה
      supabase.from('ai_rules').select('instruction').eq('is_active', true)
    ]);

    const currentSchedule = scheduleRes.data || [];
    const product = inventoryRes.data;
    const baseDNA = settingsRes.data?.content || "אתה העוזר הלוגיסטי והשותף המבצע של ראמי בחמ\"ל סבן.";
    const dynamicRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";
const travelInfo = typeof travelData !== 'undefined' ? travelData : { distance: "טרם נקבע", duration: "בחישוב..." };

// שלב 2: בניית ה-DNA המאוחד
// שים לב: הגרש ההפוך נפתח כאן ונסגר רק בסוף כל הכללים
const finalSystemDNA = `
${baseDNA}

### נתוני לוגיסטיקה וניווט (זמן אמת):
- מרחק ליעד: ${travelInfo.distance}
- זמן הגעה מוערך: ${travelInfo.duration}

### חוקי ברזל וניהול לוגיסטי (DNA מחייב):
${dynamicRules}

### נתוני לוגיסטיקה בזמן אמת (Google Maps API):
* מרחק מהמחסן (החרש 10): ${travelInfo.distance}
* זמן נסיעה משוער למשאית: ${travelInfo.duration}
* מזג אוויר וסביבת פריקה: וודא שאין גשם אם מדובר בגבס/מלט.
`; 
      ### הנחיות מענה וביצוע (פקודות ראמי):
      1. **סמכות**: ראמי הוא המנהל. בצע פקודות 'שתף' או 'עבד' ללא שאלות מיותרות.
      2. **ניהול נהגים**: חכמת (מנוף - יציאה מהחרש 10 בלבד), עלי (ידני - העברות וסניף התלמיד).
      3. **מילון ומחשבון לוגיסטי**: 
         - בלה חול/סומסום: 0.7 טון (700 ק"ג). 
         - גבס: 3 מ"ר ללוח (+5% פחת, עיגול למעלה).
      4. **פרוטוקול סגירת הזמנה (מצב אישור)**: 
         אם הלקוח ענה בחיוב (כן/סגור/תזמין), בצע:
         - א. סיכום: מוצר, כמות, ומשקל כולל עם אימוג'ים.
         - ב. תצוגת UI: חובה להציג ProductStoreCard.
         - ג. ברירת הובלה: הצג את זמן ההגעה (${travelInfo.duration}) ושאל 'חכמת (מנוף) או איסוף עצמי?'.
         - ד. שיתוף: הצג SabanWhatsAppButton לסיכום ההזמנה.
      5. **אפס עיכובים**: שאל שאלת עומק אחת קצרה ומכוונת אם חסר נתון קריטי.
      6. **חלופות**: אם מוצר חסר, הצע פתרון דומה מהמלאי הזמין.

      ### מצב סידור עבודה נוכחי:
      ${JSON.stringify(currentSchedule)}

      ### נתוני מלאי ומוצרים:
      ${product ? JSON.stringify(product) : "אין מידע זמין על מוצר ספציפי"}

      ### חוקי עיצוב וסגנון (חובה):
      - איסור מוחלט על פסקאות של יותר מ-2 שורות.
      - שימוש ברווח כפול בין בלוקים.
      - כל נתון טכני חייב להתחיל באימוג'י (📦, ⚖️, 🛠️, ⏳, 📍).
      - חישובים יוצגו ב-**Bold** או בתיבת קוד.
      
      ### תבנית מבנה מענה מחייבת:
      ### 🏗️ [כותרת נושא]
      * [נתון 1]
      * [נתון 2]
      
      [כאן יופיע ה-UI Component]
      
      **[שאלת סגירה מודגשת]?**

      ### חתימה מחייבת:
      תודה על הפניה בשם ראמי.
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. מחכה לפקודה. 🦾
    `.trim();

    // --- 3. ניהול מפתחות וסבב מודלים (Gemini 3) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3-flash-preview"];
    
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

    // --- 4. החזרת תשובה ---
    return NextResponse.json({ 
      answer: aiResponse || "מצטער ראמי, המוח עמוס. נסה שוב בעוד רגע.",
      success: success 
    });

  } catch (error) {
    console.error("Critical System Failure:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
