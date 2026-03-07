import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { rtdb } from "@/lib/firebase";
import { ref, push, update, get, set } from "firebase/database";
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
    // שימוש ב-URL API סטנדרטי
    const apiUrl = new URL(`https://sidor.vercel.app/api/gemini`);
    const res = await fetch(apiUrl.toString(), {
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

    // --- מנגנון מניעת כפילויות (Deduplication) - תיקון ל-Web Standard ---
    const cleanPhone = phone ? phone.replace('+', '').trim() : "anonymous";
    const rawHash = `${cleanPhone}_${lastUserMsg.substring(0, 30)}`;
    const msgHash = btoa(encodeURIComponent(rawHash)).replace(/[/+=]/g, ""); 
    
    const lockRef = ref(rtdb, `saban94/temp_locks/${msgHash}`);
    
    const lockSnap = await get(lockRef);
    if (lockSnap.exists()) {
      const lockTime = lockSnap.val();
      if (Date.now() - lockTime < 5000) { // נעילה ל-5 שניות
        return NextResponse.json({ text: "", status: "duplicate_ignored" });
      }
    }
    await set(lockRef, Date.now()); // יצירת הנעילה
    // -------------------------------------------

    // 2. שליפת DNA, מלאי והתייעצות במקביל (אופטימיזציית ביצועים)
    const [advisorData, productsResult, configResult] = await Promise.all([
      callSidorConsultant(lastUserMsg),
      supabase.from('inventory').select('*, stock_quantity, product_magic_link, sku')
        .textSearch('product_name', lastUserMsg, { config: 'hebrew' }).limit(1),
      supabase.from('system_rules').select('instruction, agent_type, is_active')
    ]);
    
    const config = configResult.data;
    const products = productsResult.data;
    
    const executorDNA = config?.filter(r => r.agent_type === 'executor' && r.is_active).map(r => r.instruction).join("\n") || "";
    const activeKeysConfig = config?.filter(r => r.agent_type === 'api_key_status');

    const foundProduct = products?.[0] || null;
    let stockAlert = "";
    if (foundProduct) {
      const stock = foundProduct.stock_quantity || 0;
      stockAlert = stock <= 0 ? `⚠️ חסר במלאי!` : stock < 10 ? `⚠️ רק ${stock} יחידות נותרו!` : "";
    }

    // 4. ניהול בריכת מפתחות מהמשתנה ב-Vercel (GOOGLE_AI_KEY_POOL)
    const keyPoolString = process.env.GOOGLE_AI_KEY_POOL || "";
    const keys = keyPoolString.split(',').map(k => k.trim()).filter(k => k.length > 10);
    
    const modelPool = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]; // שמות מודלים מעודכנים
    let aiResponse = "";

    // 5. לוגיקת רוטציה (מפתח -> מודל)
    outerLoop: for (let i = 0; i < keys.length; i++) {
      const isKeyDisabled = activeKeysConfig?.find(k => k.instruction === `KEY_${i+1}`)?.is_active === false;
      if (isKeyDisabled) continue;

      const genAI = new GoogleGenerativeAI(keys[i]);

      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `${executorDNA}\nיועץ: ${advisorData?.reply || ""}\nמלאי: ${stockAlert}\nחתימה: H.SABAN 1994`
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
          console.warn(`Key ${i+1} with model ${modelName} failed`);
          await updateDashboardQuota(i + 1, modelName, "QUOTA_EXCEEDED");
          continue;
        }
      }
    }

    // 6. הזרקת לינקים ומשלוח ל-Pipeline
    if (foundProduct && aiResponse) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link) + (stockAlert ? `\n${stockAlert}` : "");
    }

    if (phone && aiResponse) {
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), { text: aiResponse, timestamp: Date.now() });
    }

    return NextResponse.json({ text: aiResponse || "מצטער, חלה שגיאה בעיבוד הבקשה." });

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
