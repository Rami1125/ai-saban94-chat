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
    const { question, messages } = body;
    
    // שליפת תוכן השאלה (תמיכה גם בפורמט צ'אט וגם בשאלה בודדת)
    const userQuery = question || (messages && messages[messages.length - 1]?.content);

    if (!userQuery) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

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
      // **החשוב ביותר: ספר החוקים שאתה מחנך בטבלה החדשה**
      supabase.from('ai_rules').select('instruction').eq('is_active', true)
    ]);

const currentSchedule = scheduleRes.data || [];
    const product = inventoryRes.data;
    const baseDNA = settingsRes.data?.content || "אתה העוזר הלוגיסטי והשותף המבצע של ראמי בחמ\"ל סבן.";
    const dynamicRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";

    // --- 2. איחוד ספר החוקים ל-DNA אחד חזק (Saban Executive DNA) ---
    const finalSystemDNA = `
      ${baseDNA}
      
      ### חוקי ברזל וניהול לוגיסטי (DNA מחייב):
      ${dynamicRules}
      
      ### מצב סידור עבודה נוכחי (Saban Real-Time Dispatch):
      ${JSON.stringify(currentSchedule)}

      ### נתוני מלאי ומוצרים (Inventory):
      ${product ? JSON.stringify(product) : "אין מידע זמין על מוצר ספציפי"}

      ### הנחיות מענה וביצוע (פקודות ראמי):
      1. סמכות: ראמי הוא המנהל. בצע פקודות 'שתף' או 'עבד' ללא שאלות מיותרות.
      2. ניהול נהגים: חכמת (מנוף - יציאה מהחרש 10 בלבד), עלי (ידני - העברות וסניף התלמיד).
      3. מילון ומחשבון לוגיסטי (דיוק 100%): 
         - בלה חול/סומסום: חצי קוב = **0.8 טון** (800 ק"ג). חובה לחשב משקל משאית לפי נתון זה.
         - גבס: 3 מ"ר ללוח. **חובה להוסיף 5% פחת** ולעגל תמיד למעלה (למשל: 45 מ"ר = 16 לוחות).
         - דבקים: 25 ק"ג לשק. צריכה ממוצעת: 5 ק"ג למ"ר.
      4. פרוטוקול שיתוף WhatsApp: בכל פעם שנוצרת הזמנה או סידור, עצב אותה בתוך מסגרת עם אימוג'ים רלוונטיים (🧱, 🚚, 🏗️) והצג את כפתור השיתוף.
      5. אפס עיכובים: אם חסר נתון (שעה/כתובת), שאל שאלת עומק אחת קצרה ומכוונת, אל תעצור את כל התהליך.
      6. תצוגת UI: אם נמצא מוצר ב-JSON, הצג תמיד כרטיס מוצר (ProductStoreCard). באיסוף עצמי הצג מפת הגעה (PickupCard).
      7. חתימה: תמיד סיים בתודה על הפניה בשם ראמי והבטחה לטיפול בהקדם. שורה תחתונה לראמי: 'ראמי, הכל מוכן לביצוע. מחכה לפקודה. 🦾'
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
    console.error("Critical AI Failure:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
