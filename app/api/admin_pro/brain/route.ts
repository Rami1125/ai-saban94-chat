import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // שימוש ב-Instance הקיים שלך

/**
 * Saban Admin Pro - Master Brain V42.1 (Enhanced for UI)
 * -----------------------------------
 * - Smart Skip: Detects 403, 401, and 429.
 * - Dual-Model Resilience: Gemini 3.1 Pro -> Flash-Lite.
 * - UI Bridge: Map 'query' to 'message' for frontend compatibility.
 */

export const dynamic = 'force-dynamic';

const MODEL_POOL = ["gemini-1.5-pro", "gemini-1.5-flash"]; // עדכון שמות מודלים סטנדרטיים

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // נירמול קלט - ה-UI שולח 'message', המוח מצפה ל-'query'
    const query = body.query || body.message || body.content;
    const { sessionId, history, phone } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. שליפת קונטקסט DNA וחוקים מה-DB
    const { data: rulesRes } = await supabase
      .from('ai_rules')
      .select('instruction')
      .eq('is_active', true);

    const activeRules = rulesRes?.map(r => r.instruction).join("\n") || "";
    
    const systemPrompt = `
      אתה המוח המנהל של Saban OS. ראמי הוא הבוס.
      חוקי ה-DNA הפעילים:
      ${activeRules}
      תפקידך: ניהול חוקי DNA, מלאי והזמנות VIP.
      חתימה חובה בסוף כל תשובה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. עיבוד בריכת המפתחות (POOL)
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 5);
    
    if (apiKeys.length === 0) {
      // Fallback למפתח בודד אם ה-Pool לא מוגדר
      if (process.env.GOOGLE_AI_KEY) apiKeys.push(process.env.GOOGLE_AI_KEY);
      else throw new Error("No API keys found in GOOGLE_AI_KEY_POOL");
    }

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
            const status = response.status;
            lastError = `Status ${status}: ${data.error?.message}`;
            if ([401, 403, 429].includes(status)) continue; 
            continue;
          }
        } catch (e: any) {
          lastError = e.message;
          continue; 
        }
      }
    }

    if (!success) throw new Error(lastError);

    // 4. תיעוד להיסטוריה ב-Supabase
    await supabase.from('chat_history').insert([
      { 
        session_id: sessionId || 'admin_master', 
        role: 'user', 
        content: query,
        metadata: { phone: phone || 'unknown' } 
      },
      { 
        session_id: sessionId || 'admin_master', 
        role: 'assistant', 
        content: finalAnswer 
      }
    ]);

    // 5. החזרת תשובה בפורמט שה-UI מצפה לו (reply + stats)
    return NextResponse.json({ 
      answer: finalAnswer,
      reply: finalAnswer, // תאימות ל-SabanChatPage
      success: true,
      stats: { rotated: true, status: "V42.1_ACTIVE" }
    });

  } catch (error: any) {
    console.error("Critical Brain Failure:", error.message);
    return NextResponse.json({ 
      error: "תקלה ברוטציה", 
      reply: "ראמי, יש תקלה במפתחות ה-AI. אני בודק את זה.",
      details: error.message 
    }, { status: 200 }); // מחזירים 200 כדי שהצ'אט יציג את הודעת השגיאה בבועה
  }
}
