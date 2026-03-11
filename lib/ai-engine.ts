import { supabase } from './supabase';

export const askSabanAI = async (userId: string, query: string) => {
  // 1. בדיקת קאש (מהירות)
  const { data: cache } = await supabase
    .from('ai_answers_cache')
    .select('response')
    .eq('query_hash', query.trim().toLowerCase())
    .single();
  if (cache) return cache.response;

  // 2. שליפת הקשר (זיכרון לקוח + מלאי זמין)
  const { data: memory } = await supabase.from('customer_memory').select('*').eq('user_id', userId).single();
  const { data: inventory } = await supabase.from('inventory').select('name, stock').lt('stock', 10);

  // 3. בניית ה-Context ל-Gemini (כאן נכנסת הלוגיקה של ח.סבן)
  const context = `
    לקוח: ${memory?.full_name || 'אורח'}. 
    רכישות עבר: ${memory?.last_purchases || 'אין'}.
    חוסרים במלאי כרגע: ${inventory?.map(i => i.name).join(', ')}.
    שאלה: ${query}
  `;

  // כאן תתבצע הקריאה ל-Gemini API
  const aiResponse = "שלום רמי, מומלץ להשתמש בסיקה פלקס 11FC לאיטום האמבטיה שצילמת..."; 
  
  return aiResponse;
};
