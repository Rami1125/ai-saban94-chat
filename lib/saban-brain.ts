import { getSupabase } from "./supabase";

// מטריצת מודלים מעודכנת למרץ 2026
const DISCOVERY_MATRIX = [
  { name: "gemini-2.0-flash-lite", versions: ["v1beta"] },
  { name: "gemini-1.5-flash-002", versions: ["v1beta"] },
  { name: "gemini-3-flash-preview", versions: ["v1beta"] },
  { name: "gemini-2.5-pro", versions: ["v1"] },
  { name: "gemini-2.5-flash", versions: ["v1"] }
];

const getKeyPool = () => {
  if (typeof process === 'undefined') return [];
  const pool = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_POOL || "";
  return pool.split(",").map(key => key.trim()).filter(Boolean);
};

export const SabanBrain = {
  ask: async (userPrompt: string) => {
    const supabase = getSupabase();
    const keys = getKeyPool();
    if (keys.length === 0) return "שגיאה: חסר מפתח API ב-Pool. אנא הגדר NEXT_PUBLIC_GOOGLE_AI_KEY_POOL ב-Vercel.";

    try {
      // שליפת חוקים און-ליין
      const { data: rules } = await supabase.from('saban_brain_rules').select('rule_description').eq('is_active', true);
      const systemRules = rules?.map(r => r.rule_description).join("\n") || "פעל לפי היגיון לוגיסטי.";

      const finalPrompt = `אתה המוח של סידור ח.סבן. חוקי עבודה: ${systemRules}\nשאלה: ${userPrompt}`;

      // רוטציה משולשת (מפתחות -> מודלים -> גרסאות)
      for (const key of keys) {
        for (const modelInfo of DISCOVERY_MATRIX) {
          for (const version of modelInfo.versions) {
            try {
              const response = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${modelInfo.name}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
              });

              if (!response.ok) continue;

              const data = await response.json();
              if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const aiText = data.candidates[0].content.parts[0].text;
                
                // תיעוד שיחה לשימוש חוזר
                await supabase.from('saban_brain_history').insert([{
                  user_query: userPrompt,
                  ai_response: aiText,
                  model_used: modelInfo.name,
                  status: 'success'
                }]);
                
                return aiText;
              }
            } catch (e) { continue; }
          }
        }
      }
    } catch (err) {
      console.error("Brain System Error:", err);
    }
    return "אח שלי, המוח עמוס כרגע. נסה שוב בעוד רגע.";
  },

  analyzeLogistics: async () => {
    return await SabanBrain.ask("בצע ניתוח מהיר של הסידור ותן תובנה אחת קריטית.");
  }
};

export const SabanBrainPro = SabanBrain;
