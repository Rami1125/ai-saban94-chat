import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 1. חיפוש מוצר ב-Inventory (Supabase) - שליפה לפי מילות מפתח
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('name', lastUserMsg, { 
        config: 'hebrew',
        type: 'websearch' 
      })
      .limit(1);

    let productContext = "";
    let foundProduct = null;

    if (products && products.length > 0) {
      foundProduct = products[0];
      // הקשר טכני ל-Gemini כדי שידע להסביר על המוצר הספציפי שנמצא
      productContext = `\n[מידע טכני מהמלאי: שם: ${foundProduct.name}, מחיר: ${foundProduct.price}₪, SKU: ${foundProduct.sku}, תכונות: ${foundProduct.description}]`;
    }

    // 2. אתחול Gemini 3.1 Flash-Lite (המוח החדש)
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    
    let aiResponse = "";
    for (const key of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite-preview",
          systemInstruction: "אתה מומחה חומרי בניין בח. סבן. ענה במקצועיות, תמציתיות ובגובה העיניים. אם נמצא מוצר במלאי, הסבר עליו בקצרה."
        });

        const result = await model.generateContent(lastUserMsg + productContext);
        aiResponse = result.response.text();
        if (aiResponse) break;
      } catch (e) { continue; }
    }

    // 3. הזרקה לווטסאפ (טקסט בלבד לצינור של JONI)
    if (phone && aiResponse) {
      const whatsappText = foundProduct 
        ? `${aiResponse}\n\n📦 *מוצר במלאי:* ${foundProduct.name}\n💰 *מחיר:* ${foundProduct.price}₪\n🖼️ ${foundProduct.image_url}`
        : aiResponse;

      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: whatsappText,
        timestamp: Date.now()
      });
    }

    // 4. החזרת תשובה לממשק ה-Web (כולל אובייקט המוצר להצגת ה-ProductCard)
    return NextResponse.json({ 
      text: aiResponse, 
      product: foundProduct // כאן הממשק יקבל את הנתונים וירנדר את ה-ProductCard ששלחת
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
