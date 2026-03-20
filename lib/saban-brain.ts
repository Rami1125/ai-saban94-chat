import { getSupabase } from "./supabase";

const DISCOVERY_MATRIX = [
  { name: "gemini-3.1-pro-preview", versions: ["v1beta"] },
  { name: "gemini-3.1-flash-preview", versions: ["v1beta"] },
  { name: "gemini-2.5-pro", versions: ["v1"] }
];

const getKeyPool = () => {
  const pool = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_POOL || "";
  return pool.split(",").map(key => key.trim()).filter(Boolean);
};

export const SabanBrain = {
  // פונקציית העל לשאילתות מורכבות
  ask: async (userPrompt: string) => {
    const supabase = getSupabase();
    const keys = getKeyPool();
    if (keys.length === 0) return "שגיאה: חסר מפתח API ב-Pool";

    // שליפת חוקים בזמן אמת
    const { data: rules } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true);
    const systemRules = rules?.map(r => `- ${r.rule_name}: ${r.rule_description}`).join("\n") || "";

    const finalPrompt = `
      אתה המוח התפעולי של ח.סבן. 
      הנחיות עבודה (ספר חוקים):
      ${systemRules}
      
      משימה נוכחית: ${userPrompt}
      ענה בצורה מקצועית, תמציתית ובשפה של מנהל עבודה (אח/שותף).
    `;

    for (const key of keys) {
      for (const model of DISCOVERY_MATRIX) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/${model.versions[0]}/models/${model.name}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
          });
          const data = await response.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const aiText = data.candidates[0].content.parts[0].text;
            // תיעוד היסטורי
            await supabase.from('saban_brain_history').insert([{ user_query: userPrompt, ai_response: aiText, model_used: model.name }]);
            return aiText;
          }
        } catch (e) { continue; }
      }
    }
    return "אח שלי, יש עומס על המערכת. נסה שוב בעוד רגע.";
  }
};
