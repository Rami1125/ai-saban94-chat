import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 1. חיפוש מוצר ב-Inventory (Supabase)
    // אנחנו מחפשים התאמה בשם המוצר לפי מילות מפתח מהלקוח
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('name', lastUserMsg, { 
        config: 'hebrew',
        type: 'websearch' 
      })
      .limit(1);

    let productContext = "";
    let productCard = "";

    if (products && products.length > 0) {
      const p = products[0];
      // הקשר שה-AI יכיר כדי לענות במקצועיות
      productContext = `\n[מידע מהמלאי: נמצא מוצר ${p.name}, מחיר: ${p.price}₪, תיאור: ${p.description}]`;
      
      // כרטיס מעוצב שיוזרק לווטסאפ (Markdown ש-WhatsApp מבינה)
      productCard = `\n\n📦 *כרטיס מוצר מצאתי עבורך:* ━━━━━━━━━━━━
*${p.name}*
💰 *מחיר:* ${p.price}₪
📝 *תיאור:* ${p.description}
🖼️ *תמונה:* ${p.image_url || 'אין תמונה זמינה'}
━━━━━━━━━━━━`;
    }

    // 2. ניהול מאגר מפתחות (Key Pool)
    const rawPool = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawPool.split(',').map(k => k.trim()).filter(k => k.length > 0);

    // 3. שליפת ה-System Prompt (המוח) מה-Admin
    const { data: aiConfig } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .eq('type', 'system_prompt')
      .single();

    const systemInstruction = aiConfig?.content || "אתה נציג מכירות מקצועי של ח. סבן חומרי בניין.";

    let responseText = "";
    let lastError = "";

    // 4. לוגיקת דילוג בין מפתחות עם Gemini 3.1 Flash-Lite
    for (const apiKey of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite-preview",
          systemInstruction: systemInstruction + productContext
        });

        const chat = model.startChat({
          history: messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        });

        const result = await chat.sendMessage(lastUserMsg);
        responseText = result.response.text();
        if (responseText) break;
      } catch (e: any) {
        lastError = e.message;
        continue;
      }
    }

    if (!responseText) throw new Error(`All keys failed: ${lastError}`);

    // הוספת הכרטיס לתשובה הסופית
    const finalMessage = responseText + productCard;

    // 5. הזרקה לווטסאפ (Firebase/JONI)
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: finalMessage,
        timestamp: Date.now()
      });
    }

    // 6. תיעוד ב-Supabase
    await supabase.from('chat_history').insert([
      { user_id: userId || 'admin', query: lastUserMsg, response: finalMessage }
    ]);

    return NextResponse.json({ text: finalMessage, product: products?.[0] || null });

  } catch (error: any) {
    console.error("Bridge Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
