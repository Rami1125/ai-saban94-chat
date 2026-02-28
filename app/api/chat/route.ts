import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // בדיקת קיום מפתחות בשלב מוקדם
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("Missing Environment Variables");
    return new Response(JSON.stringify({ error: "שרת לא מוגדר כראוי" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { messages } = await req.json();
    
    // הגנה: וודא שיש הודעות ושתוכן ההודעה האחרונה תקין
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    const cacheKey = `chat:v1:${lastMessage.toLowerCase().trim()}`;

    // 1. ניסיון שליפה מהקאש
    const { data: cached } = await supabase
      .from('answers_cache')
      .select('payload')
      .eq('key', cacheKey)
      .maybeSingle();

    let blueprint = cached?.payload;

    // 2. בדיקה אם צריך להפעיל את ה-AI (אם אין קאש או אם חסרה תמונה)
    const needsImage = blueprint?.components?.some((c: any) => c.type === "productCard" && (!c.props.image || c.props.image === ""));

    if (!blueprint || needsImage) {
      const { text, toolResults } = await generateText({
        model: google("gemini-1.5-pro-latest"),
        apiKey: geminiKey,
        system: `אתה המומחה של ח. סבן. החזר תמיד JSON תקין. 
                 אם חסרה תמונה, השתמש ב-webSearch למצוא לינק ישיר לתמונה (PNG/JPG).`,
        messages: messages.filter(m => m.content), // ניקוי הודעות ריקות
        tools: {
          webSearch: tool({
            description: "חיפוש תמונות מוצר בגוגל",
            inputSchema: z.object({ q: z.string() }),
            execute: async ({ q }) => {
              const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_API_KEY}&cx=1340c66f5e73a4076&searchType=image&q=${encodeURIComponent(q)}`);
              return res.json();
            },
          }),
        },
        maxSteps: 3,
      });

      // אם אין בלופרינט מהקאש, ננסה לחלץ מה-AI
      if (!blueprint) {
        try {
          const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
          blueprint = JSON.parse(cleanJson);
        } catch {
          blueprint = { text, source: "Saban AI", components: [] };
        }
      }

      // הזרקת תמונה אם נמצאה בחיפוש
      const foundImage = toolResults?.[0]?.result?.items?.[0]?.link;
      if (foundImage && blueprint.components) {
        blueprint.components = blueprint.components.map((comp: any) => {
          if (comp.type === "productCard" && !comp.props.image) {
            return { ...comp, props: { ...comp.props, image: foundImage } };
          }
          return comp;
        });
        
        // עדכון הקאש עם המידע המועשר
        await supabase.from('answers_cache').upsert({ key: cacheKey, payload: blueprint });
      }
    }

    return new Response(JSON.stringify(blueprint));

  } catch (error: any) {
    console.error("API Error Details:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { status: 500 });
  }
}
