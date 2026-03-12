import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";
import { getRTDB } from "@/lib/firebase";
import { ref, update } from "firebase/database";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const rtdb = getRTDB();
    
    const { messages, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // --- הטמעת חיפוש חכם מתוקנת ---
    const cleanSearch = lastUserMsg.replace(/[?？]/g, "").trim();
    
    const [configRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku, price, unit_type, description')
        .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`)
        .limit(1)
        .maybeSingle()
    ]);

    // משתנה שניתן לשינוי (let) ומוגדר רק פעם אחת
    let product = inventoryRes.data;

    if (!product && cleanSearch.includes(" ")) {
      const firstWord = cleanSearch.split(" ")[0];
      const fallbackSearch = await supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku, price, unit_type, description')
        .ilike('product_name', `%${firstWord}%`)
        .limit(1)
        .maybeSingle();
      if (fallbackSearch.data) {
        product = fallbackSearch.data;
      }
    }
    // --- סוף הטמעת חיפוש חכם ---

    const executorDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "נציג מכירות ח. סבן";

    // 2. ניהול מפתחות ומודלים - מרץ 2026
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = [
      "gemini-3.1-flash-lite-preview", 
      "gemini-3.1-pro-preview",       
      "gemini-3-flash-preview"        
    ];
    
    let aiResponse = "";
    let success = false;

    // 3. לוגיקת רוטציה חכמה
    for (const key of keys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        if (success) break;
        
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ${executorDNA}
              תפקיד: מנהל מכירות דיגיטלי ב-"ח. סבן חומרי בניין".
              
              --- כלי עבודה: כרטיס מוצר מהמלאי ---
              ${product ? `
              מצאתי במערכת מוצר מתאים:
              📦 *${product.product_name}*
              --------------------------------
              📝 תיאור: ${product.description || "חומר בניין מקצועי"}
              💰 מחיר: ₪${product.price} ${product.unit_type ? `ל-${product.unit_type}` : ""}
              ✅ מלאי: ${product.stock_quantity > 0 ? "זמין לאספקה" : "צור קשר לבדיקת מלאי"}
              🆔 מק"ט: ${product.sku}
              --------------------------------
              🔗 לרכישה: MAGIC_URL
              ` : "לא נמצא מוצר ספציפי במלאי. השב באדיבות על מגוון חומרי הבניין שאנו מחזיקים."}

              הנחיות:
              1. ענה בעברית פשוטה, "בגובה העיניים", כמו איש מכירות מנוסה.
              2. אם יש מוצר, הצג את הכרטיס המודגש לעיל.
              3. בסוף כל הודעה, תמיד תחתום בברכה: "תודה שבחרתה בח.סבן חומרי בנין".
              סיים בחתימה: תודה שבחרת בח.סבן חומרי בניין | ח.סבן חומרי בנין התלמיד 6 הוד השרון
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();
          
          if (responseText) {
            aiResponse = responseText;
            success = true;
          }
        } catch (e: any) {
          console.warn(`Switching key/model due to error...`);
        }
      }
    }

// 4. עיבוד סופי - החלפה חכמה של הלינק
if (product) {
  // יצירת הלינק הסופי: עדיפות ללינק מה-DB, ואז לפורמט SKU
  const finalLink = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
  
  // שימוש ב-Regex כדי למצוא את MAGIC_URL גם אם יש מסביבו רווחים, סוגריים או אותיות קטנות
  const magicUrlRegex = /MAGIC_URL/gi; 

  if (magicUrlRegex.test(aiResponse)) {
    aiResponse = aiResponse.replace(magicUrlRegex, finalLink);
  } else if (!aiResponse.includes(finalLink)) {
    // ליתר ביטחון: אם ה-AI שכח לכתוב MAGIC_URL אבל מצאנו מוצר, נוסיף את הלינק בסוף
    aiResponse += `\n\n🔗 [לצפייה במוצר]: ${finalLink}`;
  }
}

    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ 
      text: aiResponse || "שלום, כאן ח. סבן. איך נוכל לעזור לכם היום בפרויקט?",
      product: product 
    });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
