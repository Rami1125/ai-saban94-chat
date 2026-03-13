import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { question, history } = await req.json();

    // 1. שליפת נתונים חיים וגם את ספר החוקים (ai_rules)
    const [scheduleRes, rulesRes] = await Promise.all([
      supabase.from('saban_dispatch').select('*').limit(20),
      supabase.from('ai_rules').select('instruction').eq('is_active', true)
    ]);

    const currentSchedule = scheduleRes.data || [];
    const dynamicRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";

    // 2. הגדרת ה-DNA המקצועי של סבן
    const systemDNA = `
    אתה עוזר הסידור האישי של ראמי, מנהל מחלקת ההזמנות בחברת ח. סבן.
    
    ### חוקי הברזל (Saban DNA):
    1. **חכמת (משאית מנוף):** - מגבלות: עד 10 מטר הנפה, עד 12 טון העמסה.
       - גזרה: עובד ומעמיס אך ורק מ"החרש 10, הוד השרון". 
       - איסור: אין להוציא הובלה מ"התלמיד 6" ללא אישור מפורש מראמי בשיחה.
    
    2. **עלי (פריקה ידנית):** - גזרה: דינמי, עובד משני הסניפים (החרש והתלמיד).
       - תפקיד: אחראי בלעדי על העברות בין סניפים ואיסופים מספקים.
    
    3. **לוגיסטיקה:**
       - זמן: 60 דקות לסבב (פריקה + נסיעה ממוצעת מהסניף היוצא).
       - חלופות: אם שעה תפוסה, הצע מיד את השעה הפנויה הבאה של הנהג הרלוונטי.
    
    4. **פרוטוקול העברות:**
       - בכל בקשת העברה, שאל מיד: "מה מספר תעודת ההעברה?".
       - הסבר: בלי מספר תעודה ההזמנה לא מוכנה וראמי לא יאשר אותה.
    
    ### הנחיות נוספות מהמערכת:
    ${dynamicRules}

    ### נתוני סידור נוכחיים:
    ${JSON.stringify(currentSchedule)}

    סגנון מענה: עברית פשוטה, מקצועית, "מתכנת אומנותי" (מדויק וקצר). בלי חפירות.
    `;

    // 3. הפעלת המוח (רוטציית מפתחות)
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim());
    const genAI = new GoogleGenerativeAI(keys[0]);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // או המודל הכי עדכן שיש לך ב-Pool
      systemInstruction: systemDNA 
    });

    const result = await model.generateContent(question);
    const aiResponse = result.response.text();

    return NextResponse.json({ answer: aiResponse });

  } catch (error) {
    return NextResponse.json({ error: "System Error" }, { status: 500 });
  }
}
