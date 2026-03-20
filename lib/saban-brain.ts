// lib/saban-brain.ts
import { getSupabase } from "./supabase";

/**
 * מטריצת המודלים המעודכנת למרץ 2026
 * מסודרת לפי יציבות ויכולות הסקת מסקנות (Inference)
 */
const DISCOVERY_MATRIX = [
  { name: "gemini-3.1-pro-preview", versions: ["v1beta"] },    // הכי חכם (יצא פברואר 2026)
  { name: "gemini-3.1-flash-preview", versions: ["v1beta"] },  // הכי מהיר
  { name: "gemini-3-flash-preview", versions: ["v1beta"] },    // יציב מאוד
  { name: "gemini-2.5-pro", versions: ["v1"] },                // מודל עבודה יציב (Stable)
  { name: "gemini-2.5-flash", versions: ["v1"] },              // גיבוי מהיר
  { name: "gemini-1.5-pro", versions: ["v1"] }                 // הגיבוי האחרון בהחלט
];

const getKeyPool = () => {
  const pool = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_POOL || "";
  return pool.split(",").map(key => key.trim()).filter(Boolean);
};

export const SabanBrain = {
  /**
   * מנוע השאילתות עם רוטציה כפולה:
   * 1. עובר על כל המפתחות ב-Pool
   * 2. לכל מפתח מנסה את המודלים לפי סדר המטריצה
   */
  ask: async (userPrompt: string) => {
    const supabase = getSupabase();
    const keys = getKeyPool();
    
    if (keys.length === 0) return "אח שלי, חסר מפתח API ב-Pool.";

    // שליפת חוקים בזמן אמת מה-DB
    const { data: rules } = await supabase
        .from('saban_brain_rules')
        .select('rule_description')
        .eq('is_active', true);
    
    const systemRules = rules?.map(r => r.rule_description).join("\n") || "פעל כמנהל לוגיסטי מקצועי.";

    const finalPrompt = `
      אתה המוח של סידור ח.סבן. 
      חוקי עבודה מחייבים:
      ${systemRules}
      
      משימה/שאלה: ${userPrompt}
    `;

    // תחילת רוטציה
    for (const key of keys) {
      for (const modelInfo of DISCOVERY_MATRIX) {
        for (const version of modelInfo.versions) {
          try {
            const url = `https://generativelanguage.googleapis.com/${version}/models/${modelInfo.name}:generateContent?key=${key}`;
            
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }]
              })
            });

            if (!response.ok) throw new Error(`Status: ${response.status}`);

            const data = await response.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const aiText = data.candidates[0].content.parts[0].text;

              // תיעוד היסטורי ב-DB (אופציונלי)
              await supabase.from('saban_brain_history').insert([{
                user_query: userPrompt,
                ai_response: aiText,
                model_used: modelInfo.name,
                status: 'success'
              }]);

              return aiText;
            }
          } catch (err) {
            console.warn(`נכשלה קריאה ל-${modelInfo.name} (${version}) עם מפתח מסוים, מנסה את הבא...`);
            continue; // נכשל? עבור למודל/גרסה/מפתח הבא
          }
        }
      }
    }

    return "ראמי אחי, כל המודלים והמפתחות עמוסים כרגע. נסה שוב בעוד כמה שניות.";
  },

  // פונקציית ניתוח לוגיסטי מהירה ללוח מחוונים
  analyzeLogistics: async () => {
     // משתמש בפונקציית ask עם פרומפט מובנה
     return await SabanBrain.ask("בצע ניתוח מהיר של הסידור הקיים ותן 3 תובנות קצרות.");
  }
};

export const SabanBrainPro = SabanBrain;
