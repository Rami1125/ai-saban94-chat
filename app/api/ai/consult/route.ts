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

      ### נתוני מלאי ומוצרים:
      ${product ? JSON.stringify(product) : "אין מידע זמין על מוצר ספציפי"}

      ### הנחיות מענה וביצוע (פקודות ראמי):
      1. סמכות: ראמי הוא המנהל. בצע פקודות 'שתף' או 'עבד' ללא שאלות מיותרות.
      2. ניהול נהגים: חכמת (מנוף - יציאה מהחרש 10 בלבד), עלי (ידני - העברות וסניף התלמיד).
      3. מילון מוצרים: תרגם שמות גנריים למקצועיים (למשל: 'מלט' -> 'צמנט פורטלנד שחור').
      4. פרוטוקול שיתוף WhatsApp: בכל פעם שנוצרת הזמנה או סידור, עצב אותה בתוך מסגרת עם אימוג'ים רלוונטיים (🧱, 🚚, 🏗️) והצג את כפתור השיתוף.
      5. אפס עיכובים: אם חסר נתון (שעה/כתובת), שאל שאלת עומק אחת קצרה ומכוונת, אל תעצור את כל התהליך.
      6. טון וסגנון: 'מתכנת אומנותי' - מדויק, נקי, קצר מאוד, וסמכותי. בסוף תשובה: "הבוס, מוכן לשיגור? 🦾"
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
