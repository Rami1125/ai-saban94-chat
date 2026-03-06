import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userId, phone } = await req.json();
    
    // 1. ליטוש: במקום לחפש רק בהודעה האחרונה, נחפש ב-3 ההודעות האחרונות
    // כדי לא לאבד את הקשר המוצר (Context)
    const contextSearch = messages.slice(-3).map((m: any) => m.content).join(" ");

    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      // חיפוש על פני כל ההקשר האחרון
      .textSearch('product_name', contextSearch, { 
        config: 'hebrew', 
        type: 'websearch' 
      })
      .limit(1);

    let productContext = "";
    let foundProduct = null;

    if (products && products.length > 0) {
      foundProduct = products[0];
      productContext = `\n[מידע מעודכן על המוצר שזוהה בשיחה: ${foundProduct.product_name}, מחיר: ${foundProduct.price}₪, SKU: ${foundProduct.sku}]`;
    }

    // 2. אתחול ה-AI (המשך הקוד שלך ללא שינוי בדינמיקה)
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    
    let aiResponse = "";
    // ... לוגיקת ה-AI שלך ...

    // 3. החזרת תשובה עם המוצר העדכני ביותר שנמצא
    return NextResponse.json({ 
      text: aiResponse, 
      product: foundProduct // זה מה שיעדכן את ה-ActionOverlays למוצר הנכון (לוח גבס)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
    // 2. אתחול ה-AI עם הנחיית עיצוב HTML
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || process.env.GEMINI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim());
    
    let aiResponse = "";
    for (const key of keyPool) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.1-flash-lite-preview",
          systemInstruction: `אתה נציג ח. סבן. 
          חוק עיצוב קריטי: אל תשתמש בסימני ** להדגשה. 
          במקום זה, השתמש בתגיות <b>טקסט מודגש</b> עבור שמות מוצרים, מחירים או דגשים חשובים. 
          השתמש ב-<br> לירידת שורה.`
        });

        const result = await model.generateContent(lastUserMsg + productContext);
        aiResponse = result.response.text();
        
        // ניקוי שאריות כוכביות אם המודל שכח את עצמו
        aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        if (aiResponse) break;
      } catch (e) { continue; }
    }

    // 3. הזרקה לווטסאפ (ללא שינוי) ולממשק
    if (phone) {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: aiResponse,
        timestamp: Date.now()
      });
    }

    return NextResponse.json({ 
      text: aiResponse, 
      product: foundProduct 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
