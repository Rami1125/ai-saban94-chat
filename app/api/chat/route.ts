import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1]?.content || body.message || "";
    
    // ניקוי טקסט: הסרת רווחים מיותרים והפיכה לאותיות קטנות
    const query = lastMsg.trim().toLowerCase();

    if (!query) {
      return NextResponse.json({ text: "שלום ראמי! איך אוכל לעזור היום בסבן חומרי בניין?" });
    }

    // חיפוש חכם: מוצא את המוצר גם אם כתבת רק חלק מהשם (למשל רק "107")
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`) // מחפש גם בשם וגם במק"ט
      .limit(1)
      .maybeSingle();

    if (pError) {
      console.error("Supabase Error:", pError);
      throw pError;
    }

    if (product) {
      return NextResponse.json({
        text: `מצאתי את ${product.name}!`,
        uiBlueprint: {
          type: "product_card",
          data: {
            title: product.name,
            price: product.price || "צרו קשר",
            image: product.image_url,
            video: product.video_url,
            specs: {
              coverage: product.coverage_per_sqm || "לפי דרישה",
              drying: product.drying_time || "בבדיקה",
              method: product.application_method
            }
          }
        },
        status: "success"
      });
    }

    // אם לא נמצא - המלשינון בודק אם יש מוצרים דומים
    const { data: suggestions } = await supabase
      .from('products')
      .select('name')
      .limit(3);

    const suggestionText = suggestions?.map(s => s.name).join(", ");

    return NextResponse.json({ 
      text: `לא מצאתי בדיוק את "${lastMsg}".\nאולי התכוונת ל: ${suggestionText || 'מוצר אחר'}?`,
      status: "not_found"
    });

  } catch (error: any) {
    return NextResponse.json({ 
      text: `⚠️ **מלשינון סבן זיהה נתק:** ${error.message}`,
      status: "error"
    }, { status: 200 });
  }
}
