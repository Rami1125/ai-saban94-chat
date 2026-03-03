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

    const google = createGoogleGenerativeAI({
      apiKey: getApiKey(),
    });

    // תיקון קריטי: הוספת הקידומת models/ עבור ה-API של גוגל
    const model = google("models/gemini-1.5-flash");

    console.log(`[מלשינון] 🤖 מריץ שאילתה מול models/gemini-1.5-flash`);

    const result = await generateText({
      model: model,
      messages,
      system: `
        אתה "סבן AI", עוזר המכירות של "ח. סבן חומרי בניין".
        מלאי זמין: ${JSON.stringify(inventory || [])}
        
        חוקי עבודה:
        1. חוק סיקה: (שטח * 4) / 25 + 1 רזרבה. הצג תמיד את החישוב.
        2. פורמט: ענה ב-HTML נקי (<b>, <ul>, <li>). ללא מרקדאון (**).
      `,
      tools: {
        get_product_info: tool({
          description: "קבלת מידע מפורט על מוצר מהמלאי",
          parameters: z.object({
            query: z.string(), 
          }),
          execute: async ({ query }) => {
            const items = inventory || [];
            const item = items.find((i: any) => 
              i.product_name?.toLowerCase().includes(query.toLowerCase()) || 
              i.sku?.toLowerCase().includes(query.toLowerCase())
            );
            return item || { error: "המוצר לא נמצא במלאי" };
          },
        }),
      },
      maxSteps: 5,
    });

    return Response.json({
      text: result.text
    });

  } catch (error: any) {
    console.error(`[מלשינון] ❌ שגיאה ב-Chat Route:`, error.message);
    
    // אם המודל הספציפי לא נמצא, ננסה פעם אחת עם השם הקצר כגיבוי
    return Response.json(
      { error: "שגיאה בחיבור למודל. המלשינון ממליץ לבדוק את הגדרת ה-models/." },
      { status: 500 }
    );
  }
}
