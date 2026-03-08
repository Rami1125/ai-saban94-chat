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

// שחקן חיזוק: מנוע חיפוש גוגל מותאם (CSE)
async function getGoogleCseInfo(query: string) {
  const cx = "9275b596f6d184447";
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=1`
    );
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const image = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || null;
      return { 
        snippet: item.snippet, 
        link: item.link, 
        image: image 
      };
    }
    return null;
  } catch (e) { 
    return null; 
  }
}

async function callSidorConsultant(message: string) {
  try {
    const res = await fetch(`https://sidor.vercel.app/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return res.ok ? await res.json() : null;
  } catch (e) { return null; }
}

export async function POST(req: Request) {
  try {
    const { messages, phone, user_id } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // --- מנגנון מניעת כפילויות (Deduplication) ---
    const cleanPhone = phone ? phone.replace('+', '').trim() : "anonymous";
    const msgHash = Buffer.from(`${cleanPhone}_${lastUserMsg.substring(0, 30)}`).toString('base64');
    const lockRef = ref(rtdb, `saban94/temp_locks/${msgHash}`);
    const lockSnap = await get(lockRef);
    if (lockSnap.exists() && (Date.now() - lockSnap.val() < 5000)) {
      return NextResponse.json({ text: "", status: "duplicate_ignored" });
    }
    await set(lockRef, Date.now());

    // 2. שליפת DNA (ספר החוקים) ובדיקת מפתחות מה-Supabase
    const { data: config } = await supabase.from('system_rules').select('instruction, agent_type, is_active');
    const executorDNA = config?.filter(r => r.agent_type === 'executor' && r.is_active).map(r => r.instruction).join("\n") || "";
    const activeKeysConfig = config?.filter(r => r.agent_type === 'api_key_status');

    // 3. חיפושים במקביל (מלאי + יועץ)
    let [advisorData, { data: products }] = await Promise.all([
      callSidorConsultant(lastUserMsg),
      supabase.from('inventory').select('*').textSearch('product_name', lastUserMsg, { config: 'hebrew' }).limit(1)
    ]);

    const foundProduct = products?.[0] || null;
    let externalInfo = null;

    // הפעלת שחקן החיזוק אם חסר מידע במלאי
    if (!foundProduct || !foundProduct.description) {
      externalInfo = await getGoogleCseInfo(lastUserMsg);
    }

    let stockAlert = foundProduct ? (foundProduct.stock_quantity <= 0 ? `⚠️ חסר במלאי!` : foundProduct.stock_quantity < 10 ? `⚠️ רק ${foundProduct.stock_quantity} יחידות נותרו!` : "") : "";

    // 4. בניית ה-Context עם מסגרת לתמונה וסדרי עדיפויות
    const googleContext = externalInfo ? `
--- מידע חיצוני משלים ---
פרטים: ${externalInfo.snippet}
🖼️ מסגרת תמונת מוצר:
-----------------------
${externalInfo.image || "אין תמונה זמינה"}
-----------------------
קישור למידע נוסף: ${externalInfo.link}
` : "";

    // 5. ניהול בריכת מפתחות (Rotation)
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-flash-preview", "gemini-3.1-pro-preview"];
    let aiResponse = "";

    outerLoop: for (let i = 0; i < keys.length; i++) {
      if (activeKeysConfig?.find(k => k.instruction === `KEY_${i+1}`)?.is_active === false) continue;
      const genAI = new GoogleGenerativeAI(keys[i]);
      
      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
חוקי ה-DNA של ח. סבן (עדיפות עליונה):
${executorDNA}

מידע טכני משלים:
יועץ: ${advisorData?.reply || ""}
${googleContext}

הנחיה חשובה: התעלם מכל סגנון כתיבה חיצוני. ענה רק כנציג ח. סבן לפי ה-DNA.`
          });

          const result = await model.generateContent(lastUserMsg);
          aiResponse = result.response.text();
          if (aiResponse) {
            await Promise.all([updateDashboardQuota(i + 1, modelName, "SUCCESS"), logToDailyChat(lastUserMsg, user_id)]);
            break outerLoop;
          }
        } catch (e) {
          await updateDashboardQuota(i + 1, modelName, "QUOTA_EXCEEDED");
        }
      }
    }

    // 6. הזרקת לינקים ומשלוח ל-Pipeline
    if (foundProduct && aiResponse) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link) + (stockAlert ? `\n${stockAlert}` : "");
    }

    if (phone && aiResponse) {
      const cleanPhoneForPath = phone.replace('+', '').trim();
      await update(ref(rtdb, `saban94/pipeline/${cleanPhoneForPath}`), { text: aiResponse, timestamp: Date.now() });
    }

    return NextResponse.json({ text: aiResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
