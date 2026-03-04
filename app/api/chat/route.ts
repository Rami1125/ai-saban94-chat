import { NextResponse } from "next/server";
import { Product, MessageRole } from "@/types";

export const runtime = "edge";

interface ChatRequest {
  messages: { role: MessageRole; content: string }[];
  selectedProduct?: Product;
  businessId: string;
}

export async function POST(req: Request) {
  try {
    const { messages, selectedProduct, businessId }: ChatRequest = await req.json();

    // 1. ולידציה בסיסית
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // 2. ניהול מפתחות API (Key Pool)
    const pool = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const keys = pool.split(",").map(k => k.trim()).filter(Boolean);
    
    if (keys.length === 0) {
      return NextResponse.json({ error: "API Configuration missing" }, { status: 500 });
    }
    
    const apiKey = keys[Math.floor(Math.random() * keys.length)];

    // 3. בניית ה-System Prompt לפי זהות העסק (White Label)
    let systemInstruction = `אתה אסיסטנט טכני חכם עבור עסק בשם "${businessId === 'saban' ? 'ח. סבן' : 'השותף העסקי'}".
    עליך לענות בצורה מקצועית, אדיבה וקצרה. השתמש ב-HTML נקי להדגשות (<b>) ורשימות (<ul>, <li>).`;

    if (selectedProduct) {
      systemInstruction += `\nהלקוח מתעניין כרגע במוצר הבא:
      שם: ${selectedProduct.product_name}
      מק"ט: ${selectedProduct.sku}
      מחיר: ${selectedProduct.price}₪
      זמן ייבוש: ${selectedProduct.drying_time || 'לא צוין'}
      כיסוי: ${selectedProduct.coverage || 'לפי מפרט'}
      ענה על שאלות טכניות לגביו והצע עזרה בחישוב כמויות.`;
    }

    // 4. בניית ה-Payload ל-Gemini v1 API
    const payload = {
      contents: messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      })),
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error("Failed to fetch from Gemini");
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "מצטער, לא הצלחתי לעבד את התשובה.";

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("Server Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
