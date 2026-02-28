import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || "";
    const query = lastMsg.toLowerCase().trim();

    if (!query) return NextResponse.json({ text: "שלום! איך אוכל לעזור?" });

    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .maybeSingle();

    if (pError) throw pError;

    if (product) {
      return NextResponse.json({
        text: `מצאתי את ${product.name}!`,
        uiBlueprint: {
          type: "product_card",
          data: {
            title: product.name || "מוצר ללא שם",
            price: product.price || "צרו קשר",
            image: product.image_url || null,
            video: product.video_url || null,
            specs: {
              coverage: product.coverage_per_sqm || "לפי הצורך",
              drying: product.drying_time || "בבדיקה",
              method: product.application_method || ""
            },
            features: Array.isArray(product.features) ? product.features : []
          }
        }
      });
    }

    return NextResponse.json({ text: `לא מצאתי את "${lastMsg}", תרצה שנבדוק משהו אחר?` });
  } catch (error: any) {
    console.error("Critical Chat Error:", error);
    return NextResponse.json({ text: "מצטער, חלה שגיאה בחיבור למערכת." }, { status: 200 });
  }
}
