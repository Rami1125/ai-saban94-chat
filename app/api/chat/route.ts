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
// ניקוי סימני שאלה לחיפוש נקי
    const cleanSearch = lastUserMsg.replace(/[?？]/g, "").trim();
    
    // שליפת חוקים ומלאי במקביל
    const [configRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('inventory')
        .select('*')
        // חיפוש חכם ב-3 עמודות במקביל כדי לא לפספס
        .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%,search_text.ilike.%${cleanSearch}%`)
        .limit(1)
        .maybeSingle()
    ]);

    let product = inventoryRes.data;

    // DNA מהטבלה
    const executorDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "נציג מכירות ח. סבן";

    // משתנה שניתן לשינוי (let) ומוגדר רק פעם אחת
    let product = inventoryRes.data;

    if (!product && cleanSearch.includes(" ")) {
      const firstWord = cleanSearch.split(" ")[0];
      const fallbackSearch = await supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku, price, unit_type, description, image_url, youtube_url')
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
            model: modelName,systemInstruction: `
              ### STRICT SYSTEM RULES (DNA) ###
              ${executorDNA}
              
              ### IDENTITY ###
              תפקיד: מנהל מכירות דיגיטלי ב-"ח. סבן חומרי בניין".
              
              ### DATA SOURCE (JSON) ###
              ${product ? JSON.stringify(product) : "STATUS: NO_PRODUCT_FOUND"}

              ### MANDATORY EXECUTION RULES ###
              1. IF PRODUCT FOUND: הצג *רק* את כרטיס המוצר לפי מבנה "חוק הברזל" מה-DNA למעלה.
              2. PLACEHOLDER: חובה להשתמש במחרוזת MAGIC_URL עבור הלינק. אל תכתוב לינק בעצמך.
              3. DATA INTEGRITY: אל תמציא מחירים. אם המחיר 0, כתוב "צור קשר להצעת מחיר".
              4. NO CONVERSATION: אם נמצא מוצר, אל תוסיף משפטי פתיחה. לך ישר לכרטיס.
              5. SIGNATURE: תודה שבחרת בח.סבן חומרי בניין | ח.סבן חומרי בנין התלמיד 6 הוד השרון.
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();
          
          if (responseText) {
            aiResponse = responseText;
            success = true;
          }
        } catch (e) {
          console.warn(`Switching key/model...`);
        }
      }
    }

    // החלפת לינק קסם - השלב שבו ה-URL מוזרק לטקסט
    if (product) {
      const finalLink = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
      const magicUrlRegex = /MAGIC_URL/gi; 

      if (magicUrlRegex.test(aiResponse)) {
        aiResponse = aiResponse.replace(magicUrlRegex, finalLink);
      } else if (!aiResponse.includes(finalLink)) {
        // בטחון: אם ה-AI "שכח", נוסיף בסוף
        aiResponse += `\n\n🔗 לצפייה במוצר: ${finalLink}`;
      }
    }

    // עדכון Firebase Pipeline
    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ text: aiResponse, product });

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
