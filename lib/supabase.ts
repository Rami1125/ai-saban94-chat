import { createClient } from '@supabase/supabase-js';

// שימוש בערכי דמי (Placeholder) אם המשתנים חסרים בזמן ה-Build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-site.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-123';

/**
 * יצירת הלקוח. 
 * בזמן ה-Build ב-Vercel המשתנים לעיתים לא מוזרקים, 
 * לכן אנחנו משתמשים ב-Placeholders כדי למנוע את שגיאת "supabaseKey is required".
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export const isSupabaseReady = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};
