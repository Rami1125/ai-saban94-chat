import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 1. ה-Export שכל דפי הניהול מחפשים (קריטי ל-Build)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * פונקציה לעדכון/הזרקת נתונים (Seeding)
 * השתמשנו ב-Client של Supabase במקום ב-Better-SQLite כדי להתאים ל-Production
 */
export async function seedInventory() {
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

  // עדכון ב-Supabase
  const { data, error } = await supabase
    .from('inventory')
    .upsert(product, { onConflict: 'sku' })

  if (error) console.error("Error seeding inventory:", error)
  else console.log("Inventory seeded successfully")
}
