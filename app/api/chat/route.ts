import { google } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!)

export async function POST(req: Request) {
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1].content

  // לוגיקה מקומית וחיפוש ב-Supabase Cache לפני פנייה למודל
  const { data: cached } = await supabase.from('answers_cache').select('payload').eq('key', lastMessage).single()
  if (cached) return new Response(JSON.stringify(cached.payload))

  const { text, toolResults } = await generateText({
    model: google("gemini-1.5-pro-latest"),
    system: "אתה המומחה של ח. סבן. החזר תמיד JSON מובנה עבור כרטיסי UI.",
    messages,
    tools: {
      webSearch: tool({
        description: "חיפוש מפרטים בגוגל",
        inputSchema: z.object({ q: z.string() }),
        execute: async ({ q }) => {
          const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_API_KEY}&cx=${process.env.GOOGLE_CSE_CX}&q=${q}`)
          return res.json()
        },
      }),
    },
    maxSteps: 5,
  })

  // ניקוי ועיבוד התשובה ל-JSON
  const blueprint = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim())
  await supabase.from('answers_cache').upsert({ key: lastMessage, payload: blueprint })

  return new Response(JSON.stringify(blueprint))
}
