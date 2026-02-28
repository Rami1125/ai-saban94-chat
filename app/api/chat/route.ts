import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || "";
    const query = lastMsg.toLowerCase().trim();

    if (!query) return NextResponse.json({ text: "אהלן ראמי, במה אוכל לעזור?" });

    // שליפה משולבת מכל הטבלאות הרלוונטיות
    const { data: product, error: pError } = await supabase
      .from('products')
      .select(`
        *,
        inventory:inventory(stock_quantity, category),
        drivers:drivers(full_name, status)
      `)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .maybeSingle();

    if (pError) throw pError;

    if (product) {
      const priceText = product.price ? `₪${product.price}` : "צרו קשר";
      
      return NextResponse.json({
        text: `מצאתי את ${product.name}! במחיר של ${priceText}.`,
        uiBlueprint: {
          type: "product_card",
          data: {
            id: product.id,
            title: product.name,
            price: product.price,
            image: product.image_url,
            video: product.video_url,
            sku: product.sku,
            specs: {
              coverage: product.coverage_per_sqm,
              drying: product.drying_time,
              method: product.application_method,
              stock: product.inventory?.stock_quantity || 'זמין במלאי'
            },
            features: product.features || []
          }
        }
      });
    }

    return NextResponse.json({ text: `לא מצאתי את "${lastMsg}", תרצה שאבדוק מוצר דומה?` });
  } catch (error: any) {
    return NextResponse.json({ text: "שגיאה במערכת", error: error.message }, { status: 500 });
  }
}
