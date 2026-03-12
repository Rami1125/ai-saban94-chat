import { createClient } from '@supabase/supabase-js';

// 1. הגדרת משתנים - שימוש ב-Placeholder למניעת קריסת Build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'tmp-key';

// 2. לוג לבדיקה (יופיע בטרמינל של Vercel)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("⚠️ Supabase credentials missing. Check Vercel Env Variables.");
}

/**
 * יצירת הלקוח - סנכרון DNA ומלשינון מלאי.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// 3. פונקציית עזר לבדיקת מוכנות המערכת
export const isSupabaseReady = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
};
