import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// מניעת קריסה בזמן Build אם המשתנים חסרים זמנית
if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV === "production") {
    console.warn("Supabase credentials missing. Database operations will fail at runtime.");
  }
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null as any;
