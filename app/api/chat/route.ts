import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const query = (messages[messages.length - 1]?.content || "").toLowerCase().trim();

    // חיפוש בטבלת inventory לפי שם המוצר
    const { data: item, error } = await supabase
      .from('inventory')
      .select('*')
      .ilike('product_name', `%${query}%`)
      .maybeSingle();

    if (item) {
      return NextResponse.json({
        text: `מצאתי את ${item.product_name}! מחיר: ₪${item.price}. צריכה ממוצעת: ${item.coverage_per_sqm}.`,
        uiBlueprint: {
          type: "product_card",
          data: {
            title: item.product_name,
            price: item.price,
            image: item.image_url,
            video: item.video_url,
            specs: {
              coverage: item.coverage_per_sqm,
              drying: item.drying_time,
              method: item.application_method
            }
          }
        }
      });
    }

    return NextResponse.json({ text: `לא מצאתי את "${query}" במלאי כרגע.` });
  } catch (err: any) {
    return NextResponse.json({ text: "תקלה במוח המערכת." }, { status: 200 });
  }
}
