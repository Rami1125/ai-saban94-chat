import { getSupabase } from "./supabase";

export const SabanBrain = {
  analyzeLogistics: async () => {
    const supabase = getSupabase();
    
    try {
      // 1. שליפת חוקים מהטבלה
      const { data: rules } = await supabase
        .from('saban_brain_rules')
        .select('rule_name, rule_description')
        .eq('is_active', true);

      // 2. שליפת בקשות פתוחות
      const { data: requests } = await supabase
        .from('saban_requests')
        .select('*')
        .eq('status', 'pending');

      const brainInstructions = rules?.map(r => r.rule_description).join("\n") || "";
      
      // 3. לוגיקת המוח המובנית (החוק של חכמת)
      let autoActions: string[] = [];
      let recommendation = "הסידור נראה יציב.";

      requests?.forEach(req => {
        // יישום חוק חכמת: אם משובץ חכמת או שהבקשה דורשת מנוף
        if (req.request_type.includes('מנוף') || brainInstructions.includes('חכמת')) {
            autoActions.push(`שיוך חכמת למסמך ${req.doc_number} - מנוף 10 מטר בלבד 🏗️`);
        }
        if (req.is_urgent) {
            recommendation = `זיהיתי דחיפות בלקוח ${req.customer_name}. מומלץ להוציא את עלי מיד.`;
        }
      });

      return {
        recommendation,
        priority: autoActions.length > 0 ? 'high' : 'medium',
        actionable_items: autoActions.length > 0 ? autoActions : ["אין משימות קריטיות כרגע"]
      };

    } catch (err) {
      console.error("Brain Error:", err);
      return { recommendation: "טוען נתונים...", priority: 'low', actionable_items: [] };
    }
  }
};
