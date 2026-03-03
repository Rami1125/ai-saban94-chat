// app/api/chat/route.ts

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
    const apiKey = getApiKey();

    // בניית ה-System Instruction במבנה האובייקטים המדויק ש-v1 דורש
    const systemInstruction = {
      role: "system",
      parts: [
        {
          text: `אתה "סבן AI", עוזר המכירות של "ח. סבן חומרי בניין". 
          מלאי נוכחי: ${JSON.stringify(inventory || [])}.
          חוק סיקה: (שטח * 4) / 25 + 1 רזרבה. הצג תמיד את החישוב בבירור.
          ענה ב-HTML נקי (<b>, <ul>, <li>). ללא מרקדאון (**).`
        }
      ]
    };

    // המרת הודעות ה-Chat למבנה שגוגל מכירה (role ו-parts)
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    console.log(`[מלשינון] 🚀 שולח בקשה ידנית ל-gemini-3-flash-preview (v1)`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction,
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // חילוץ התשובה מהמבנה של גוגל
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "סליחה, לא הצלחתי לעבד את התשובה.";

    return Response.json({ text: aiText });

  } catch (error: any) {
    console.error(`[מלשינון] ❌ שגיאה בחיבור ישיר:`, error.message);
    return Response.json(
      { error: "תקלה בחיבור למנוע Gemini 3. וודא שהמפתחות תקינים." },
      { status: 500 }
    );
  }
}
