import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || "";
    const query = lastMsg.toLowerCase().trim();

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .maybeSingle();

    if (product) {
      return NextResponse.json({
        text: `מצאתי את ${product.name}!`,
        // זה החלק שגורם לכרטיס להופיע!
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
            }
          }
        }
      });
    }

    return NextResponse.json({ text: "לא מצאתי את המוצר, תרצה שאבדוק במלאי?" });
  } catch (e: any) {
    return NextResponse.json({ text: "שגיאה: " + e.message }, { status: 500 });
  }
}
