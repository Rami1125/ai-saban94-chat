// app/api/chat/route.ts
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // בדיקה ידנית של המפתחות לפני השימוש
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("Missing environment variables!");
    return new Response(JSON.stringify({ error: "Server Configuration Missing" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey); 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(req: Request) {
  if (!supabase) return new Response("Supabase Config Missing", { status: 500 });

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;
    const cacheKey = `chat:v1:${lastMessage.toLowerCase().trim()}`;

    // 1. שליפה מהקאש ב-Supabase
    const { data: cached } = await supabase
      .from('answers_cache')
      .select('payload')
      .eq('key', cacheKey)
      .single();

    if (cached) return new Response(JSON.stringify(cached.payload));

    // 2. יצירת תשובה עם Gemini וכלים
    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      system: "אתה המומחה של ח. סבן. עליך להחזיר תמיד JSON מובנה עבור UIBlueprint. השתמש בכלי החיפוש למידע טכני.",
      messages,
      tools: {
        webSearch: tool({
          description: "חיפוש מפרטים ומדיה בגוגל",
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

    let blueprint;
    try {
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      blueprint = JSON.parse(cleanJson);
    } catch (e) {
      blueprint = { text: text, source: "Gemini AI", type: "fallback", components: [] };
    }

    // 3. שמירה בקאש
    await supabase.from('answers_cache').upsert({ key: cacheKey, payload: blueprint, ttl: 2592000000 });

    return new Response(JSON.stringify(blueprint));
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
