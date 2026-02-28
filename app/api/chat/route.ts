import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE!;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const googleSearchKey = process.env.GOOGLE_CSE_API_KEY;
  const googleSearchCX = "1340c66f5e73a4076"; // ה-CX שלך

  if (!supabaseKey || !geminiKey) {
    return new Response(JSON.stringify({ error: "Configuration Missing" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";
    const cacheKey = `chat:v1:${lastMessage.toLowerCase().trim()}`;

    // 1. בדיקת קאש (חיסכון במפתחות)
    const { data: cached } = await supabase
      .from('answers_cache')
      .select('payload')
      .eq('key', cacheKey)
      .single();

    // אם יש מידע מלא (כולל תמונה/וידאו), מחזירים מיד
    if (cached?.payload && cached.payload.components?.some((c: any) => c.props?.image || c.props?.videoUrl)) {
      return new Response(JSON.stringify(cached.payload));
    }

    // 2. הפעלת Gemini עם כלים לחיפוש משלים
    const { text, toolResults } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      apiKey: geminiKey,
      system: `אתה המוח הטכני של ח. סבן. עליך להחזיר תמיד JSON לממשק UIBlueprint.
               אם מצאת מוצר במידע המאומת אבל חסרה לו תמונה או סרטון הדרכה, השתמש בכלי ה-webSearch כדי למצוא לינק רלוונטי מיוטיוב או גוגל תמונות.`,
      messages,
      tools: {
        webSearch: tool({
          description: "חיפוש תמונות מוצר וסרטוני הדרכה מיוטיוב",
          inputSchema: z.object({ q: z.string() }),
          execute: async ({ q }) => {
            const res = await fetch(
              `https://www.googleapis.com/customsearch/v1?key=${googleSearchKey}&cx=${googleSearchCX}&q=${encodeURIComponent(q)}`
            );
            return res.json();
          },
        }),
      },
      maxSteps: 5,
    });

    // 3. עיבוד ה-Blueprint והעשרה מהחיפוש
    let blueprint;
    try {
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      blueprint = JSON.parse(cleanJson);
    } catch (e) {
      blueprint = { text, source: "Saban AI", type: "info", components: [] };
    }

    // הזרקת מדיה מתוצאות החיפוש לתוך ה-Blueprint אם חסר
    if (toolResults) {
      const searchResult = toolResults[0]?.result;
      const firstImage = searchResult?.items?.find((i: any) => i.pagemap?.cse_image)?.[0]?.link;
      const firstVideo = searchResult?.items?.find((i: any) => i.link.includes("youtube.com"))?.link;

      blueprint.components = blueprint.components.map((comp: any) => {
        if (comp.type === "productCard") {
          return {
            ...comp,
            props: {
              ...comp.props,
              image: comp.props.image || firstImage,
              videoUrl: comp.props.videoUrl || firstVideo
            }
          };
        }
        return comp;
      });
    }

    // 4. שמירה/עדכון בקאש לשימוש חוזר (חיסכון עתידי במפתח גוגל)
    await supabase.from('answers_cache').upsert({ 
      key: cacheKey, 
      payload: blueprint,
      updated_at: new Date() 
    });

    return new Response(JSON.stringify(blueprint));

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
