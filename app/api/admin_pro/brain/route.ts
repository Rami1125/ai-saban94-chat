import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban Admin Pro - Master Controller Brain V36.0
 * ----------------------------------------------
 * - Strategy: Bulletproof Key Rotation & Model Fallback.
 * - Models: Gemini 2.5 Flash (Performance) & Gemini 2.5 Pro (Deep Logic).
 * - Context: Dynamic DNA Rule Injection.
 */

export const dynamic = 'force-dynamic';

const MODEL_POOL = [
  "gemini-2.5-flash-preview-09-2025", 
  "gemini-2.5-pro-preview-09-2025"
];

const RETRY_DELAYS = [1000, 2000];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    
    // הגנה על קריאת ה-Body
    const body = await req.json().catch(() => ({}));
    const { sessionId, query, history, customerId } = body;

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת קונטקסט מערכת (DNA, VIP, מלאי)
    const [rulesRes, profilesRes, inventoryRes] = await Promise.all([
      supabase.from('ai_rules').select('*').eq('is_active', true),
      supabase.from('vip_profiles').select('*'),
      supabase.from('inventory').select('product_name, sku').limit(40)
    ]);

    const activeDNA = rulesRes.data?.map(r => r.instruction).join("\n") || "";

    const systemPrompt = `
      אתה "המוח המאסטר של Saban OS" - השותף המבצע הבכיר של ראמי.
      תפקידך: ניהול כלל המערכת דרך הזרקת חוקים ל-DNA.

      ### מצב מערכת נוכחי:
      - חוקים פעילים: ${activeDNA}
      - לקוחות VIP במערכת: ${profilesRes.data?.length || 0}
      - מוצרים זמינים במלאי: ${inventoryRes.data?.length || 0}

      ### פקודות ניהול (מוסתרות):
      1. עדכון חוק: [UPDATE_RULE:NAME:CONTENT]
      2. הוספה לסל: [QUICK_ADD:SKU]

      ### הנחיות טון:
      Executive, חברי (ראמי הבוס), ישיר ומדויק.

      חתימה חובה:
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. 🦾
    `.trim();

    // 2. לוגיקת רוטציית מפתחות משופרת
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 5);
    
    if (apiKeys.length === 0) {
        throw new Error("GOOGLE_AI_KEY_POOL is empty or not configured");
    }

    let finalAnswer = "";
    let success = false;

    // לופ כפול: עוברים על מודלים ואז על מפתחות
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
                  generationConfig: { temperature: 0.15, topP: 0.8 }
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
            } else if (response.status === 429) {
              // מכסה נגמרה למפתח זה - דלג למפתח הבא מיד
              break; 
            }
            
            // המתנה קלה לפני ניסיון חוזר עם אותו מפתח
            await new Promise(r => setTimeout(r, delay));
          } catch (e) {
            continue; // שגיאת רשת - נסה מפתח/מודל הבא
          }
        }
      }
    }

    if (!success) throw new Error("All models and keys exhausted - Brain Down");

    // 3. הזרקת חוקים אוטומטית ל-DB במידה וזוהתה פקודה
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

    // 4. תיעוד בהיסטוריה
    await supabase.from('chat_history').insert([
      { session_id: sessionId || 'admin_master', role: 'user', content: query },
      { session_id: sessionId || 'admin_master', role: 'assistant', content: finalAnswer }
    ]);

    return NextResponse.json({ 
        answer: finalAnswer, 
        ruleInjected: !!ruleMatch,
        modelUsed: success 
    });

  } catch (error: any) {
    console.error("Master Brain Critical Failure:", error.message);
    return NextResponse.json({ 
      error: "תקלה במוח המאסטר", 
      details: error.message 
    }, { status: 500 });
  }
}
