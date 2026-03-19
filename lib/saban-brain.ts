import { getSupabase } from "./supabase";

const API_KEYS = [
  process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_1,
  process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_2,
  process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_3
];

const MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
];

export const SabanBrainPro = {
  // פונקציית רוטציה וביצוע שאילתה
  async ask(userPrompt: string, context: any = {}) {
    const supabase = getSupabase();
    
    // 1. שליפת ספר החוקים און-ליין
    const { data: rules } = await supabase
      .from('saban_brain_rules')
      .select('rule_description')
      .eq('is_active', true);
    
    const systemRules = rules?.map(r => r.rule_description).join("\n") || "פעל לפי היגיון לוגיסטי.";

    // 2. הכנת הפרומפט המלא
    const finalPrompt = `
      אתה המוח של סידור ח.סבן.
      חוקי העסק:
      ${systemRules}
      
      הקשר נוכחי:
      ${JSON.stringify(context)}
      
      שאלה/פקודה: ${userPrompt}
    `;

    // 3. ניסיון ביצוע עם רוטציה (Keys & Models)
    for (const key of API_KEYS) {
      if (!key) continue;
      for (const model of MODELS) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: finalPrompt }] }]
            })
          });

          const data = await response.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const aiText = data.candidates[0].content.parts[0].text;
            
            // 4. תיעוד היסטורי ב-DB
            await supabase.from('saban_brain_history').insert([{
              user_query: userPrompt,
              ai_response: aiText,
              model_used: model,
              status: 'success'
            }]);

            return aiText;
          }
        } catch (err) {
          console.warn(`Model ${model} failed with key... trying next.`);
          continue; 
        }
      }
    }
    return "אח שלי, המוח עמוס כרגע. אני מנסה להתחבר שוב...";
  }
};
