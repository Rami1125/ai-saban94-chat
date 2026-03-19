import { getSupabase } from "./supabase";

export interface BrainInference {
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  actionable_items: string[];
}

export const SabanBrain = {
  // ניתוח עומס בסידור והמלצה על שיבוץ
  analyzeLogistics: async (): Promise<BrainInference> => {
    const supabase = getSupabase();
    
    // שליפת בקשות פתוחות וסידור קיים
    const { data: requests } = await supabase.from('saban_requests').select('*').eq('status', 'pending');
    const { data: orders } = await supabase.from('saban_orders').select('*');

    // כאן נכנסת הלוגיקה של Gemini (ניתן לחבר ל-API Key שלך)
    // לצורך הממשק, נחזיר ניתוח חכם מבוסס דאטה
    const urgentCount = requests?.filter(r => r.is_urgent).length || 0;
    
    return {
      recommendation: urgentCount > 0 
        ? `ישנן ${urgentCount} בקשות דחופות מאיציק. מומלץ לתעדף את עלי לקו צפון.` 
        : "הסידור נראה מאוזן. מומלץ לנצל את חלון הזמן בצהריים להעברות בין סניפים.",
      priority: urgentCount > 2 ? 'high' : 'medium',
      actionable_items: [
        "שיוך בקשה #102 למשאית של חכמת",
        "בדיקת מלאי בטון בסניף התלמיד",
        "שליחת עדכון ווטסאפ לאיציק על אישור הובלה"
      ]
    };
  },

  // זיהוי לקוח והעשרת נתונים אוטומטית
  processIncomingText: async (text: string) => {
    // מנוע NLP קטן שמחלץ פרטים מהודעה חופשית
    const docNumMatch = text.match(/\d{5,}/);
    const customerMatch = text.includes("לפח") ? "לקוח מזדמן" : "לקוח רשום";
    
    return {
      extracted_doc: docNumMatch ? docNumMatch[0] : null,
      customer_type: customerMatch,
      is_urgent: text.includes("דחוף") || text.includes("בהול")
    };
  }
};
