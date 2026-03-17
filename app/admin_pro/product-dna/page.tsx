-- 1. הוספת כל עמודות ה-Elite לטבלת המלאי (מניעת שגיאה 400)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS keywords TEXT,
ADD COLUMN IF NOT EXISTS search_tags TEXT,
ADD COLUMN IF NOT EXISTS last_trained TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS image_url_2 TEXT,
ADD COLUMN IF NOT EXISTS image_url_3 TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS application_method TEXT,
ADD COLUMN IF NOT EXISTS drying_time TEXT,
ADD COLUMN IF NOT EXISTS coverage_info TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. פתיחת הרשאות RLS גורפת לכל הטבלאות
DO $$ 
DECLARE 
    t text;
    p_name text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('inventory', 'product_weights', 'vip_profiles', 'vip_customer_history', 'product_aliases') 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        p_name := 'DNA_Master_Access_v77_' || t;
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', p_name, t);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true);', p_name, t);
    END LOOP;
END $$;

-- 3. הפעלת Real-time חסינה
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

SELECT 'Saban OS: DNA Matrix V77 Ready 🦾' as status;
