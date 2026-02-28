import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1];
    const userContent = lastMsg?.content || body.message || "";

    if (!userContent) {
      return NextResponse.json({ text: "אהלן ראמי, במה אוכל לעזור היום בסבן חומרי בניין?" });
    }

    const query = userContent.toLowerCase().trim();

    // חיפוש גמיש בשם או במק"ט
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(1)
      .maybeSingle();

    if (pError) throw pError;

    if (product) {
      const priceVal = product.price ? `₪${product.price}` : "צרו קשר למחיר";
      const responseText = `מצאתי את ${product.name}! המחיר: ${priceVal}.\n` +
                           `📏 צריכה: ${product.coverage_per_sqm || '0'} ק"ג/מ"ר | ⏱️ ייבוש: ${product.drying_time || 'בבדיקה'}`;
      
      return NextResponse.json({
        text: responseText,
        uiBlueprint: {
          type: "product_card",
          data: {
            title: product.name,
            price: product.price || 0,
            image: product.image_url || product.image,
            video: product.video_url,
            description: product.application_method,
            specs: {
              coverage: product.coverage_per_sqm,
              drying: product.drying_time
            }
          }
        },
        status: "success"
      });
    }

    return NextResponse.json({
      text: `לא מצאתי מוצר בשם "${userContent}" בקטלוג סבן. תרצה שאבדוק זמינות במחסן?`,
      status: "not_found"
    });

  } catch (error: any) {
    console.error("CHAT_API_ERROR:", error);
    return NextResponse.json({ 
      text: `⚠️ **מלשינון סבן זיהה כשל:** ${error.message}`,
      status: "error"
    }, { status: 200 });
  }
}
