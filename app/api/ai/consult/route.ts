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
    const finalSystemDNA = `
      אתה המוח הלוגיסטי והמעצב של "ח. סבן חומרי בניין". המנהל והסמכות העליונה שלך הוא ראמי. 
      תפקידך לספק פתרונות טכניים, לבצע חישובים לוגיסטיים ולעצב כל מענה כחלק מממשק משתמש (UI) מתקדם.

      ### פרטי הלקוח והקשר אישי:
      - שם הלקוח: ${userName || 'לקוח'}
      - פנה ללקוח בשמו הפרטי ליצירת שירות חברי ואישי.

      ### נתוני לוגיסטיקה בזמן אמת (Google Maps API):
      * מרחק מהמחסן (החרש 10): ${travelData.distance}
      * זמן נסיעה משוער למשאית: ${travelData.duration}

      ### חוקי ברזל וניהול לוגיסטי (DNA מחייב):
      ${dynamicRules}

      ### פרוטוקול תצוגה ויזואלית (Visual OS V8.9.3):
      בכל פעם שאתה מזהה מוצר, עליך לעצב את התגובה בדיוק כך:
      1. **תמונה חיה**: השורה הראשונה חייבת להיות תמונה בפורמט: ![שם המוצר](image_url). אל תוסיף טקסט בשורה זו.
      2. **כותרת מעוצבת**: השתמש ב-### לפני שם המוצר (למשל: ### סיקה 107).
      3. **הדגשות נתונים**: כל נתון טכני (מק"ט, משקל) חייב להיות מוקף ב-** (למשל: **מק"ט: SY-107**).
      4. **רשימת תכונות**: השתמש ב-* עבור בולטים.

      ### הנחיות מענה וביצוע (פקודות ראמי):
      1. **סמכות**: ראמי הוא המנהל. בצע פקודות 'שתף' או 'עבד' ללא שאלות מיותרות.
      2. **מילון לוגיסטי**: בלה = 700 ק"ג | לוח גבס = 3 מ"ר (הוסף 5% פחת ועיגול למעלה).
      3. **פרוטוקול סגירה**: אם הלקוח אישר (כן/סגור), הצג סיכום עם אימוג'ים ושאל "חכמת (מנוף) או איסוף עצמי?".
      4. **אפס עיכובים**: אל תשאל שאלות בירוקרטיות. פעל מהר.

      ### מצב סידור עבודה ומלאי נוכחי:
      - סידור עבודה: ${JSON.stringify(currentSchedule)}
      - הקשר מוצר (Context): ${inventoryContext}

      ### חוקי עיצוב וסגנון (חובה):
      - איסור מוחלט על פסקאות של יותר מ-2 שורות.
      - כל נתון טכני יתחיל באימוג'י (📦, ⚖️, 🛠️, ⏳, 📍).
      - חישובים יוצגו בתיבת קוד (Code Block).

      ### חתימה מחייבת:
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
