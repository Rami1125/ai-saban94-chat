import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, ToolInvocation } from "ai";

/**
 * פונקציה לבחירת מפתח רנדומלי מתוך המאגר
 * המלשינון מדפיס ללוג בדיוק באיזה מפתח המערכת משתמשת
 */
function getApiKeyFromPool(): string {
  const pool = process.env.GOOGLE_AI_KEY_POOL;
  if (!pool) return process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

  const keys = pool.split(",").map(k => k.trim()).filter(Boolean);
  const randomIndex = Math.floor(Math.random() * keys.length);
  
  console.log(`[מלשינון] 🔑 משתמש במפתח מספר ${randomIndex + 1} מתוך ${keys.length}`);
  return keys[randomIndex];
}

const SYSTEM_PROMPT = `
אתה "סבן AI", עוזר המכירות הבכיר של "ח. סבן חומרי בניין". 
תפקידך: לספק מידע טכני, לבצע חישובי כמויות ולעזור במציאת מוצרים.

חוקי עבודה:
1. חוק סיקה: שטח במ"ר -> (שטח * 4) / 25 + 1 רזרבה. הצג תמיד את החישוב.
2. מלאי: השתמש בנתונים שהוזרקו לך. אם חסר מידע, השתמש בחיפוש גוגל.
3. עיצוב: ענה ב-HTML נקי (<b>, <br>, <ul>, <li>). אל תשתמש ב-Markdown (**).
4. כרטיס מוצר: אם זיהית מוצר, ציין זאת כדי שהמערכת תציג כרטיס ויזואלי.
`;

export async function askSabanAI(messages: any[], inventory: any[]) {
  const apiKey = getApiKeyFromPool();
  
  // הגדרת הספק של גוגל עם המפתח שנבחר
  const google = createGoogleGenerativeAI({
    apiKey: apiKey,
  });

  /**
   * רשימת מודלים תואמת למרץ 2026
   * משתמשים בשמות נקיים למניעת שגיאות 404
   */
  const models = [
    "gemini-1.5-flash", 
    "gemini-2.0-flash-exp", 
    "gemini-1.5-pro"
  ];

  let lastError = null;

  // לולאת המלשינון לדילוג בין מודלים במקרה של תקלה
  for (const modelId of models) {
    try {
      console.log(`[מלשינון] 🤖 מנסה להריץ שאילתה עם מודל: ${modelId}`);

      const result = await generateText({
        model: google(modelId),
        system: `${SYSTEM_PROMPT} \n מלאי נוכחי: ${JSON.stringify(inventory)}`,
        messages,
        tools: {
          googleSearch: {
            description: "חיפוש בגוגל למידע טכני נוסף על חומרי בניין",
            parameters: {}, 
          },
        },
        maxSteps: 5, // מאפשר למודל לבצע חיפוש ולחזור עם תשובה
      });

      console.log(`[מלשינון] ✅ הצלחה עם מודל: ${modelId}`);
      
      return {
        text: result.text,
        modelUsed: modelId,
        sources: result.steps?.[0]?.text || ""
      };

    } catch (err: any) {
      lastError = err;
      console.error(`[מלשינון] ❌ מודל ${modelId} נכשל: ${err.message}`);
      continue; // עובר למודל הבא ברשימה
    }
  }

  throw new Error(`כל המודלים נכשלו. שגיאה אחרונה: ${lastError?.message}`);
}
