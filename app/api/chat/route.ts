import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || body.message || "";
    const query = lastMsg.trim().toLowerCase();

    if (!query) return NextResponse.json({ text: "אהלן ראמי, במה אוכל לעזור היום?" });

    // חיפוש חכם בטבלת inventory לפי השדות המדויקים שלך
    const { data: item, error: pError } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(1)
      .maybeSingle();

    if (pError) throw pError;

    if (item) {
      return NextResponse.json({
        text: `מצאתי את ${item.product_name}!`,
        uiBlueprint: {
          type: "product_card",
          data: {
            title: item.product_name,
            price: item.price || 0,
            image: item.image_url,
            video: item.video_url,
            sku: item.sku,
            specs: {
              coverage: item.coverage_per_sqm || "לפי דרישה",
              drying: item.drying_time || "בבדיקה",
              method: item.application_method || ""
            },
            features: item.features || []
          }
        }
      });
    }

    return NextResponse.json({ 
      text: `לא מצאתי את "${lastMsg}" במלאי. תרצה שאבדוק מוצר דומה?` 
    });

  } catch (error: any) {
    return NextResponse.json({ text: "שגיאה בחיבור למסד הנתונים" }, { status: 200 });
  }
}
