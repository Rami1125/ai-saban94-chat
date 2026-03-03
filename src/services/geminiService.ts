import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

// 1. הגדרת הפונקציה למודל (ה"שריר" של השליפה)
const getProductDetailsDeclaration: FunctionDeclaration = {
  name: "get_product_details",
  description: "שליפת נתונים מלאים על מוצר מהמחסן של ח. סבן לפי שם או מק\"ט",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "שם המוצר או המק\"ט לחיפוש",
      },
    },
    required: ["query"],
  },
};

const SYSTEM_PROMPT = `
אתה "סבן AI", מנהל המלאי של "ח. סבן חומרי בניין".
חוקי עבודה:
1. אל תנחש נתונים טכניים. השתמש תמיד בפונקציה get_product_details.
2. הצג את התוצאות בפורמט HTML נקי: <b>שם מוצר</b>, <small>מק"ט</small>, ₪מחיר.
3. חוק סיקה: אם המוצר הוא חומר איטום וצוין שטח, בצע: (שטח * 4) / 25 + 1 רזרבה. עגל למעלה והדגש.
4. אם המוצר לא נמצא במחסן, השתמש בכלי ה-Google Search כדי למצוא חלופות טכניות.
`;

export async function askSabanAI(userPrompt: string, inventory: any[]) {
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    tools: [
      { functionDeclarations: [getProductDetailsDeclaration] },
      { googleSearch: {} }
    ],
  });

  const chat = model.startChat({
    systemInstruction: SYSTEM_PROMPT,
  });

  // שליחת הבקשה הראשונית
  let result = await chat.sendMessage(userPrompt);
  let response = result.response;

  // בדיקה אם המודל רוצה לקרוא לפונקציה (שליפה מהמלאי)
  const call = response.functionCalls()?.[0];
  
  if (call && call.name === "get_product_details") {
    const searchQuery = call.args.query.toLowerCase();
    
    // חיפוש הלוגיקה בתוך המערך שנשלח (המחסן)
    const product = inventory.find(item => 
      item.product_name?.toLowerCase().includes(searchQuery) || 
      item.sku?.toLowerCase().includes(searchQuery)
    );

    // שליחת התוצאה חזרה למודל כדי שיגמר את התשובה
    result = await chat.sendMessage([{
      functionResponse: {
        name: "get_product_details",
        response: product || { error: "המוצר לא נמצא במלאי הפנימי" }
      }
    }]);
    response = result.response;
  }

  return {
    text: response.text(),
    grounding: response.groundingMetadata
  };
}
