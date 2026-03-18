import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Saban OS - Master Brain V42.3 DNA-Connected
 * -----------------------------------
 * - DNA Injection: שואב חוקים מ-ai_rules ומנחיות הבוס.
 * - Key Rotation: רוטציה בין מפתחות ב-POOL למניעת חסימות.
 * - Model Failover: Gemini 3.1 Pro -> 3.1 Flash-Lite.
 */

export const dynamic = 'force-dynamic';

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

    // 1. שליפת ה-DNA (חוקים) והמלאי מה-DB
    const [{ data: rules }, { data: inventory }] = await Promise.all([
      supabase.from('ai_rules').select('instruction').eq('is_active', true),
      supabase.from('inventory').select('product_name, sku, price, stock_quantity').limit(5)
    ]);

    const dnaInstructions = rules?.map(r => r.instruction).join("\n") || "אין חוקים פעילים.";
    const inventorySample = inventory?.map(i => `${i.product_name} (מק"ט: ${i.sku}) - מחיר: ${i.price}`).join(", ") || "";
    
    // 2. בניית ה-System Prompt לפי ה-DNA של סבן
    const systemPrompt = `
      אתה המוח המנהל של Saban OS. ראמי הוא הבוס.
      
      חוקי ה-DNA המחייבים שלך:
      ${dnaInstructions}
      
      מידע על המלאי הנוכחי (דגימה):
      ${inventorySample}
      
      הנחיות מענה:
      - השב בעברית מקצועית, תמציתית וישירה.
      - אם לקוח שואל על מחיר, בדוק במלאי המצורף.
      - תמיד סיים בחתימה: אנחנו כאן לרשותך תמיד ח.סבן חומרי בנין. 🦾
    `.trim();

    // 3. ניהול בריכת המפתחות (API Key Pool)
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 5);
    
    if (apiKeys.length === 0 && process.env.GOOGLE_AI_KEY) apiKeys.push(process.env.GOOGLE_AI_KEY);
    if (apiKeys.length === 0) throw new Error("No API keys found");

    let finalAnswer = "";
    let success = false;
    let lastError = "";

    // 4. רוטציה חכמה בין מודלים ומפתחות
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
            if (finalAnswer) { success = true; break; }
          } else {
            lastError = data.error?.message || "Unknown error";
            continue; // עובר למפתח הבא
          }
        } catch (e: any) {
          lastError = e.message;
          continue;
        }
      }
    }

    if (!success) throw new Error(`Rotation failed: ${lastError}`);

    // 5. שמירת השיחה להיסטוריה
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'web_chat', role: 'user', content: query, metadata: { phone: phone || 'unknown' } },
      { session_id: sessionId || 'web_chat', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ 
      reply: finalAnswer,
      success: true,
      stats: { version: "42.3_DNA", model: "Gemini 3.1" }
    });

  } catch (error: any) {
    console.error("🔥 DNA Brain Error:", error.message);
    return NextResponse.json({ reply: "ראמי, יש תקלה בחיבור ל-DNA. אני בודק את מפתחות ה-API. 🦾" }, { status: 200 });
  }
}
