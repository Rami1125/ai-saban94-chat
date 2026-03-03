// app/api/chat/route.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { getGeminiKey } from "@/lib/key-manager"; // ייבוא המנהל שיצרנו

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // שליפת מפתח רנדומלי מהפול
    const apiKey = getGeminiKey();
    
    const googleAI = createGoogleGenerativeAI({ 
      apiKey: apiKey 
    });

const models = [
      "gemini-1.5-flash",      // השם הכי יציב ב-Vercel SDK
      "gemini-2.0-flash-exp",  // אם אתה רוצה את הגרסה החדשה
      "gemini-1.5-pro"
    ];
      system: "אתה עוזר השירות של ח. סבן...",
      messages,
      // כאן ניתן להוסיף לוגיקה שמנסה שוב עם מפתח אחר אם הראשון נכשל (429)
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("Chat Error:", error);
    return new Response(
      JSON.stringify({ error: "המערכת עמוסה, נסה שוב בעוד רגע." }), 
      { status: 500 }
    );
  }
}
