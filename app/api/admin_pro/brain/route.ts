import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Master Controller Brain V38.0 (Gemini 3.1 Edition)
 * ------------------------------------------------------------------
 * Updated: March 16, 2026 - Leveraging the latest Google AI iterations.
 * Models: gemini-3.1-pro-preview (Master) | gemini-3.1-flash-lite-preview (Flash).
 * Rotation: 3-Key Pool Logic with status-aware failover.
 */

export const dynamic = 'force-dynamic';

const MODEL_POOL = [
  "gemini-3.1-pro-preview",       // הכי חכם (Released Feb 19, 2026)
  "gemini-3.1-flash-lite-preview" // הכי מהיר (Released March 3, 2026)
];

const RETRY_DELAYS = [1000, 2000, 4000];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const { sessionId, query, history, customerId } = body;

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. Fetching Full Operational Context
    const [rulesRes, profilesRes, inventoryRes] = await Promise.all([
      supabase.from('ai_rules').select('*').eq('is_active', true),
      supabase.from('vip_profiles').select('*'),
      supabase.from('inventory').select('product_name, sku').limit(50)
    ]);

    const activeDNA = rulesRes.data?.map(r => r.instruction).join("\n") || "";
    
    const systemPrompt = `
      אתה "המאסטר של Saban OS" - המוח המנהל והמנחה של חברת ח. סבן.
      המנהל והסמכות העליונה שלך הוא ראמי הבוס.

      ### תפקידך כמנטור:
      1. ניהול חוקי המערכת: אתה מזריק DNA לכל שאר המוחות (VIP וכללי).
      2. אם ראמי פוקד על שינוי התנהגות, עליך להחזיר פקודה: [UPDATE_RULE:NAME:CONTENT]
      3. אם ראמי מאשר הזמנה, הזרק לסל שלו: [QUICK_ADD:SKU]

      ### נתוני מערכת חיים:
      - חוקים פעילים: ${activeDNA}
      - לקוחות VIP: ${profilesRes.data?.length || 0}
      - מוצרים במלאי: ${inventoryRes.data?.length || 0}

      טון: Executive, חד, "מתמתני אומנותי", מקצועי וחברי.
      חתימה חובה:
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. Key Pool Logic (3 Keys)
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 5);
    
    if (apiKeys.length < 1) throw new Error("API Key Pool missing");

    let finalAnswer = "";
    let success = false;

    // Outer Loop: Models | Inner Loop: Keys
    for (const model of MODEL_POOL) {
      if (success) break;
      for (const apiKey of apiKeys) {
        if (success) break;

        for (const delay of RETRY_DELAYS) {
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
                  generationConfig: { temperature: 0.1, topP: 0.85, maxOutputTokens: 2048 }
                })
              }
            );

            if (response.ok) {
              const data = await response.json();
              finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (finalAnswer) { success = true; break; }
            } else if (response.status === 429) {
              break; // מפתח חסום - דלג למפתח הבא
            }
            await new Promise(r => setTimeout(r, delay));
          } catch (e) { continue; }
        }
      }
    }

    if (!success) throw new Error("Brain Exhausted - Key Rotation Failed");

    // 3. Automated DNA Injection Update
    const ruleMatch = finalAnswer.match(/\[UPDATE_RULE:(.*?):(.*?)\]/);
    if (ruleMatch) {
      const [_, ruleName, instruction] = ruleMatch;
      await supabase.from('ai_rules').upsert({
        rule_name: ruleName,
        instruction: instruction,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'rule_name' });
    }

    // 4. Persistence to Master History
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'admin_master', role: 'user', content: query },
      { session_id: sessionId || 'admin_master', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ answer: finalAnswer, ruleUpdated: !!ruleMatch });

  } catch (error: any) {
    console.error("Master Brain Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
