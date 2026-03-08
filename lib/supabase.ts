import { createClient } from '@supabase/supabase-js';

// 1. הגדרת משתנים עם עדיפות ל-Service Role (לביצועים וניהול מכסות)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. מניעת אתחול עם ערכים ריקים שגורמים לשגיאות שקטות
if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase credentials missing. Check Vercel Env Variables.");
}

/**
 * יצירת הלקוח - סנכרון DNA ומלשינון מלאי.
 * משלב הגדרות Edge/API יחד עם יכולות Real-time לקופה המהירה.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // מניעת דליפות זיכרון ביישומי Edge/API
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  // --- תוספת עבור הקופה המהירה (Real-time) ---
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// 3. פונקציית עזר לבדיקת מוכנות המערכת בדאשבורד
export const isSupabaseReady = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
};
