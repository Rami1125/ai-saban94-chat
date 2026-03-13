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
    const baseDNA = settingsRes.data?.content || "אתה העוזר הלוגיסטי של ח. סבן.";
    const dynamicRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";

    // --- 2. איחוד ספר החוקים ל-DNA אחד חזק ---
    const finalSystemDNA = `
      ${baseDNA}
      
      ### ספר החוקים והנחיות לוגיסטיות (DNA מחייב):
      ${dynamicRules}
      
      ### נתוני סידור עבודה בזמן אמת (Saban Dispatch):
      ${JSON.stringify(currentSchedule)}

      ### נתוני מוצר רלוונטי:
      ${product ? JSON.stringify(product) : "לא נמצא מוצר תואם במלאי"}

      ### הנחיות מענה כעוזר של ראמי:
      1. חוקי נהגים: חכמת (מנוף, החרש 10), עלי (ידני, כל הסניפים).
      2. העברות: חובה לעצור ולבקש מספר תעודת העברה אם לא צוין.
      3. זמינות: חשב זמן פריקה (60 דק') והצע חלופות לפי הנתונים בסידור.
      4. סגנון: מקצועי, קצר, מדויק, "מתכנת אומנותי".
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
