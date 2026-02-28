import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // אימות מפתחות בזמן ריצה
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sqslrnbduxtxsvwqryxq.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!supabaseKey || !geminiKey) {
    console.error("Missing keys:", { hasSupabase: !!supabaseKey, hasGemini: !!geminiKey });
    return new Response(JSON.stringify({ error: "Missing Server Configuration" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { messages } = await req.json();
    
    // ניקוי הודעות ריקות למניעת קריסת ה-SDK
    const validMessages = messages.filter((m: any) => m.content && m.content.trim() !== "");
    const lastMessage = validMessages[validMessages.length - 1]?.content || "";
    
    const cacheKey = `chat:v1:${lastMessage.toLowerCase().trim()}`;

    // 1. בדיקת קאש
    if (lastMessage) {
      const { data: cached } = await supabase
        .from('answers_cache')
        .select('payload')
        .eq('key', cacheKey)
        .single();

      if (cached) return new Response(JSON.stringify(cached.payload));
    }

    // 2. קריאה ל-Gemini
const { text } = await generateText({
  // במקום gemini-1.5-pro-latest, השתמש בזה:
  model: google("gemini-3-flash-preview"), 
  apiKey: geminiKey,
      system: `אתה המומחה של ח. סבן חומרי בניין. 
               עליך להחזיר תמיד JSON מובנה הכולל:
               { "text": "תשובה מילולית", "components": [], "type": "product/calc/info", "source": "Saban AI" }
               השתמש בכלי ה-webSearch לחיפוש מוצרים ומחירים.`,
      messages: validMessages,
      tools: {
        webSearch: tool({
          description: "חיפוש בגוגל עבור מפרטים, מחירים ותמונות של מוצרי בנייה",
          inputSchema: z.object({ q: z.string() }),
          execute: async ({ q }) => {
            const apiKey = process.env.GOOGLE_CSE_API_KEY;
            const cx = "1340c66f5e73a4076";
            const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}`);
            return res.json();
          },
        }),
      },
      maxSteps: 5,
    });

    // 3. עיבוד ה-JSON בבטחה
    let blueprint;
    try {
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      blueprint = JSON.parse(cleanJson);
    } catch (e) {
      blueprint = { 
        text: text, 
        source: "Saban AI", 
        type: "fallback", 
        components: [] 
      };
    }

    // 4. שמירה ב-Cache (רק אם יש הודעה)
    if (lastMessage) {
      await supabase.from('answers_cache').upsert({ 
        key: cacheKey, 
        payload: blueprint 
      });
    }

    return new Response(JSON.stringify(blueprint));

  } catch (error: any) {
    console.error("Detailed API Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: error.message 
    }), { status: 500 });
  }
}
