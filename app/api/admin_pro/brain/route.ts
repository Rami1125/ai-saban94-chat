import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Master Controller Brain V35.0
 * ----------------------------------------------
 * Role: The Mentor Brain. Manages system DNA via Rule Injection.
 * Logic: Cycles through GOOGLE_AI_KEY_POOL, updates ai_rules table.
 * Model: gemini-2.5-flash-preview-09-2025 (Stable March 2026).
 */

export const dynamic = 'force-dynamic';

const RETRY_DELAYS = [1000, 2000, 4000];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { sessionId, query, history, customerId } = body;

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. Context Acquisition (DNA, VIP Profiles, Inventory)
    const [rulesRes, profilesRes, inventoryRes] = await Promise.all([
      supabase.from('ai_rules').select('*').eq('is_active', true),
      supabase.from('vip_profiles').select('*'),
      supabase.from('inventory').select('product_name, sku').limit(30)
    ]);

    const activeDNA = rulesRes.data?.map(r => r.instruction).join("\n") || "";

    const systemPrompt = `
      אתה "המוח המאסטר של Saban OS" - השותף המבצע הבכיר של ראמי.
      תפקידך: לנהל את כל המוחות במערכת (VIP וכללי) דרך עדכון ספר החוקים.

      ### מצב המערכת כרגע:
      - חוקי DNA פעילים: ${activeDNA}
      - לקוחות VIP מחוברים: ${profilesRes.data?.length || 0}
      - מוצרים זמינים במלאי: ${inventoryRes.data?.length || 0}

      ### יכולת מיוחדת - הזרקת DNA (Rule Injection):
      אם ראמי מבקש לשנות חוק, להוסיף הנחיה או לעדכן התנהגות:
      חובה להחזיר פקודה מוסתרת בפורמט: [UPDATE_RULE:NAME:CONTENT]
      המערכת תזהה את זה ותעדכן את ה-Database מיידית.

      ### הנחיות ביצוע:
      1. השתמש ב-[QUICK_ADD:SKU] להוספת מוצר לסל של ראמי.
      2. הטון: Executive, חברי (ראמי הבוס), חד ומקצועי.
      3. מנע כפילויות וחריגות 12 טון בזמן אמת.

      חתימה חובה:
      ראמי, המוח המרכזי מסונכרן. מחכה לפקודה. 🦾
    `.trim();

    // 2. Key Rotation & API Execution
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 5);
    if (apiKeys.length === 0) throw new Error("API Key Pool Exhausted");

    let finalAnswer = "";
    let success = false;

    for (const apiKey of apiKeys) {
      if (success) break;
      for (const delay of RETRY_DELAYS) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `היסטוריה: ${JSON.stringify(history || [])}\nשאילתה: ${query}` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            finalAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (finalAnswer) { success = true; break; }
          }
          await new Promise(r => setTimeout(r, delay));
        } catch (e) { continue; }
      }
    }

    if (!success) throw new Error("Brain Communication Failure");

    // 3. Automated Rule Injection Handling
    const ruleMatch = finalAnswer.match(/\[UPDATE_RULE:(.*?):(.*?)\]/);
    if (ruleMatch) {
      const [_, ruleName, instruction] = ruleMatch;
      await supabase.from('ai_rules').upsert({
        rule_name: ruleName,
        instruction: instruction,
        is_active: true
      }, { onConflict: 'rule_name' });
    }

    // 4. Persistence
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'admin_master', role: 'user', content: query },
      { session_id: sessionId || 'admin_master', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ answer: finalAnswer, ruleInjected: !!ruleMatch });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
