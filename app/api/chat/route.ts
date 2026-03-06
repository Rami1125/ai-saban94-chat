import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();

    // 1. ניהול מאגר המפתחות (Key Pool)
    const rawPool = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawPool.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (keyPool.length === 0) {
      console.error("❌ No API Keys found in environment variables");
      return NextResponse.json({ error: "תצורת מפתחות API חסרה בשרת" }, { status: 500 });
    }

    // 2. שליפת ה-System Prompt (המוח) מ-Supabase
    const { data: aiConfig } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .eq('type', 'system_prompt')
      .single();

    const systemInstruction = aiConfig?.content || "אתה עוזר מקצועי של ח. סבן חומרי בניין. ענה בעברית פשוטה ותמציתית.";

    let responseText = "";
    let lastError = "";

    // 3. לוגיקת דילוג בין מפתחות (Failover Loop)
    for (const apiKey of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash-latest", // שימוש בגרסה המעודכנת ביותר
          systemInstruction: systemInstruction 
        });

        // יצירת היסטוריית שיחה עבור המודל
        const chat = model.startChat({
          history: messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        responseText = response.text();

        if (responseText) break; // הצלחנו! יוצאים מהלולאה
      } catch (e: any) {
        console.warn(`⚠️ Key failed, trying next... Error: ${e.message}`);
        lastError = e.message;
        continue; // עוברים למפתח הבא במאגר
      }
    }

    if (!responseText) {
      throw new Error(`כל המפתחות במאגר נכשלו. שגיאה אחרונה: ${lastError}`);
    }

    // 4. הזרקה לצינור ה-Firebase עבור JONI (ווטסאפ)
    if (phone) {
      try {
        await push(ref(rtdb, 'saban94/send'), {
          to: phone,
          text: responseText,
          timestamp: Date.now(),
          source: "ai-saban-bridge"
        });
      } catch (fbError) {
        console.error("❌ Firebase Injection Failed:", fbError);
      }
    }

    // 5. שמירה להיסטוריה ב-Supabase לצורך ניטור מנהל
    await supabase.from('chat_history').insert([
      { 
        user_id: userId || 'anonymous', 
        query: messages[messages.length - 1].content, 
        response: responseText,
        metadata: { phone, timestamp: new Date().toISOString() }
      }
    ]);

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("🚨 Bridge Critical Error:", error);
    return NextResponse.json(
      { error: "הגשר נתקל בשגיאה קריטית", details: error.message }, 
      { status: 500 }
    );
  }
}
