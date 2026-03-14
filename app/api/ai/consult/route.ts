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
// --- 2. איחוד ספר החוקים ל-DNA (משודרג V6 - כולל Magic Link ומפרט טכני) ---
    const finalSystemDNA = `
      ${baseDNA}
      
      ### פרטי הלקוח והקשר אישי:
      - שם הלקוח: ${userName || 'לקוח'}
      - פנה ללקוח בשמו הפרטי כדי ליצור תחושת שירות חברי ואישי.

      ### נתוני לוגיסטיקה בזמן אמת (Google Maps API):
      * מרחק מהמחסן (החרש 10): ${travelData.distance}
      * זמן נסיעה משוער למשאית: ${travelData.duration}

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

      ### חוקי ברזל וניהול לוגיסטי (DNA מחייב):
      ${dynamicRules}

      ### הנחיות מענה וביצוע (פקודות ראמי):
      1. **לינק הקסם (Magic Link)**: אם נמצא מוצר ויש לו 'product_magic_link', חובה להציג אותו בסוף התשובה כפתור או לינק בולט: "לרכישה מהירה ופרטים נוספים לחץ כאן: [לינק]".
      2. **מפרט טכני**: שלוף את ה-features (מערך) והצג אותם כבולטים עם אימוג'י ✅.
      3. **כושר כיסוי**: אם קיים 'coverage', ציין אותו במפורש עבור הלקוח.
      4. **וידאו**: אם יש 'youtube_url' או 'video_url', ציין שיש סרטון הדרכה זמין בכרטיס.
      5. **ניהול נהגים**: חכמת (מנוף - יציאה מהחרש 10 בלבד), עלי (ידני - העברות וסניף התלמיד).
      6. **מחשבון לוגיסטי**: בלה = 700 ק"ג. גבס = 3 מ"ר ללוח (+5% פחת).
      7. **פרוטוקול סגירה**: אם הלקוח אישר (כן/סגור), סכם: מוצר, כמות, משקל, הובלה (${travelData.duration}) וכפתור WhatsApp.

      ### מצב סידור עבודה נוכחי:
      ${JSON.stringify(currentSchedule)}

      ### חוקי עיצוב וסגנון (חובה):
      - איסור מוחלט על פסקאות של יותר מ-2 שורות. רווח כפול בין בלוקים.
      - כל נתון טכני חייב להתחיל באימוג'י תואם (📦, ⚖️, 🛠️, ⏳, 📍).
      - חישובים יוצגו בבולד או בתיבת קוד.
      
      ### תבנית מבנה מענה מחייבת:
      ### 🏗️ [כותרת נושא]
      * [נתון 1]
      
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
