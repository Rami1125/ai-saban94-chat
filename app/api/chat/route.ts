import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();

    // 1. ניהול מאגר המפתחות (Key Pool) מהעדכונים האחרונים
    const rawPool = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawPool.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (keyPool.length === 0) {
      return NextResponse.json({ error: "No API Keys found" }, { status: 500 });
    }

    // 2. שליפת ה-System Prompt מ-Supabase
    const { data: aiConfig } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .eq('type', 'system_prompt')
      .single();

    const systemInstruction = aiConfig?.content || "אתה עוזר מקצועי של ח. סבן חומרי בניין.";

    let responseText = "";
    let lastError = "";

    // 3. לוגיקת דילוג (Failover) עם מודל Gemini 3.1 Flash-Lite
    for (const apiKey of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // עדכון למודל החדש ביותר לפי ההכרזה מ-3 במרץ 2026
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite-preview", 
          systemInstruction: systemInstruction 
        });

        const chat = model.startChat({
          history: messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        responseText = result.response.text();

        if (responseText) break;
      } catch (e: any) {
        lastError = e.message;
        continue;
      }
    }

    if (!responseText) throw new Error(`All keys failed: ${lastError}`);

    // 4. הזרקה לווטסאפ (Firebase)
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: responseText,
        timestamp: Date.now()
      });
    }

    // 5. שמירת היסטוריה
    await supabase.from('chat_history').insert([
      { user_id: userId, query: messages[messages.length - 1].content, response: responseText }
    ]);

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("Critical Bridge Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
