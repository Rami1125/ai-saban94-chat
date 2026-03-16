import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Master Brain V42.1
 * -----------------------------------
 * - Smart Skip: Detects 403 (API disabled), 401 (Invalid), and 429 (Quota).
 * - Automatic Quarantine: Moves to the next key in the pool without returning 500.
 * - Dual-Model Resilience: Gemini 3.1 Pro -> Flash-Lite.
 */

export const dynamic = 'force-dynamic';

const MODEL_POOL = ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite-preview"];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const { sessionId, query, history, customerId } = body;

    if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

    // 1. שליפת קונטקסט DNA
    const [rulesRes, inventoryRes] = await Promise.all([
      supabase.from('ai_rules').select('*').eq('is_active', true),
      supabase.from('inventory').select('*').limit(10)
    ]);

    const activeRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";
    
    const systemPrompt = `
      אתה המוח המנהל של Saban OS. ראמי הוא הבוס.
      תפקידך: ניהול חוקי DNA והזמנות VIP.
      חתימה חובה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. עיבוד בריכת המפתחות
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 5);
    
    if (apiKeys.length === 0) throw new Error("No API keys found in GOOGLE_AI_KEY_POOL");

    let finalAnswer = "";
    let success = false;
    let lastError = "";

    // 3. לוגיקת רוטציה כפולה עם דילוג חכם (Failover)
    for (const model of MODEL_POOL) {
      if (success) break;

      for (const apiKey of apiKeys) {
        if (success) break;

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ 
                  role: "user", 
                  parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] 
                }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.15, topP: 0.95 }
              })
            }
          );

          const data = await response.json();

          if (response.ok) {
            finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (finalAnswer) {
              success = true;
              break;
            }
          } else {
            // זיהוי שגיאות שדורשות דילוג מיידי על המפתח
            const status = response.status;
            lastError = `Key ${apiKey.slice(-4)} failed with ${status}: ${data.error?.message}`;

            if ([401, 403, 429].includes(status)) {
              console.warn(`[Saban Brain] Skipping key due to status ${status}`);
              continue; // עובר למפתח הבא ברשימה
            }
            
            // שגיאות שרת כלליות (500/503) - נסה שוב או דלג
            continue;
          }
        } catch (e: any) {
          lastError = e.message;
          continue; 
        }
      }
    }

    if (!success) {
      throw new Error(`כל המפתחות נכשלו. שגיאה אחרונה: ${lastError}`);
    }

    // 4. תיעוד להיסטוריה
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'admin_master', role: 'user', content: query },
      { session_id: sessionId || 'admin_master', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ 
      answer: finalAnswer, 
      success: true,
      stats: { model_used: "gemini-3.1", rotated: true }
    });

  } catch (error: any) {
    console.error("Critical Brain Failure:", error.message);
    return NextResponse.json({ 
      error: "תקלה ברוטציה", 
      details: error.message 
    }, { status: 500 });
  }
}
