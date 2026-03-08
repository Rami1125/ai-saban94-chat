import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push, update } from "firebase/database";
import { NextResponse } from "next/server";

// 1. פונקציות עזר
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

    // 2. שליפת DNA, מפתחות ומלאי במקביל
    const [configRes, invRes, advisorData] = await Promise.all([
      supabase.from('system_rules').select('*'),
      supabase.from('inventory').select('*').textSearch('product_name', lastUserMsg, { config: 'hebrew', type: 'plain' }).limit(1),
      callSidorConsultant(lastUserMsg)
    ]);

    const config = configRes.data;
    const foundProduct = invRes.data?.[0] || null;

    const executorDNA = config?.filter(r => r.agent_type === 'executor' && r.is_active).map(r => r.instruction).join("\n") || "";
    const activeKeysConfig = config?.filter(r => r.agent_type === 'api_key_status');

    // 3. הכנת סטטוס מלאי וקונטקסט מוצר
    let stockAlert = "";
    let productContext = "לא נמצא מוצר תואם במלאי.";
    
    if (foundProduct) {
      const stock = foundProduct.stock_quantity || 0;
      stockAlert = stock <= 0 ? `⚠️ חסר במלאי!` : stock < 10 ? `⚠️ רק ${stock} יחידות נותרו!` : "";
      productContext = `מוצר זמין: ${foundProduct.product_name} | מזהה (ID/SKU): ${foundProduct.sku || foundProduct.id}`;
    }

    // 4. ניהול בריכת מפתחות (מ-Vercel Environment)
    const keyPoolString = process.env.GOOGLE_AI_KEY_POOL || "";
    const keys = keyPoolString.split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
    
    let aiResponse = "";

    // 5. לוגיקת רוטציה חסינה
    outerLoop: for (let i = 0; i < keys.length; i++) {
      const isKeyDisabled = activeKeysConfig?.find(k => k.instruction === `KEY_${i+1}`)?.is_active === false;
      if (isKeyDisabled) continue;

      const genAI = new GoogleGenerativeAI(keys[i]);

      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ${executorDNA}
              יועץ טכני: ${advisorData?.reply || ""}
              נתוני מלאי בזמן אמת: ${productContext}
              סטטוס: ${stockAlert}
              
              חוקים:
              - ענה בקיצור, ישיר ומקצועי.
              - אם יש מוצר, סיים במחרוזת MAGIC_URL.
              - חתימה: H.SABAN 1994
            `
          });

          const result = await model.generateContent(lastUserMsg);
          aiResponse = result.response.text();

          if (aiResponse) {
            await Promise.all([
              updateDashboardQuota(i + 1, modelName, "SUCCESS"),
              logToDailyChat(lastUserMsg, user_id)
            ]);
            break outerLoop; 
          }
        } catch (e: any) {
          console.warn(`Quota hit: Key ${i+1}, Model ${modelName}`);
          await updateDashboardQuota(i + 1, modelName, "QUOTA_EXCEEDED");
          continue;
        }
      }
    }

    // 6. הזרקת לינק דינמי לפי ה-ID מה-Inventory
    if (foundProduct && aiResponse.includes("MAGIC_URL")) {
      const productId = foundProduct.sku || foundProduct.id;
      const link = `https://sidor.vercel.app/product-pages/index.html?id=${productId}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link);
      if (stockAlert) aiResponse += `\n${stockAlert}`;
    }

    // 7. עדכון Pipeline לוואטסאפ (אם יש טלפון)
    if (phone) {
      const cleanPhone = phone.replace('+', '').trim();
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), { text: aiResponse, timestamp: Date.now() });
    }

    return NextResponse.json({ text: aiResponse });

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
