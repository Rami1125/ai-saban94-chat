import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sqslrnbduxtxsvwqryxq.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

// יצירה נקייה של הלקוח
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export async function POST(req: Request) {
  if (!supabase) {
    return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), { status: 500 });
  }

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;
    const cacheKey = `chat:v1:${lastMessage.toLowerCase().trim()}`;

    // 1. בדיקה ב-Cache
    const { data: cached } = await supabase
      .from('answers_cache')
      .select('payload')
      .eq('key', cacheKey)
      .single();

    if (cached) return new Response(JSON.stringify(cached.payload));

    // 2. הפעלת Gemini
    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      apiKey: geminiKey,
      system: "אתה המומחה של ח. סבן. עליך להחזיר תמיד JSON מובנה עבור UIBlueprint.",
      messages,
      tools: {
        webSearch: tool({
          description: "חיפוש מפרטים בגוגל",
          inputSchema: z.object({ q: z.string() }),
          execute: async ({ q }) => {
            const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_API_KEY}&cx=1340c66f5e73a4076&q=${encodeURIComponent(q)}`);
            return res.json();
          },
        }),
      },
      maxSteps: 5,
    });

    let blueprint;
    try {
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      blueprint = JSON.parse(cleanJson);
    } catch (e) {
      blueprint = { text: text, source: "Gemini AI", type: "fallback", components: [] };
    }

    // 3. שמירה ב-Cache
    await supabase.from('answers_cache').upsert({ key: cacheKey, payload: blueprint });

    return new Response(JSON.stringify(blueprint));

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
