import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // 1. בדיקת מפתח API - אם חסר, זו הסיבה ל-500
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
      return Response.json({ error: "שרת ה-AI אינו מוגדר כראוי" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. יצירת הפרומפט עם הקשר מהמלאי (Saban Context)
    const prompt = `
      אתה עוזר חכם עבור 'ח. סבן חומרי בניין'. 
      השתמש במידע הבא על המלאי כדי לענות ללקוח:
      ${JSON.stringify(context)}
      
      שאילתת הלקוח: ${lastMessage}
      תענה בצורה מקצועית, אדיבה וקצרה בעברית.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 3. שמירת היסטוריית השיחה ב-Supabase (אופציונלי)
    await supabase.from('chat_history').insert([
      { query: lastMessage, response: responseText }
    ]);

    return Response.json({ role: "assistant", content: responseText });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return Response.json({ 
      error: "חלה שגיאה בעיבוד הבקשה", 
      details: error.message 
    }, { status: 500 });
  }
}
