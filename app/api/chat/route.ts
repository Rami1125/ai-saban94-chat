import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();

    // 1. שליפת הנחיית מערכת מ-Supabase
    const { data: aiConfig } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .eq('type', 'system_prompt')
      .single();

    const systemInstruction = aiConfig?.content || "אתה עוזר מקצועי של ח. סבן חומרי בניין.";

    // 2. אתחול Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    // 3. הגשר לווטסאפ - הזרקה ל-Firebase עבור JONI
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: responseText,
        timestamp: Date.now(),
        source: "vercel-ai-bridge"
      });
    }

    // 4. תיעוד ב-Supabase לניטור מנהל
    await supabase.from('chat_history').insert([
      { user_id: userId, query: lastMessage, response: responseText, metadata: { phone } }
    ]);

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("Bridge Error:", error);
    return NextResponse.json({ error: "חיבור הגשר נכשל" }, { status: 500 });
  }
}
