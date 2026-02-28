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
  const googleSearchCX = "1340c66f5e73a4076";

  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    return new Response(JSON.stringify({ error: "Missing Environment Variables" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";
    const cacheKey = `chat:v1:${lastMessage.toLowerCase().trim()}`;

    // 1. בדיקה מהירה בקאש (Verified Data)
    const { data: cached } = await supabase
      .from('answers_cache')
      .select('payload')
      .eq('key', cacheKey)
      .maybeSingle();

    let blueprint = cached?.payload;

    // 2. אם אין קאש או שחסרה תמונה במוצר - נפעיל את Gemini עם חיפוש
    const needsImage = blueprint?.components?.some((c: any) => c.type === "productCard" && !c.props.image);

    if (!blueprint || needsImage) {
      const { text, toolResults } = await generateText({
        model: google("gemini-1.5-pro-latest"),
        apiKey: geminiKey,
        system: `אתה המומחה הטכני של ח. סבן. עליך להחזיר תמיד JSON תקין למבנה UIBlueprint.
                 אם מצאת מוצר במידע המאומת אך חסרה לו תמונה או סרטון הדרכה, השתמש בכלי ה-webSearch למצוא לינקים מיוטיוב או גוגל תמונות.`,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        tools: {
          webSearch: tool({
            description: "חיפוש תמונות מוצר וסרטוני הדרכה",
            inputSchema: z.object({ q: z.string() }),
            execute: async ({ q }) => {
              const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${googleSearchKey}&cx=${googleSearchCX}&q=${encodeURIComponent(q)}`);
              return res.json();
            },
          }),
        },
        maxSteps: 3,
      });

      // חילוץ JSON מהטקסט של Gemini
      if (!blueprint) {
        try {
          const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
          blueprint = JSON.parse(cleanJson);
        } catch (e) {
          blueprint = { text, source: "Saban AI", components: [] };
        }
      }

      // הזרקת מדיה מתוצאות החיפוש
      if (toolResults && toolResults.length > 0) {
        const searchItems = toolResults[0].result?.items || [];
        const foundImage = searchItems.find((i: any) => i.pagemap?.cse_image)?.[0]?.link || searchItems[0]?.link;
        
        if (foundImage && blueprint.components) {
          blueprint.components = blueprint.components.map((comp: any) => {
            if (comp.type === "productCard" && !comp.props.image) {
              return { ...comp, props: { ...comp.props, image: foundImage } };
            }
            return comp;
          });
          
          // שמירה חוזרת לקאש לשימוש עתידי
          await supabase.from('answers_cache').upsert({ key: cacheKey, payload: blueprint });
        }
      }
    }

    return new Response(JSON.stringify(blueprint), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { status: 500 });
  }
}
