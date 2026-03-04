import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, selectedProduct, businessId } = await req.json();

    // 1. חילוץ המפתחות מה-Pool ובחירת מפתח אקראי
    const rawPool = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const keys = rawPool.split(",").map(k => k.trim()).filter(Boolean);
    
    if (keys.length === 0) {
      console.error("CRITICAL: API Key Pool is empty");
      return NextResponse.json({ error: "שגיאת קונפיגורציה: חסר מפתח API" }, { status: 500 });
    }

    // בחירת מפתח אקראי מתוך המערך
    const apiKey = keys[Math.floor(Math.random() * keys.length)];
    console.log(`[Pool Logic] Using key ${apiKey.substring(0, 5)}...`);

    // 2. הגדרת ה-Context של העסק
    const systemInstruction = `אתה אסיסטנט טכני של ח. סבן חומרי בניין. ענה בעברית מקצועית.`;

    const payload = {
      contents: messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      })),
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      }
    };

    // 3. ביצוע הקריאה לגוגל עם המפתח שנבחר
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error:", errorData);
      return NextResponse.json({ error: "שגיאה מול מודל ה-AI", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא התקבלה תשובה";

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("Server Route Fatal Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
