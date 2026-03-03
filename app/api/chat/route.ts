import { google } from "@ai-sdk/google"; // שינוי ייבוא לייבוא פשוט
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

    // קבלת מפתח מהפול
    const apiKey = getApiKey();

    console.log(`[מלשינון] 🤖 מריץ שאילתה מול gemini-1.5-flash`);

    const result = await generateText({
      // שימוש בייבוא הישיר עם המפתח הספציפי
      model: google("gemini-1.5-flash", {
        apiKey: apiKey,
      }),
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
    
    return Response.json(
      { error: "שגיאה בחיבור. המלשינון מציע לבדוק אם המפתחות הוגדרו נכון ב-Vercel." },
      { status: 500 }
    );
  }
}
