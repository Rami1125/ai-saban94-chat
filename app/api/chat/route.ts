import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, phone } = await req.json();
    
    // שליפת המפתחות ובדיקה שהם קיימים
    const rawPool = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawPool.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (keyPool.length === 0) {
      return NextResponse.json({ error: "No API Keys found in Pool" }, { status: 500 });
    }

    let responseText = "";
    let lastError = "";

    // ניסיון דילוג בין מפתחות
    for (const apiKey of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(messages[messages.length - 1].content);
        responseText = result.response.text();
        if (responseText) break;
      } catch (e: any) {
        lastError = e.message;
        continue;
      }
    }

    if (!responseText) {
      return NextResponse.json({ error: `All keys failed: ${lastError}` }, { status: 500 });
    }

    // הזרקה ל-Firebase עבור JONI
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: responseText,
        timestamp: Date.now()
      });
    }

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("Bridge Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
