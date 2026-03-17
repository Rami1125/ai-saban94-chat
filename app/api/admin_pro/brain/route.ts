import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Master Brain V42.2 Elite (Updated Mar 17, 2026)
 * -----------------------------------
 * - Model Strategy: Gemini 3.1 Pro (Heavy Reasoning) -> 3.1 Flash-Lite (Speed).
 * - Multi-Key Rotation: Failover mechanism for API keys.
 * - DNA Context: Real-time injection of ai_rules and inventory.
 */

export const dynamic = 'force-dynamic';

// שימוש במודלים החדשים ביותר מהעדכון של מרץ 2026
const MODEL_POOL = [
  "gemini-3.1-pro-preview", 
  "gemini-3.1-flash-lite-preview"
];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || body.message || body.content;
    const { sessionId, history, phone } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. שליפת חוקי DNA ומלאי מעודכן
    const { data: rulesRes } = await supabase
      .from('ai_rules')
      .select('instruction')
      .eq('is_active', true);

    const activeRules = rulesRes?.map(r => r.instruction).join("\n") || "";
    
    const systemPrompt = `
      אתה המוח המנהל של Saban OS. ראמי הוא הבוס.
      חוקי ה-DNA הפעילים: ${activeRules}
      תפקידך: ניהול חוקי DNA, מלאי והזמנות VIP.
      חתימה חובה בסוף כל תשובה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. הכנת בריכת המפתחות (Rotation Pool)
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 5);
    
    if (apiKeys.length === 0) {
      if (process.env.GOOGLE_AI_KEY) apiKeys.push(process.env.GOOGLE_AI_KEY);
      else throw new Error("No API keys found in pool");
    }

    let finalAnswer = "";
    let success = false;
    let lastError = "";

    // 3. לוגיקת רוטציה כפולה (מודלים x מפתחות)
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
                  temperature: 0.2, 
                  topP: 0.95,
                  maxOutputTokens: 1024 
                }
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
            // דילוג חכם במידה והמפתח חסום או חרג מהמכסה החדשה (429/403)
            lastError = `Status ${response.status}: ${data.error?.message}`;
            continue; 
          }
        } catch (e: any) {
          lastError = e.message;
          continue; 
        }
      }
    }

    if (!success) throw new Error("All keys/models failed. Last: " + lastError);

    // 4. חיפוש מוצר להעשרה ויזואלית ב-UI
    const { data: products } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${query}%,sku.eq.${query}`)
      .limit(1);

    // 5. שמירה להיסטוריה והחזרת תשובה
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'admin_master', role: 'user', content: query, metadata: { phone: phone || '972508860896' } },
      { session_id: sessionId || 'admin_master', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ 
      reply: finalAnswer,
      product: products?.[0] || null,
      success: true,
      stats: { version: "42.2_MARCH_2026", model: success ? "Gemini 3.1 Active" : "Fallback" }
    });

  } catch (error: any) {
    console.error("Critical Brain Failure:", error.message);
    return NextResponse.json({ 
      reply: "ראמי, המוח עמוס כרגע. אני מחליף מפתח API ומנסה שוב. 🦾",
      error: error.message 
    }, { status: 200 });
  }
}
