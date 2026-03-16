import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Master Executive Brain V38.0
 * ----------------------------------------------
 * Logic: Gemini 3.1 stable (March 2026) with Key Rotation.
 * Task: System DNA Mentor & Order Injection.
 */

export const dynamic = 'force-dynamic';

const MODEL_POOL = [
  "gemini-3.1-pro-preview", 
  "gemini-3.1-flash-lite-preview"
];

const RETRY_DELAYS = [1000, 2000, 4000];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const { sessionId, query, history, customerId } = body;

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. Fetch System DNA and Context
    const [rulesRes, profilesRes, weightsRes] = await Promise.all([
      supabase.from('ai_rules').select('*').eq('is_active', true),
      supabase.from('vip_profiles').select('*'),
      supabase.from('product_weights').select('*')
    ]);

    const activeDNA = rulesRes.data?.map(r => r.instruction).join("\n") || "";

    const systemPrompt = `
      אתה "המאסטר של Saban OS" - המוח המנהל והמנחה של חברת ח. סבן.
      המנהל והסמכות העליונה שלך הוא ראמי הבוס.

      ### תפקידך כמנטור:
      1. ניהול חוקי המערכת: הזרק DNA לכל שאר המוחות. פקודה: [UPDATE_RULE:NAME:CONTENT]
      2. ניהול הזמנות: הזרק מוצרים לסל הפקודה. פקודה: [QUICK_ADD:SKU]

      ### נתונים חיים:
      - DNA נוכחי: ${activeDNA}
      - לקוחות VIP מחוברים: ${profilesRes.data?.length || 0}
      
      טון: Executive, חד, מדויק, חברי.
      חתימה: ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. Key Rotation & Execution
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 5);
    let finalAnswer = "";
    let success = false;

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
                  contents: [{ role: "user", parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] }],
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  generationConfig: { temperature: 0.1, topP: 0.85 }
                })
              }
            );

            if (response.ok) {
              const data = await response.json();
              finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (finalAnswer) { success = true; break; }
            } else if (response.status === 429) break;

            await new Promise(r => setTimeout(r, delay));
          } catch (e) { continue; }
        }
      }
    }

    if (!success) throw new Error("Key Rotation Exhausted");

    // 3. DNA Update Injection
    const ruleMatch = finalAnswer.match(/\[UPDATE_RULE:(.*?):(.*?)\]/);
    if (ruleMatch) {
      const [_, ruleName, instruction] = ruleMatch;
      await supabase.from('ai_rules').upsert({
        rule_name: ruleName,
        instruction: instruction,
        is_active: true
      }, { onConflict: 'rule_name' });
    }

    return NextResponse.json({ answer: finalAnswer, success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
