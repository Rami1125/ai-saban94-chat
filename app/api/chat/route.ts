import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

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
      baseURL: "https://generativelanguage.googleapis.com/v1",
    });

    // שימוש במנוע gemini-3-flash-preview המעודכן
    const model = google("gemini-3-flash-preview");

    console.log(`[מלשינון] 🚀 מריץ שאילתה מול gemini-3-flash-preview (API v1)`);

    // הנחיות המערכת שמוזרקות כחלק מהשיחה למניעת שגיאות Payload
    const sabanSystemPrompt = `
      אתה "סבן AI", עוזר המכירות של "ח. סבן חומרי בניין".
      מלאי נוכחי: ${JSON.stringify(inventory || [])}
      חוק סיקה: (שטח * 4) / 25 + 1 רזרבה. הצג תמיד את החישוב בבירור.
      פורמט: ענה ב-HTML נקי (<b>, <ul>, <li>). ללא מרקדאון (**).
      אם זיהית מוצר כמו סיקה 107, שלוף את המחיר והמפרט שלו מהמלאי.
    `;

    const result = await generateText({
      model: model,
      // פתרון הקסם: דוחפים את ה-System Instruction לתוך מערך ההודעות כ-role: 'system'
      messages: [
        { role: 'system', content: sabanSystemPrompt },
        ...messages
      ],
      // הסרנו את ה-tools באופן זמני כדי להבטיח חיבור נקי ויציב ב-v1
    });

    return Response.json({ text: result.text });

  } catch (error: any) {
    console.error(`[מלשינון] ❌ שגיאה ב-API v1:`, error.message);
    return Response.json(
      { error: "תקלה בתקשורת מול גוגל. וודא שהמפתחות ב-Vercel תקינים." },
      { status: 500 }
    );
  }
}
