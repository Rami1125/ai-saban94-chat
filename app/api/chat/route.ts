import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const query = message.toLowerCase();

    // 1. חיפוש בטבלת מוצרים (כולל השדות הטכניים החדשים)
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('name, price, image_url, video_url, coverage_per_sqm, drying_time, application_method, sku')
      .ilike('name', `%${query}%`)
      .single();

    // 2. בדיקת מלאי זמין (מטבלת inventory)
    const { data: stock } = await supabase
      .from('inventory')
      .select('product_name, category, supplier_name')
      .ilike('product_name', `%${query}%`)
      .single();

    // 3. בדיקת נהגים זמינים למשלוח (מטבלת drivers)
    const { data: activeDrivers } = await supabase
      .from('drivers')
      .select('full_name, vehicle_type, location')
      .eq('status', 'active');

    // 4. בדיקת זיכרון AI (מטבלת answers_cache - השורה של סיקה 107 שראינו קודם)
    const { data: cachedAnswer } = await supabase
      .from('answers_cache')
      .select('payload')
      .ilike('key', `%${query}%`)
      .single();

    // לוגיקת בניית התשובה - "המוח של סבן"
    let responseText = "";
    let visualComponent = null;

    if (product) {
      // אם נמצא מוצר בקטלוג
      responseText = `מצאתי עבורך את ${product.name}. המחיר הוא ₪${product.price}. 
      נתונים טכניים: צריכה של ${product.coverage_per_sqm} ק"ג למ"ר וזמן ייבוש של ${product.drying_time}.
      שיטת יישום: ${product.application_method}.`;
      
      visualComponent = {
        type: "productCard",
        props: {
          name: product.name,
          price: product.price,
          image: product.image_url,
          video: product.video_url,
          sku: product.sku,
          coverage: product.coverage_per_sqm,
          drying: product.drying_time
        }
      };
    } else if (cachedAnswer) {
      // אם נמצאה תשובה מוכנה מראש ב-Cache
      responseText = cachedAnswer.payload.text;
      visualComponent = cachedAnswer.payload.components?.[0];
    } else {
      // תשובת ברירת מחדל חכמה
      const driverNames = activeDrivers?.map(d => d.full_name).join(", ") || "צוות סבן";
      responseText = `לא מצאתי בדיוק את "${message}", אבל ${driverNames} זמינים למשלוחים בטייבה והסביבה. תרצה שאחבר אותך לנציג אנושי?`;
    }

    // החזרת התשובה ללקוח (מונע שגיאה 500)
    return NextResponse.json({
      text: responseText,
      component: visualComponent,
      timestamp: new Date().toISOString(),
      status: "success"
    });

  } catch (error: any) {
    console.error("Critical Chat Error:", error);
    // החזרת שגיאה מובנית במקום קריסת שרת
    return NextResponse.json({ 
      text: "מצטער ראמי, יש לי תקלה קטנה בחיבור למסד הנתונים. אני בודק את זה.",
      error: error.message 
    }, { status: 200 }); // מחזירים 200 כדי שהצ'אט לא יקרוס ויציג את הודעת השגיאה בבועה
  }
}
