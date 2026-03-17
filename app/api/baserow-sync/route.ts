import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Saban OS V83.0 - Baserow to Supabase Real-time Sync
 * --------------------------------------------------
 * כנס להגדרות הטבלה ב-Baserow > Webhooks.
 * הוסף Webhook חדש שמצביע לכתובת של ה-Route הזה.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // חובה Service Role לעקיפת RLS
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Baserow שולח אירועים מסוג 'row_updated'
    if (body.event_type === 'rows.updated' || body.event_type === 'row_updated') {
      const rowData = body.items ? body.items[0] : body.row;
      
      // חילוץ הנתונים (וודא ששמות העמודות ב-Baserow תואמים ל-Supabase)
      const { sku, product_name, price, category, keywords, description } = rowData;

      if (!sku) throw new Error("Missing SKU for sync");

      const { error } = await supabase
        .from('inventory')
        .update({
          product_name,
          price,
          category,
          keywords,
          description,
          last_trained: new Date().toISOString()
        })
        .eq('sku', sku);

      if (error) throw error;

      return NextResponse.json({ success: true, message: `SKU ${sku} synced to Supabase 🦾` });
    }

    return NextResponse.json({ message: "Event ignored" });
  } catch (error: any) {
    console.error("Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
