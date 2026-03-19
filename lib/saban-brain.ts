// lib/saban-brain.ts
import { getSupabase } from "./supabase";

const API_KEYS = [
  process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_1,
  process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_2,
  process.env.NEXT_PUBLIC_GOOGLE_AI_KEY_3
].filter(Boolean);

const MODELS = ["gemini-1.5-pro", "gemini-1.5-flash"];

export const SabanBrain = {
  // פונקציה לניתוח לוגיסטי מהיר (עבור ai-control)
  analyzeLogistics: async () => {
    const supabase = getSupabase();
    try {
      const { data: rules } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true);
      const { data: requests } = await supabase.from('saban_requests').select('*').eq('status', 'pending');
      
      const urgentCount = requests?.filter(r => r.notes?.includes('דחוף')).length || 0;
      
      return {
        recommendation: urgentCount > 0 
          ? `זיהיתי ${urgentCount} בקשות דחופות. כדאי לשבץ את עלי למסלול מהיר.` 
          : "הסידור מאוזן. זמן טוב לביצוע העברות בין סניפים.",
        priority: urgentCount > 0 ? 'high' : 'medium',
        actionable_items: requests?.slice(0, 3).map(r => `אישור: ${r.customer_name} (#${r.doc_number})`) || []
      };
    } catch (e) {
      return { recommendation: "טוען נתונים...", priority: 'low', actionable_items: [] };
    }
  },

  // פונקציית צ'אט מלאה (עבור whatsapp_bot)
  ask: async (userPrompt: string) => {
    const supabase = getSupabase();
    const { data: rules } = await supabase.from('saban_brain_rules').select('rule_description').eq('is_active', true);
    const systemRules = rules?.map(r => r.rule_description).join("\n") || "פעל לפי היגיון לוגיסטי.";

    const finalPrompt = `אתה המוח של סידור ח.סבן. חוקים: ${systemRules}\nשאלה: ${userPrompt}`;

    for (const key of API_KEYS) {
      for (const model of MODELS) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
          });
          const data = await response.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
          }
        } catch (err) { continue; }
      }
    }
    return "אח שלי, המוח עמוס כרגע. נסה שוב בעוד דקה.";
  }
};

// ייצוא נוסף בשם SabanBrainPro כדי למנוע שגיאות ב-whatsapp_bot
export const SabanBrainPro = SabanBrain;
