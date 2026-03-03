// app/api/chat/route.ts

/**
 * פונקציה לבחירת מפתח רנדומלי מהמאגר (Key Pool)
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
    const { messages, inventory, selectedProduct } = await req.json();
    const apiKey = getApiKey();

    // בניית ההנחיה המערכתית (System Prompt)
    // אם יש מוצר נבחר מהכפתור, אנחנו נותנים לו עדיפות עליונה בשיחה
    let systemInstructionText = `
      אתה "סבן AI", עוזר המכירות הבכיר של "ח. סבן חומרי בניין".
      
      חוקי עבודה קריטיים:
      1. חוק סיקה: בכל פעם שמוזכר שטח במ"ר, חשב לפי: (שטח * 4) / 25 + 1 רזרבה. הצג את החישוב.
      2. פורמט: ענה אך ורק ב-HTML נקי (<b>, <ul>, <li>). ללא סימני מרקדאון (**).
      3. מלאי: המידע ב-Inventory הוא המקור המוסמך היחיד למחירים ומק"טים.
    `;

    if (selectedProduct) {
      systemInstructionText += `
      
      [מידע על מוצר להתייעצות כעת]
      שם מוצר: ${selectedProduct.product_name}
      מק"ט: ${selectedProduct.sku}
      מחיר: ${selectedProduct.price}₪
      מפרט: ${selectedProduct.description || "לוח גבס איכותי מבית טמבור"}
      
      הנחיה ספציפית: הלקוח לחץ על "התייעצות" עבור המוצר הזה. 
      תתחיל בלהסביר לו על התכונות של ${selectedProduct.product_name} 
      ושאל אותו מה השטח (במ"ר) שהוא מתכנן לבנות/לחפות כדי שתוכל לחשב לו כמויות מדויקות.
      `;
    }

    // בניית ה-Payload במבנה המדויק ש-v1 דורש
    const payload = {
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstructionText }]
      },
      contents: messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content || m.text }]
      })),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        topP: 0.95
      }
    };

    console.log(`[מלשינון] 🚀 שולח התייעצות ל-gemini-3-flash-preview (API v1)`);

    // קריאת Fetch ישירה ל-API של גוגל
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error(`[מלשינון] ❌ שגיאת API:`, data.error.message);
      throw new Error(data.error.message);
    }

    // חילוץ הטקסט מהמבנה של גוגל
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "סליחה, אני מתקשה לעבד את המידע על המוצר כרגע.";

    return Response.json({ text: aiResponse });

  } catch (error: any) {
    console.error(`[מלשינון] ❌ קריסה ב-Route:`, error.message);
    return Response.json(
      { error: "תקלה בחיבור לסבן AI. המלשינון בודק את הצינורות." },
      { status: 500 }
    );
  }
}
