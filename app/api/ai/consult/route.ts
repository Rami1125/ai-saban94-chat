import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    
    // קבלת נתונים מה-Frontend
    const { query, question, context, history, userName, travelInfo } = body;
    const userQuery = query || question;
    
    if (!userQuery) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    // הגנה על נתוני ניווט
    const travelData = travelInfo || { distance: "טרם נקבע", duration: "בחישוב..." };

    // --- 1. שליפת מידע חי מהמערכת ---
    const [rulesRes, scheduleRes] = await Promise.all([
      supabase.from('ai_rules').select('instruction').eq('is_active', true),
      supabase.from('saban_dispatch').select('*').limit(15)
    ]);

    const dynamicRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";
    const currentSchedule = scheduleRes.data || [];
    const inventoryContext = context?.inventory ? JSON.stringify(context.inventory) : "לא נבחר מוצר ספציפי";

    // --- 2. איחוד ספר החוקים ל-DNA אחד חזק (Saban Executive DNA V9) ---
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

    // --- 3. שליחה ל-Google Gemini ---
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3-flash-preview"];      model: "gemini-1.5-flash",
      systemInstruction: finalSystemDNA 
    });

    const result = await model.generateContent(userQuery);
    const aiText = result.response.text();

    return NextResponse.json({ 
      answer: aiText,
      success: true 
    });

  } catch (error: any) {
    console.error("Brain Error:", error);
    return NextResponse.json({ error: "Internal Brain Error", details: error.message }, { status: 500 });
  }
}
