import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Master Brain V42.0
 * -----------------------------------
 * - Professional Skip: Detects 403, 401, 429 and immediately rotates to the next key.
 * - Multi-Model Resilience: Tries Gemini 3.1 Pro, then Flash-Lite.
 * - Full DNA Integration: Aware of inventory specs and rules.
 */

export const dynamic = 'force-dynamic';

const MODEL_POOL = ["gemini-3.1-pro-preview", "gemini-3.1-flash-lite-preview"];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const { sessionId, query, history, customerId } = body;

    if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

    // 1. Context Acquisition
    const [rulesRes, inventoryRes] = await Promise.all([
      supabase.from('ai_rules').select('*').eq('is_active', true),
      supabase.from('inventory').select('*').limit(10)
    ]);

    const activeRules = rulesRes.data?.map(r => r.instruction).join("\n") || "";
    
    const systemPrompt = `
      אתה המוח המנהל של Saban OS. ראמי הוא הבוס.
      תפקידך: ניהול חוקי DNA, מלאי והזמנות VIP.
      מפרט נוכחי: ${activeRules}
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. Key Pool Processing
    const rawKeys = process.env.GOOGLE_AI_KEY_POOL || "";
    const apiKeys = rawKeys.split(",").map(k => k.trim()).filter(k => k.length > 5);
    
    if (apiKeys.length === 0) throw new Error("No API keys found in pool");

    let finalAnswer = "";
    let success = false;
    let lastError = "";

    // 3. Dual-Layer Rotation Logic (Models x Keys)
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
                generationConfig: { 
                  temperature: 0.15,
                  topP: 0.95,
                  maxOutputTokens: 2048 
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (finalAnswer) {
              success = true;
              break;
            }
          } else {
            const errorData = await response.json();
            const status = response.status;
            lastError = `Status ${status}: ${errorData.error?.message || 'Unknown error'}`;

            // אם המפתח "מלשין" (403/401) או נגמרה המכסה (429) - דלג מיד למפתח הבא
            if ([401, 403, 429].includes(status)) {
              console.warn(`Skipping key due to ${status}.`);
              continue;
            }
          }
        } catch (e: any) {
          lastError = e.message;
          continue; // שגיאת רשת - נסה מפתח הבא
        }
      }
    }

    if (!success) {
      throw new Error(`כל המפתחות ברוטציה נכשלו. שגיאה אחרונה: ${lastError}`);
    }

    // 4. Record to history
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'admin_master', role: 'user', content: query },
      { session_id: sessionId || 'admin_master', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ 
      answer: finalAnswer, 
      success: true,
      stats: { rotated: true, status: "stable" }
    });

  } catch (error: any) {
    console.error("Master Brain Critical Failure:", error.message);
    return NextResponse.json({ 
      error: "תקלה ברוטציית המפתחות", 
      details: error.message 
    }, { status: 500 });
  }
}
