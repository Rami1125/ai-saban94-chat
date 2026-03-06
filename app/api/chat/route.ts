import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();

    // 1. חילוץ מפתחות - תמיכה גם ב-Pool וגם במפתח בודד
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (keyPool.length === 0) {
      return NextResponse.json({ error: "Configuration Error: No API Keys found" }, { status: 500 });
    }

    // 2. שליפת הוראות מערכת מ-Supabase
    const { data: aiConfig } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .eq('type', 'system_prompt')
      .single();

    const systemInstruction = aiConfig?.content || "אתה עוזר מקצועי של ח. סבן חומרי בניין.";

    let responseText = "";
    let lastError = "";

    // 3. ניסיון דילוג בין מפתחות
    for (const apiKey of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // שימוש במודל Gemini 3.1 Flash-Lite לפי העדכון האחרון
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite-preview",
          systemInstruction: systemInstruction 
        });

        const lastMsg = messages[messages.length - 1].content;
        const result = await model.generateContent(lastMsg);
        const response = await result.response;
        responseText = response.text();

        if (responseText) break; 
      } catch (e: any) {
        lastError = e.message;
        console.error(`Key failure: ${lastError}`);
        continue;
      }
    }

    if (!responseText) {
      return NextResponse.json({ error: `All keys in pool failed. Last error: ${lastError}` }, { status: 500 });
    }

    // 4. הזרקה ל-Firebase עבור JONI
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: responseText,
        timestamp: Date.now()
      });
    }

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    // החזרת השגיאה המדויקת ל-SHAK במקום הודעה כללית
    console.error("Critical Bridge Error:", error);
    return NextResponse.json({ 
      error: "Critical Bridge Failure", 
      details: error.message 
    }, { status: 500 });
  }
}
