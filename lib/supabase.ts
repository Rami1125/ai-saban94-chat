import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// משתנה פנימי לניהול המופע
let supabaseInstance: any;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'saban-os-auth-v1'
      }
    });
  }
  return supabaseInstance;
};

// --- הפתרון לשגיאות ה-Build ---
// מייצאים מופע מוכן מראש שכל הדפים הישנים יוכלו להשתמש בו בלי שינוי קוד
export const supabase = getSupabase();
