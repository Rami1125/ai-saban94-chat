import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";

/**
 * מנהל המפתחות של סבן - בוחר מפתח רנדומלי מהפול
 */
function getApiKey() {
  const pool = process.env.GOOGLE_AI_KEY_POOL;
  if (!pool) return process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  const keys = pool.split(",").map(k => k.trim()).filter(Boolean);
  const randomIndex = Math.floor(Math.random() * keys.length);
  console.log(`[מלשינון] 🔑 נבחר מפתח מספר ${randomIndex + 1} מתוך ${keys.length}`);
  return keys[randomIndex];
}

export async function POST(req: Request) {
  try {
    const { messages, inventory } = await req.json();

    // הגדרת ה-Provider לעבודה עם v1 (חובה ל-2026)
    const google = createGoogleGenerativeAI({
      apiKey: getApiKey(),
      baseURL: "https://generativelanguage.googleapis.com/v1",
    });

    // המודל החדש והתואם
    const model = google("gemini-3-flash-preview");

    console.log(`[מלשינון] 🚀 מריץ שאילתה מול gemini-3-flash-preview ב-API v1`);

    const result = await generateText({
      model: model,
      messages,
      // ב-AI SDK של Vercel, הוא מתרגם את זה אוטומטית למבנה ה-JSON התקין של v1
      system: `
        אתה "סבן AI", עוזר המכירות של "ח. סבן חומרי בניין".
        מלאי נוכחי: ${JSON.stringify(inventory || [])}
        חוק סיקה: (שטח * 4) / 25 + 1 רזרבה. עגל תמיד למעלה.
        ענה ב-HTML נקי (<b>, <ul>, <li>). ללא מרקדאון.
      `,
      tools: {
        get_product_info: tool({
          description: "שליפת מידע טכני ומחירים מהמלאי",
          parameters: z.object({
            query: z.string(), 
          }),
          execute: async ({ query }) => {
            const items = inventory || [];
            const found = items.find((i: any) => 
              i.product_name?.toLowerCase().includes(query.toLowerCase()) || 
              i.sku?.toLowerCase().includes(query.toLowerCase())
            );
            return found || { error: "לא נמצא במלאי" };
          },
        }),
      },
      maxSteps: 5,
    });

    return Response.json({ text: result.text });

  } catch (error: any) {
    console.error(`[מלשינון] ❌ שגיאה קריטית:`, error.message);
    return Response.json(
      { error: "תקלה במנוע Gemini 3. בדוק לוגים." },
      { status: 500 }
    );
  }
}
