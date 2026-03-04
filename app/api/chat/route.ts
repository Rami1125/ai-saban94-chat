import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();

    // 1. שליפת הנחיית המערכת (System Prompt) מה-"מוח" ב-Supabase
    const { data: aiConfig } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .eq('type', 'system_prompt')
      .single();

    const systemInstruction = aiConfig?.content || "אתה עוזר מקצועי של ח. סבן חומרי בניין.";

    // 2. אתחול המודל עם ההנחיות ששלפנו
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction, // כאן המוח "לומד" איך להתנהג
    });

    // 3. ניהול שיחה (שליחת ההיסטוריה ל-AI)
    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    // 4. שמירת השיחה להיסטוריה (לצורך ניטור ב-Admin)
    await supabase.from('chat_history').insert([
      { user_id: userId, query: lastMessage, response: responseText }
    ]);

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "הצ'אט נתקל בבעיה" }, { status: 500 });
  }
}
