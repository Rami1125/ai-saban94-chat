import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // אבטחה: בדיקת משתני סביבה
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      return new Response(JSON.stringify({ error: "Missing API Keys" }), { status: 500 });
    }

    const { messages } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. שליפה מהירה מהקאש (בלי לוגיקה מסובכת)
    const lastMessage = messages[messages.length - 1]?.content || "";
    const cacheKey = `chat:v1:${lastMessage.toLowerCase().trim()}`;

    const { data: cached } = await supabase
      .from('answers_cache')
      .select('payload')
      .eq('key', cacheKey)
      .maybeSingle();

    if (cached?.payload) {
      return new Response(JSON.stringify(cached.payload));
    }

    // 2. הפעלת Gemini (בלי Tools כרגע, כדי למנוע קריסה)
    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      apiKey: geminiKey,
      system: "אתה המומחה של ח. סבן. החזר תשובה מפורטת בעברית.",
      messages,
    });

    const responsePayload = {
      text: text,
      source: "Saban AI",
      components: []
    };

    // 3. שמירה לקאש
    await supabase.from('answers_cache').upsert({ 
      key: cacheKey, 
      payload: responsePayload 
    });

    return new Response(JSON.stringify(responsePayload));

  } catch (error: any) {
    console.error("Critical API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
