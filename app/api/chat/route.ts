import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || body.message || "";
    const query = lastMsg.trim().toLowerCase();

    if (!query) return NextResponse.json({ text: "שלום ראמי, במה אוכל לעזור?" });

    // חיפוש גמיש (Fuzzy Search)
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .maybeSingle();

    if (pError) throw pError;

    if (product) {
      return NextResponse.json({
        text: `מצאתי את ${product.name}! המחיר הוא ₪${product.price}.`,
        uiBlueprint: {
          type: "product_card",
          data: {
            title: product.name,
            price: product.price,
            image: product.image_url,
            video: product.video_url,
            specs: {
              coverage: product.coverage_per_sqm,
              drying: product.drying_time,
              method: product.application_method
            },
            features: product.features || []
          }
        }
      });
    }

    return NextResponse.json({ text: `לא מצאתי את "${lastMsg}", תרצה שאבדוק במחסן?` });
  } catch (error: any) {
    return NextResponse.json({ text: "שגיאה בחיבור למסד הנתונים", error: error.message }, { status: 200 });
  }
}
