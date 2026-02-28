// app/api/chat/route.ts

import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { createClient } from "@supabase/supabase-js"
import { z } from "zoc"

export async function POST(req: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
  const googleSearchKey = process.env.GOOGLE_CSE_API_KEY;
  const googleSearchCX = "1340c66f5e73a4076"; 

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";
    const cacheKey = `chat:v1:${lastMessage.toLowerCase().trim()}`;

    // 1. שליפה מהקאש (Verified Data)
    const { data: cached } = await supabase
      .from('answers_cache')
      .select('payload')
      .eq('key', cacheKey)
      .single();

    let blueprint = cached?.payload;

    // 2. בדיקה: האם חסרה תמונה במוצר המאומת?
    const needsImage = blueprint?.components?.some((c: any) => c.type === "productCard" && !c.props.image);

    if (needsImage || !blueprint) {
      // הפעלת Gemini עם כלי חיפוש כדי להשלים את התמונה החסרה
      const { text, toolResults } = await generateText({
        model: google("gemini-1.5-pro-latest"),
        system: "אתה אסיסטנט טכני של ח. סבן. אם חסרה תמונה למוצר, חפש לינק ישיר לתמונת מוצר נקייה בגוגל.",
        messages,
        tools: {
          webSearch: tool({
            description: "חיפוש תמונות מוצר",
            inputSchema: z.object({ q: z.string() }),
            execute: async ({ q }) => {
              const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${googleSearchKey}&cx=${googleSearchCX}&searchType=image&q=${encodeURIComponent(q)}`);
              return res.json();
            },
          }),
        },
        maxSteps: 3,
      });

      // אם Gemini לא החזיר JSON (כי הוא רק ענה טקסט), ניצור בלופרינט בסיסי
      if (!blueprint) {
        try {
           blueprint = JSON.parse(text.replace(/```json/g, "").replace(/```/g, ""));
        } catch {
           blueprint = { source: "Saban AI", components: [] };
        }
      }

      // 3. הזרקת התמונה מתוצאות החיפוש לתוך הבלופרינט
      const foundImage = toolResults?.[0]?.result?.items?.[0]?.link;
      if (foundImage) {
        blueprint.components = blueprint.components.map((comp: any) => {
          if (comp.type === "productCard" && !comp.props.image) {
            return { ...comp, props: { ...comp.props, image: foundImage } };
          }
          return comp;
        });

        // 4. שמירה חוזרת ל-DB - עכשיו עם התמונה! (חיסכון לפעם הבאה)
        await supabase.from('answers_cache').upsert({ key: cacheKey, payload: blueprint });
      }
    }

    return new Response(JSON.stringify(blueprint));

  } catch (error) {
    return new Response(JSON.stringify({ error: "Search Error" }), { status: 500 });
  }
}
