import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push, update } from "firebase/database";
import { NextResponse } from "next/server";

// 1. פונקציות עזר לניהול ה-Dashboard והדיווח
async function updateDashboardQuota(keyIndex: number, modelName: string, status: string) {
  const dashRef = ref(rtdb, `saban94/dashboard/quota_logs/${Date.now()}`);
  await update(dashRef, { key_index: keyIndex, model: modelName, status, timestamp: Date.now() });
}

async function logToDailyChat(message: string, userId: string) {
  const chatRef = ref(rtdb, 'chat-sidor');
  await push(chatRef, {
    text: message,
    user_name: userId || 'לקוח',
    timestamp: Date.now()
  });
}

async function callSidorConsultant(message: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); 
    const res = await fetch(`https://sidor.vercel.app/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok ? await res.json() : null;
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const { messages, phone, user_id } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // 2. שליפת DNA ובדיקת מפתחות מה-Supabase
    const { data: config } = await supabase.from('system_rules')
      .select('instruction, agent_type, is_active');
    
    const executorDNA = config?.filter(r => r.agent_type === 'executor' && r.is_active).map(r => r.instruction).join("\n") || "";
    const activeKeysConfig = config?.filter(r => r.agent_type === 'api_key_status');

// 3. חיפוש גמיש רב-עמודתי (שם, מק"ט ומילות מפתח)
    const noiseWords = ['אני', 'רוצה', 'לגבי', 'בנושא', 'מחפש', 'צריך', 'מעוניין', 'האם', 'שלום', 'הזמנת'];
    const searchTerms = lastUserMsg
      .replace(/[^\u0590-\u05FF0-9\s]/g, ' ') // משאיר רק עברית ומספרים
      .split(/\s+/)
      .filter(word => word.length >= 2 && !noiseWords.includes(word));

    console.log("🔍 מילות מפתח לחיפוש:", searchTerms);

    // בניית תנאי חיפוש דינמי: כל מילה נבדקת ב-3 עמודות שונות
    const conditions = searchTerms.map(word => 
      `product_name.ilike.%${word}%,sku.ilike.%${word}%,keywords.ilike.%${word}%`
    ).join(',');

    const [advisorData, { data: products }] = await Promise.all([
      callSidorConsultant(lastUserMsg),
      supabase.from('inventory')
        .select('*, stock_quantity, product_magic_link, sku')
        .or(conditions || `product_name.ilike.%${lastUserMsg}%`)
        .order('stock_quantity', { ascending: false }) // מוצרים עם מלאי קופצים להתחלה
        .limit(1)
    ]);

    console.log("📦 תוצאה שנמצאה במלאי:", products?.[0]?.product_name || "לא נמצא כלום");

    const foundProduct = products?.[0] || null;
    let stockAlert = "";
    let productContext = "לא נמצא מוצר תואם מדויק במלאי.";

    if (foundProduct) {
      const stock = foundProduct.stock_quantity || 0;
      stockAlert = stock <= 0 ? `⚠️ חסר במלאי כרגע` : stock < 10 ? `⚠️ מלאי מוגבל: רק ${stock} יחידות!` : "זמין במלאי";
      productContext = `נמצא מוצר: ${foundProduct.product_name} | מק"ט: ${foundProduct.sku} | מלאי: ${stock}`;
    }

    const foundProduct = products?.[0] || null;
    let stockAlert = "";
    if (foundProduct) {
      const stock = foundProduct.stock_quantity || 0;
      stockAlert = stock <= 0 ? `⚠️ חסר במלאי!` : stock < 10 ? `⚠️ רק ${stock} יחידות נותרו!` : "";
    }

    // 4. ניהול בריכת מפתחות מהמשתנה ב-Vercel (GOOGLE_AI_KEY_POOL)
    const keyPoolString = process.env.GOOGLE_AI_KEY_POOL || "";
    const keys = keyPoolString.split(',').map(k => k.trim()).filter(k => k.length > 10);
    
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-flash-preview", "gemini-3.1-pro-preview"];
 let aiResponse = "";
    let success = false; // שימוש בדגל במקום outerLoop למניעת שגיאות Build

    // 5. לוגיקת רוטציה (מפתח -> מודל)
    for (let i = 0; i < keys.length; i++) {
      if (success) break;

      const isKeyDisabled = activeKeysConfig?.find(k => k.instruction === `KEY_${i+1}`)?.is_active === false;
      if (isKeyDisabled) continue;

      const genAI = new GoogleGenerativeAI(keys[i]);

      for (const modelName of modelPool) {
        if (success) break;

        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
            ${executorDNA}
            
            Context טכני (מיועץ סידור): ${advisorData?.reply || "אין מידע טכני נוסף."}
            
            נתוני מוצר מהמלאי:
            - שם: ${foundProduct ? foundProduct.product_name : "לא נמצא מוצר ספציפי"}
            - מק"ט: ${foundProduct ? foundProduct.sku : "אין מק"ט"}
            - מצב מלאי: ${stockAlert}

            הנחיות לביצוע:
            1. אם נמצא מוצר (${foundProduct ? 'כן' : 'לא'}):
               - הראה ללקוח שמצאת בדיוק את מה שהוא מחפש.
               - אם המלאי הוא 0, ציין שהמוצר חסר כרגע במלאי השוטף אך ניתן לבדוק הזמנה מיוחדת.
               - אם נמצא גבס, הצע בעדינות מוצרים משלימים (ברגים, ניצבים, מסלולים, שפכטל).
            2. סגנון: מקצועי, תמציתי, "מתכנת אומנותי" - נקי וישיר.
            3. סיום: אם מצאת מוצר, חובה לסיים במילה המדויקת MAGIC_URL כדי שהלינק יוזרק.
            
            חתימה חובה: H.SABAN 1994
          `

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();

          if (responseText) {
            aiResponse = responseText;
            await Promise.all([
              updateDashboardQuota(i + 1, modelName, "SUCCESS"),
              logToDailyChat(lastUserMsg, user_id)
            ]);
            success = true; // מסמן הצלחה ויוצא מהלופים
          }
        } catch (e: any) {
          console.warn(`Key ${i+1} Model ${modelName} Quota Exceeded`);
          await updateDashboardQuota(i + 1, modelName, "QUOTA_EXCEEDED");
        }
      }
    }

    // 6. הזרקת לינקים ומשלוח ל-Pipeline
    if (foundProduct && aiResponse.includes("MAGIC_URL")) {
      // שליפת הלינק הישיר (עדיפות ל-magic_link ואז ל-SKU)
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      
      // החלפה נקייה של הלינק
      aiResponse = aiResponse.replace("MAGIC_URL", link);
      
      // הוספת התראת מלאי רק אם יש חוסר (⚠️)
      if (stockAlert.includes("⚠️")) {
        aiResponse += `\n${stockAlert}`;
      }
    }

    // 7. משלוח ל-Pipeline
    if (phone && aiResponse) {
      const cleanPhone = phone.replace('+', '').trim();
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), { text: aiResponse, timestamp: Date.now() });
    }

    return NextResponse.json({ text: aiResponse });

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
