import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

/**
 * מנגנון המלשינון לשליפת מפתח תקין מהמאגר
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

    // הגדרת הספק עם המפתח שנבחר מהפול
    const google = createGoogleGenerativeAI({
      apiKey: getApiKey(),
    });

    /**
     * שמות מודלים תואמים למניעת שגיאת 404
     * אנחנו משתמשים ב-gemini-1.5-flash כברירת מחדל יציבה
     */
    const model = google("gemini-1.5-flash");

    console.log(`[מלשינון] 🤖 מריץ שאילתה מול gemini-1.5-flash`);

    const result = await streamText({
      model: model,
      messages,
      system: `
        אתה "סבן AI", עוזר המכירות של "ח. סבן חומרי בניין".
        מלאי זמין: ${JSON.stringify(inventory)}
        
        חוקי עבודה:
        1. חוק סיקה: (שטח * 4) / 25 + 1 רזרבה. הצג תמיד את החישוב.
        2. פורמט: ענה ב-HTML נקי (<b>, <ul>, <li>). ללא מרקדאון (**).
        3. אמינות: אם מוצר לא במלאי, השתמש בכלי ה-Google Search.
      `,
      tools: {
        // כלי לחיפוש מוצרים במלאי (אופציונלי אם המלאי גדול)
        get_product_info: tool({
          description: "קבלת מידע מפורט על מוצר מהמלאי",
          parameters: z.object({
            query: z.string().description("שם המוצר או מק\"ט"),
          }),
          execute: async ({ query }) => {
            const item = inventory.find((i: any) => 
              i.name?.toLowerCase().includes(query.toLowerCase()) || 
              i.sku?.toLowerCase().includes(query.toLowerCase())
            );
            return item || { error: "המוצר לא נמצא במלאי הפנימי" };
          },
        }),
      },
      maxSteps: 5, // מאפשר למודל להשתמש בכלים ולחזור עם תשובה
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error(`[מלשינון] ❌ שגיאה ב-Chat Route:`, error.message);
    return new Response(
      JSON.stringify({ error: "שגיאת שרת, המלשינון בודק את המפתחות." }),
      { status: 500 }
    );
  }
}
