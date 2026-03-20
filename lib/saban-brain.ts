// lib/saban-brain.ts
import { getSupabase } from "./supabase";

const DISCOVERY_MATRIX = [
  { name: "gemini-3.1-pro-preview", versions: ["v1beta"] },
  { name: "gemini-3.1-flash-preview", versions: ["v1beta"] },
  { name: "gemini-1.5-pro", versions: ["v1"] }
];

const getKeyPool = () => {
  const pool = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_POOL || "";
  return pool.split(",").map(key => key.trim()).filter(Boolean);
};

export const SabanBrain = {
  ask: async (userPrompt: string) => {
    const supabase = getSupabase();
    const keys = getKeyPool();
    
    if (keys.length === 0) return "❌ אחי, אין מפתחות ב-Pool. המוח כבוי.";

    const { data: rules } = await supabase.from('saban_brain_rules').select('rule_description').eq('is_active', true);
    const systemRules = rules?.map(r => r.rule_description).join("\n") || "פעל כמנהל סידור.";

    const finalPrompt = `חוקי סבן: ${systemRules}\nשאלה: ${userPrompt}`;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const keySnippet = key.substring(0, 6) + "..."; // מזהה קצר למלשינון

      for (const modelInfo of DISCOVERY_MATRIX) {
        try {
          const url = `https://generativelanguage.googleapis.com/${modelInfo.versions[0]}/models/${modelInfo.name}:generateContent?key=${key}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
          });

          if (!response.ok) {
            const errorData = await response.json();
            const reason = errorData.error?.status || "UNKNOWN_ERROR";
            
            // --- המלשינון בפעולה ---
            console.error(`🚨 כשל במפתח [${i+1}]: ${keySnippet} | מודל: ${modelInfo.name} | סיבה: ${reason}`);
            
            // תיעוד הכשל בטבלה לביקורת שלך
            await supabase.from('saban_brain_history').insert([{
              user_query: "SYSTEM_CHECK",
              ai_response: `FAILED: ${reason}`,
              model_used: modelInfo.name,
              status: `error_key_${i+1}`
            }]);

            if (reason === "RESOURCE_EXHAUSTED") continue; // נגמרה המכסה? עבור למפתח הבא
            if (reason === "API_KEY_INVALID") continue;   // מפתח מת? עבור למפתח הבא
            throw new Error(reason);
          }

          const data = await response.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
          }

        } catch (err) {
          continue; // ניסיון מודל/מפתח הבא
        }
      }
    }
    return "🚨 כל המפתחות ב-Pool נכשלו. המלשינון תיעד את התקלות ב-DB.";
  }
};
