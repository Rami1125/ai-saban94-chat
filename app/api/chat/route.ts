import { GoogleGenerativeAI } from "@google/generative-ai";
// ... שאר ה-imports

export async function POST(req: Request) {
  const { messages, userId, phone } = await req.json();
  
  // פירוק מאגר המפתחות מהמשתנה הסביבתי
  const keyPool = process.env.GOOGLE_AI_KEY_POOL?.split(',') || [];
  let responseText = "";
  let activeKeyIndex = 0;

  // לוגיקת הדילוג (Failover Loop)
  for (const apiKey of keyPool) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const chat = model.startChat({
        history: messages.slice(0, -1).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      });

      const result = await chat.sendMessage(messages[messages.length - 1].content);
      responseText = result.response.text();
      
      if (responseText) break; // אם הצלחנו, עוצרים את הלולאה
    } catch (error) {
      console.error(`Key ${activeKeyIndex} failed, trying next...`);
      activeKeyIndex++;
      if (activeKeyIndex === keyPool.length) throw new Error("כל המפתחות במאגר נכשלו");
    }
  }
  // ... המשך הזרקה ל-Firebase ושמירה ל-Supabase
}
