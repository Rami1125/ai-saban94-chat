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

export default async function handler(req, res) {
    const { message } = req.body;
    const apiKeyPool = process.env.GOOGLE_AI_KEY_POOL || "";
    const keys = apiKeyPool.split(',').map(k => k.trim()).filter(k => k.length > 10);

    if (!message) return res.status(400).json({ error: "Missing message" });
    if (keys.length === 0) return res.status(500).json({ error: "API_KEY_POOL_MISSING" });

    const modelPool = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp"
    ];

    try {
        // 1. שליפה מקבילית של DNA ומלאי (שימוש ב-plain search לדיוק במידות)
        const [{ data: rules }, { data: inv }] = await Promise.all([
            supabase.from('system_rules')
                .select('instruction')
                .eq('agent_type', 'consultant')
                .eq('is_active', true),
            supabase.from('inventory')
                .select('*')
                .textSearch('product_name', message, { config: 'hebrew', type: 'plain' })
                .limit(1)
        ]);

        const foundProduct = inv?.[0] || null;
        let stockAlert = "";
        
        if (foundProduct) {
            const stock = foundProduct.stock_quantity || 0;
            stockAlert = stock <= 0 ? `⚠️ חסר במלאי!` : stock < 10 ? `⚠️ רק ${stock} יחידות נותרו!` : "זמין במלאי";
        }

        // 2. הכנת הקונטקסט עבור ה-AI (הזרקת ה-ID והשם המדויק)
        const productContext = foundProduct 
            ? `נתוני מוצר אמת מהמחסן: ${foundProduct.product_name} | מזהה קטלוגי: ${foundProduct.sku || foundProduct.id}`
            : "לא נמצא מוצר תואם בחיפוש ראשוני במלאי.";

        const consultantDNA = rules?.map(r => r.instruction).join("\n") || "";

        let aiResponse = "";

        // 3. לוגיקת רוטציה בין מפתחות ומודלים
        outerLoop: for (const key of keys) {
            const genAI = new GoogleGenerativeAI(key);

            for (const modelName of modelPool) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: `
                            ${consultantDNA}
                            
                            קונטקסט מוצר נוכחי:
                            ${productContext}
                            ${stockAlert}
                            
                            חוקי פורמט:
                            - ענה בקיצור נמרץ (מתכנת אומנותי).
                            - אם נמצא מוצר, חובה לסיים במחרוזת: MAGIC_URL
                            - חתימה: H.SABAN 1994
                        `
                    });

                    const result = await model.generateContent(message);
                    aiResponse = result.response.text();

                    if (aiResponse) break outerLoop;
                } catch (e) {
                    console.error(`Error with model ${modelName}:`, e.message);
                    continue;
                }
            }
        }

        // 4. הזרקת הלינק הסופי על בסיס ה-ID מה-Inventory
        if (foundProduct && aiResponse.includes("MAGIC_URL")) {
            const productId = foundProduct.sku || foundProduct.id;
            const finalLink = `https://sidor.vercel.app/product-pages/index.html?id=${productId}`;
            aiResponse = aiResponse.replace("MAGIC_URL", finalLink);
            
            // הוספת התראת מלאי בסוף אם קיימת
            if (stockAlert.includes("⚠️")) {
                aiResponse += `\n${stockAlert}`;
            }
        }

        return res.status(200).json({ reply: aiResponse });

    } catch (error) {
        console.error("Critical API Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

          const result = await model.generateContent(lastUserMsg);
          aiResponse = result.response.text();

          if (aiResponse) {
            // עדכון הדאשבורד בזמן אמת
            await Promise.all([
              updateDashboardQuota(i + 1, modelName, "SUCCESS"),
              logToDailyChat(lastUserMsg, user_id)
            ]);
            break outerLoop; 
          }
        } catch (e: any) {
          console.warn(`Key ${i+1} Model ${modelName} Quota Exceeded`);
          await updateDashboardQuota(i + 1, modelName, "QUOTA_EXCEEDED");
          continue;
        }
      }
    }

    // 6. הזרקת לינקים ומשלוח ל-Pipeline
    if (foundProduct) {
      const link = foundProduct.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${foundProduct.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", link) + (stockAlert ? `\n${stockAlert}` : "");
    }

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
