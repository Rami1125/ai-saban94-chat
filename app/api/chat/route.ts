import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 1. חיפוש מוצר במלאי (Supabase Inventory)
    // אנחנו מחפשים התאמה בשם המוצר לפי מה שהלקוח כתב
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('name', lastUserMsg, { 
        config: 'hebrew',
        type: 'websearch' 
      })
      .limit(1);

    let productContext = "";
    let productCardForWhatsApp = "";

    if (products && products.length > 0) {
      const p = products[0];
      // מידע ש-Gemini יקרא כדי לענות
      productContext = `\n[מידע מהמלאי: נמצא מוצר ${p.name}, מחיר: ${p.price}₪, תיאור: ${p.description}]`;
      
      // כרטיס מעוצב שיוזרק לווטסאפ
      productCardForWhatsApp = `\n\n📦 *כרטיס מוצר מצאתי עבורך:* \n━━━━━━━━━━━━\n*${p.name}*\n💰 *מחיר:* ${p.price}₪\n📝 *תיאור:* ${p.description}\n🖼️ *תמונה:* ${p.image_url || 'אין תמונה זמינה'}\n━━━━━━━━━━━━`;
    }

    // 2. אתחול Gemini 3.1 Flash-Lite עם הקשר המלאי
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    
    let aiResponse = "";
    for (const key of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite-preview",
          systemInstruction: "אתה איש מכירות של ח. סבן. אם יש מידע על מוצר, השתמש בו כדי לענות בצורה מכירתית."
        });

        const result = await model.generateContent(lastUserMsg + productContext);
        aiResponse = result.response.text();
        if (aiResponse) break;
      } catch (e) { continue; }
    }

    const finalMessage = aiResponse + productCardForWhatsApp;

    // 3. הזרקה לצינור ה-Firebase עבור JONI
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: finalMessage,
        timestamp: Date.now()
      });
    }

    return NextResponse.json({ text: finalMessage, product: products?.[0] || null });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
