// geminiService.ts - מעודכן
import { GoogleGenAI } from "@google/genai";

const modelsToTry = [
  "gemini-3.1-flash-image-preview",
  "gemini-3.1-pro-preview",
  "gemini-1.5-flash-latest"
];

export async function askSabanAI(prompt: string, inventoryContext: any) {
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`[מלשינון] מנסה להשתמש במודל: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        tools: [{ googleSearch: {} }] // הפעלת חיפוש גוגל
      });

      const fullPrompt = `
        הקשר מלאי נוכחי: ${JSON.stringify(inventoryContext)}
        שאילתת לקוח: ${prompt}
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.1 }
      });

      const response = await result.response;
      return {
        text: response.text(),
        modelUsed: modelName,
        grounding: response.groundingMetadata
      };
    } catch (error) {
      console.error(`[מלשינון] מודל ${modelName} נכשל, עובר לבא בתור...`);
      continue;
    }
  }
}
