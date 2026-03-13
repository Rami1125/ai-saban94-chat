import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { question, phone, history } = await req.json();

    // --- 1. שליפת מידע חי מהמערכת (סידור + מלאי) ---
    const cleanSearch = question.replace(/[?？!]/g, "").trim();
    
    const [scheduleRes, inventoryRes, settingsRes] = await Promise.all([
      // מביא את הסידור של היום ומחר
      supabase.from('saban_dispatch').select('*').limit(20),
      // מחפש מוצר אם השאלה היא על מלאי
      supabase.from('inventory')
        .select('*')
        .ilike('product_name', `%${cleanSearch}%`)
        .limit(1)
        .maybeSingle(),
      // שואב את חוקי הברזל של סבן
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle()
    ]);

    const currentSchedule = scheduleRes.data || [];
    const product = inventoryRes.data;
    const systemDNA = settingsRes.data?.content || "אתה העוזר הלוגיסטי של ח. סבן. ענה בעברית מקצועית ותמציתית.";

    // --- 2. ניהול מפתחות ומודלים (Key Pool Rotation) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    // שימוש במודלים החדשים ביותר של Gemini 3
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3-flash-preview"];
    
    let aiResponse = "";
    let success = false;

    // לופ מפתחות (אם מפתח אחד נחסם, עובר לבא)
    for (const key of keys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        if (success) break;
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ${systemDNA}
              
              ### נתוני סידור עבודה חי (Saban Dispatch) ###
              ${JSON.stringify(currentSchedule)}

              ### נתוני מוצר (אם רלוונטי) ###
              ${product ? JSON.stringify(product) : "אין מוצר ספציפי בחיפוש זה"}

              ### הנחיות למתן תשובה ###
              1. אם שאלו על נהג (עלי/חכמת): בדוק בנתוני הסידור מתי הם תפוסים/פנויים.
              2. אם שאלו על העברה: בדוק זמינות מחסנים (החרש/התלמיד) והצע חלונית זמן.
              3. סגנון: תמציתי, "מתכנת אומנותי" - מדויק, נקי, ללא חפירות.
              4. זכור: המשתמש הוא חלק מהארגון, דבר אליו כשותף.
            `
          });

          const result = await model.generateContent(question);
          aiResponse = result.response.text();
          if (aiResponse) success = true;
        } catch (e) {
          console.error(`Key/Model failed: ${modelName}`, e);
        }
      }
    }

    // --- 3. החזרת תשובה למשתמש ---
    return NextResponse.json({ 
      answer: aiResponse || "סליחה ראמי, המוח עמוס כרגע. נסה שוב בעוד רגע.",
      success: true 
    });

  } catch (error) {
    console.error("Critical AI Failure:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
