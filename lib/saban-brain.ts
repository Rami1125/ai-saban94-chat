import { getSupabase } from "./supabase";

// שליפת הפול ופירוקו למערך
const getKeyPool = () => {
  const pool = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_POOL || "";
  return pool.split(",").map(key => key.trim()).filter(Boolean);
};

const MODELS = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

export const SabanBrain = {
  // פונקציה לניתוח לוגיסטי מהיר (עבור ai-control)
  analyzeLogistics: async () => {
    const supabase = getSupabase();
    try {
      const { data: rules } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true);
      const { data: requests } = await supabase.from('saban_requests').select('*').eq('status', 'pending');
      
      const urgentCount = requests?.filter(r => r.notes?.includes('דחוף') || r.is_urgent).length || 0;
      
      return {
        recommendation: urgentCount > 0 
          ? `זיהיתי ${urgentCount} בקשות דחופות. כדאי לשבץ את עלי למסלול מהיר כפי שמוגדר בספר החוקים.` 
          : "הסידור מאוזן כרגע. המוח לא מזהה חריגות בלוח השעות.",
        priority: urgentCount > 0 ? 'high' : 'medium',
        actionable_items: requests?.slice(0, 3).map(r => `טיפול ב: ${r.customer_name} (#${r.doc_number})`) || []
      };
    } catch (e) {
      return { recommendation: "מתחבר לנתונים...", priority: 'low', actionable_items: [] };
    }
  },

  // פונקציית הצ'אט המלאה עם רוטציית Pool
  ask: async (userPrompt: string) => {
    const supabase = getSupabase();
    const keys = getKeyPool();
    
    if (keys.length === 0) return "אח שלי, חסר מפתח API ב-Pool. בדוק את ההגדרות ב-Vercel.";

    const { data: rules } = await supabase.from('saban_brain_rules').select('rule_description').eq('is_active', true);
    const systemRules = rules?.map(r => r.rule_description).join("\n") || "פעל לפי היגיון לוגיסטי מקצועי.";

    const finalPrompt = `אתה המוח של סידור ח.סבן. פעל אך ורק לפי החוקים הבאים:
    ${systemRules}
    
    שאלה/פקודה מהצוות: ${userPrompt}`;

    // רוטציה על פני המפתחות והמודלים
    for (const key of keys) {
      for (const model of MODELS) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
          });
          
          const data = await response.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const aiText = data.candidates[0].content.parts[0].text;
            
            // תיעוד היסטורי
            await supabase.from('saban_brain_history').insert([{
              user_query: userPrompt,
              ai_response: aiText,
              model_used: model,
              status: 'success'
            }]);

            return aiText;
          }
        } catch (err) {
          console.warn(`Key or Model ${model} failed, skipping to next...`);
          continue; 
        }
      }
    }
    return "אח שלי, כל המפתחות ב-Pool נכשלו או שאין תקשורת. נסה שוב בעוד רגע.";
  }
};

export const SabanBrainPro = SabanBrain;
