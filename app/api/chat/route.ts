import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push, update } from "firebase/database";
import { NextResponse } from "next/server";

// 1. ניהול לוגים ודשבורד בזמן אמת
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

// קריאה לייעוץ חיצוני (Sidor AI)
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

    // 2. שליפת הגדרות מערכת (DNA) ובדיקת מפתחות פעילים
    const { data: config } = await supabase.from('system_rules')
      .select('instruction, agent_type, is_active');
    
    const executorDNA = config?.filter(r => r.agent_type === 'executor' && r.is_active).map(r => r.instruction).join("\n") || "";
    const activeKeysConfig = config?.filter(r => r.agent_type === 'api_key_status');

    // 3. מנוע חיפוש מלאי חכם (רב-עמודתי)
    const rawWords = lastUserMsg
      .replace(/[^\u0590-\u05FF0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word: string) => word.length >= 2 && !['אני', 'רוצה', 'לגבי', 'בנושא', 'מחפש'].includes(word));

    const conditions = rawWords.map((word: string) => 
      `product_name.ilike.%${word}%,sku.ilike.%${word}%,keywords.ilike.%${word}%`
    ).join(',');

    const [advisorData, { data: products }] = await Promise.all([
      callSidorConsultant(lastUserMsg),
      supabase.from('inventory')
        .select('*, stock_quantity, product_magic_link, sku')
        .or(conditions || `product_name.ilike.%${lastUserMsg}%`)
        .order('stock_quantity', { ascending: false })
        .limit(1)
    ]);

    const foundProduct = products?.[0] || null;
    let stockAlert = "";
    if (foundProduct) {
      const stock = foundProduct.stock_quantity || 0;
      stockAlert = stock <= 0 ? `⚠️ חסר במלאי!` : stock < 10 ? `⚠️ רק ${stock} יחידות נותרו!` : "";
    }

    // 4. ניהול בריכת המפתחות (POOL)
    const keyPoolString = process.env.GOOGLE_AI_KEY_POOL || "";
    const keys = keyPoolString.split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-pro"];

    let aiResponse = "";
    let success = false;

    // 5. לוגיקת הרוטציה הקריטית
    for (let i = 0; i < keys.length; i++) {
      if (success) break;

      // בדיקה אם המפתח הושבת ידנית ב-Supabase
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
              יועץ חיצוני: ${advisorData?.reply || ""}
              נתוני מוצר מהמלאי: ${foundProduct ? foundProduct.product_name : "לא נמצא מוצר ספציפי"}
              מק"ט: ${foundProduct ? foundProduct.sku : "אין"}
              מצב מלאי: ${stockAlert}
              
              הנחיה למענה: אם מצאת מוצר, שלב את המילה MAGIC_URL בסיום. 
              תמיד תחתום בסוף: H.SABAN 1994
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();

          if (responseText) {
            aiResponse = responseText;
            await Promise.all([
              updateDashboardQuota(i + 1, modelName, "SUCCESS"),
              logToDailyChat(lastUserMsg, user_id)
            ]);
            success = true;
          }
        } catch (e: any) {
          console.warn(`Key ${i+1} failed with model ${modelName}. Error: ${e.message}`);
          await updateDashboardQuota(i + 1, modelName, "QUOTA_EXCEEDED");
        }
      }
    }

    // 6. הזרקת לינקים חכמה (Magic Links)
    if (foundProduct && aiResponse.includes("MAGIC_URL")) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link);
      if (stockAlert.includes("⚠️")) aiResponse += `\n${stockAlert}`;
    }

    // 7. עדכון ה-Pipeline למשלוח אוטומטי (WhatsApp/Sms)
    if (phone && aiResponse) {
      const cleanPhone = phone.replace('+', '').trim();
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), { 
        text: aiResponse, 
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ text: aiResponse });

  } catch (error: any) {
    console.error("Critical Error in AI Brain:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
