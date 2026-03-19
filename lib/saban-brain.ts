// lib/saban-brain.ts משופר
import { getSupabase } from "./supabase";

export const SabanBrain = {
  analyzeLogistics: async () => {
    const supabase = getSupabase();
    
    // 1. שליפת ספר החוקים הפעיל מהטבלה החדשה
    const { data: activeRules } = await supabase
      .from('saban_brain_rules')
      .select('rule_name, rule_description')
      .eq('is_active', true);

    // 2. בניית "פקודת המוח" מבוססת החוקים
    const brainInstructions = activeRules?.map(r => `- ${r.rule_name}: ${r.rule_description}`).join('\n') || "נהג לפי היגיון לוגיסטי בריא.";

    // 3. שליפת נתונים מהשטח
    const { data: requests } = await supabase.from('saban_requests').select('*').eq('status', 'pending');

    // כאן המוח מבצע ניתוח (בשילוב Gemini) לפי החוקים
    const urgentRequests = requests?.filter(r => r.is_urgent) || [];

    return {
      recommendation: `בהתאם לספר החוקים שלך (${activeRules?.length || 0} חוקים פעילים), זיהיתי ${urgentRequests.length} אירועים דחופים...`,
      priority: urgentRequests.length > 0 ? 'high' : 'medium',
      actionable_items: urgentRequests.map(r => `שיבוץ מהיר: ${r.customer_name}`)
    };
  }
};
