import { createClient } from '@supabase/supabase-js';

// פונקציה פנימית שלא נחשפת ל-Build אלא אם קוראים לה
const createSupabaseApp = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // בזמן Build, אם חסר מידע, נחזיר אובייקט דמי שלא יקרוס
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
};

// ייצוא הלקוח כ-Getter
export const getSupabase = () => createSupabaseApp();

// לצורך תאימות לשאר הקוד שלך
export const supabase = getSupabase();
