import { getSupabase } from "./supabase";

export const SabanBrain = {
  analyzeLogistics: async () => {
    const supabase = getSupabase();
    
    try {
      // ניסיון שליפת נתונים בזהירות
      const { data: requests, error: reqError } = await supabase
        .from('saban_requests')
        .select('*')
        .eq('status', 'pending');

      if (reqError) throw reqError;

      const urgentCount = requests?.filter(r => r.is_urgent).length || 0;
      
      return {
        recommendation: urgentCount > 0 
          ? `איציק שלח ${urgentCount} בקשות דחופות. מומלץ לשבץ את עלי למסלול מהיר.` 
          : "הסידור בשליטה. זה זמן טוב לביצוע העברות בין סניפים.",
        priority: urgentCount > 0 ? 'high' : 'medium',
        actionable_items: requests?.slice(0, 3).map(r => `אישור דחוף: ${r.customer_name} (#${r.doc_number})`) || []
      };
    } catch (err) {
      console.error("Brain Error:", err);
      return {
        recommendation: "המערכת בלמידה. וודא שטבלאות הנתונים מסונכרנות.",
        priority: 'low',
        actionable_items: ["בדיקת חיבור ל-Supabase", "יצירת טבלת saban_orders"]
      };
    }
  }
};
