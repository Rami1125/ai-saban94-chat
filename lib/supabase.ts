// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// יצירת הלקוח עם בדיקת תקינות מינימלית
// ה-! בסוף הוסר כדי למנוע קריסה בזמן ה-Build
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * פונקציה לעדכון/הזרקת נתונים (Seeding)
 */
export async function seedInventory() {
  // בדיקה בזמן ריצה אם יש מפתחות אמיתיים
  if (supabaseUrl.includes('placeholder')) {
    console.warn("⚠️ Supabase credentials missing. Seeding skipped.");
    return;
  }

  const product = {
    sku: "SIKA-107",
    product_name: "סיקה טופ 107",
    description: "חומר איטום צמנטי גמיש",
    price: 220,
    stock_quantity: 30,
    coverage: "4 ק\"ג למ\"ר",
    drying_time: "24 שעות",
    image_url: "https://www.sika.com/content/dam/dms/il01/k/sika_top_107_seal_new.png",
    supplier_name: "גילאר (סיקה ישראל)"
  }

  const { data, error } = await supabase
    .from('inventory')
    .upsert(product, { onConflict: 'sku' })

  if (error) console.error("Error seeding inventory:", error)
  else console.log("Inventory seeded successfully")
}
