import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // קריאת הנתונים מה-ChatShell (תומך במערך הודעות)
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1];
    const userContent = lastMsg?.content || body.message || "";

    if (!userContent) {
      return NextResponse.json({ text: "אהלן ראמי! איך אוכל לעזור לך היום בסבן חומרי בניין?" });
    }

    const query = userContent.toLowerCase().trim();

    // 1. חיפוש חכם במוצרים (חיפוש גמיש בשם או במק"ט)
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(1)
      .maybeSingle();

    if (pError) throw pError;

    // 2. בדיקת נהגים פעילים בטייבה
    const { data: drivers } = await supabase
      .from('drivers')
      .select('full_name')
      .eq('status', 'active')
      .limit(2);

    let responseText = "";
    let uiBlueprint = null;

    if (product) {
      // אם נמצא מוצר - בונים את הכרטיס עם המדיה
      responseText = `מצאתי את ${product.name}! המחיר: ₪${product.price}.\n` +
                     `📏 צריכה: ${product.coverage_per_sqm || '0'} ק"ג/מ"ר | ⏱️ ייבוש: ${product.drying_time || 'בבדיקה'}`;
      
      // הנתונים שהאייפון שלך יציג ויזואלית
      uiBlueprint = {
        type: "product_card",
        data: {
          title: product.name,
          price: product.price,
          image: product.image_url, // הלינק לתמונה מהסטודיו
          video: product.video_url, // הלינק לסרטון מהסטודיו
          description: product.application_method,
          specs: {
            coverage: product.coverage_per_sqm,
            drying: product.drying_time,
            sku: product.sku
          }
        }
      };
    } else {
      // אם לא נמצא מוצר
      const driverList = drivers?.map(d => d.full_name).join(", ");
      responseText = `לא מצאתי מוצר בשם "${userContent}" בקטלוג, אבל ${driverList || 'צוות סבן'} זמינים למשלוח מהיר!`;
    }

    return NextResponse.json({
      text: responseText,
      uiBlueprint: uiBlueprint, // ה-Frontend ישתמש בזה להצגת הכרטיס
      status: "success"
    });

  } catch (error: any) {
    console.error("SABAN_OS_DEBUG:", error);
    return NextResponse.json({ 
      text: `⚠️ **מלשינון סבן זיהה כשל:** ${error.message}`,
      status: "error"
    }, { status: 200 });
  }
}
