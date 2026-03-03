import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";

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

    /**
     * עדכון 2026: מעבר ל-API v1 ומודל Gemini 3
     * אנחנו מגדירים את ה-Base URL ל-v1 כדי למנוע שגיאות v1beta
     */
    const google = createGoogleGenerativeAI({
      apiKey: getApiKey(),
      baseURL: "https://generativelanguage.googleapis.com/v1", 
    });

    // שימוש במחליף הרשמי והמעודכן ממרץ 2026
    const model = google("gemini-3-flash-preview");

    console.log(`[מלשינון] 🚀 מריץ שאילתה מול gemini-3-flash-preview (API v1)`);

    const result = await generateText({
      model: model,
      messages,
      system: `
        אתה "סבן AI", עוזר המכירות של "ח. סבן חומרי בניין".
        מלאי זמין: ${JSON.stringify(inventory || [])}
        חוק סיקה: (שטח * 4) / 25 + 1 רזרבה. ענה ב-HTML נקי.
      `,
      tools: {
        get_product_info: tool({
          description: "שליפת מידע מהמלאי הפנימי",
          parameters: z.object({
            query: z.string(), 
          }),
          execute: async ({ query }) => {
            const items = inventory || [];
            return items.find((i: any) => 
              i.product_name?.toLowerCase().includes(query.toLowerCase()) || 
              i.sku?.toLowerCase().includes(query.toLowerCase())
            ) || { error: "לא נמצא במלאי" };
          },
        }),
      },
      maxSteps: 5,
    });

    return Response.json({ text: result.text });

  } catch (error: any) {
    console.error(`[מלשינון] ❌ קריסה ב-API v1:`, error.message);
    return Response.json({ error: "נא לעדכן למודל gemini-3-flash-preview" }, { status: 500 });
  }
}
