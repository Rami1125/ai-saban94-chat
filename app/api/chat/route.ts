import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // קריאת הנתונים מהבקשה
    const body = await req.json().catch(() => ({}));
    
    // "המקלט האוניברסלי" - תומך בכל שם שדה אפשרי מה-Frontend
    const message = body.message || body.text || body.input || body.prompt || body.content;

    // בדיקה אם ההודעה באמת הגיעה
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ 
        text: "אהלן ראמי! הגעת לסבן חומרי בניין. איך אוכל לעזור לך היום?",
        status: "waiting_for_input"
      });
    }

    const query = message.toLowerCase();

    // 1. חיפוש במוצרים (כולל השדות הטכניים החדשים)
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('name, price, image_url, video_url, coverage_per_sqm, drying_time, application_method, sku')
      .ilike('name', `%${query}%`)
      .maybeSingle();

    if (pError) throw pError;

    // 2. בדיקת נהגים פעילים
    const { data: drivers } = await supabase
      .from('drivers')
      .select('full_name')
      .eq('status', 'active')
      .limit(2);

    let responseText = "";
    let visualComponent = null;

    if (product) {
      responseText = `מצאתי את ${product.name}. המחיר: ₪${product.price}.\n\n` +
                     `📏 צריכה: ${product.coverage_per_sqm || '0'} ק"ג/מ"ר\n` +
                     `⏱️ ייבוש: ${product.drying_time || 'בבדיקה'}\n` +
                     `🛠️ יישום: ${product.application_method || 'פנה לנציג'}`;
      
      visualComponent = {
        type: "productCard",
        props: { ...product }
      };
    } else {
      const driverList = drivers?.map(d => d.full_name).join(", ");
      responseText = `לא מצאתי את "${message}" בקטלוג, אבל ${driverList || 'הצוות שלנו'} זמינים למשלוח מהיר בטייבה!`;
    }

    return NextResponse.json({
      text: responseText,
      component: visualComponent,
      status: "success"
    });

  } catch (error: any) {
    console.error("SABAN_OS_CRITICAL:", error);
    return NextResponse.json({ 
      text: `⚠️ **מלשינון סבן זיהה כשל:** ${error.message}`,
      status: "error_debug"
    }, { status: 200 });
  }
}
