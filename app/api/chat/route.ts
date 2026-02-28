import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const query = message.toLowerCase();

    // 1. חיפוש במוצרים
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('name, price, image_url, video_url, coverage_per_sqm, drying_time, application_method, sku')
      .ilike('name', `%${query}%`)
      .maybeSingle(); // maybeSingle מונע שגיאה אם לא נמצא כלום

    if (pError) throw pError;

    // 2. בדיקת מלאי
    const { data: stock } = await supabase
      .from('inventory')
      .select('product_name')
      .ilike('product_name', `%${query}%`)
      .maybeSingle();

    // 3. בדיקת נהגים
    const { data: activeDrivers } = await supabase
      .from('drivers')
      .select('full_name')
      .eq('status', 'active');

    let responseText = "";
    let visualComponent = null;

    if (product) {
      responseText = `מצאתי את ${product.name}. מחיר: ₪${product.price}. צריכה: ${product.coverage_per_sqm} ק"ג/מ"ר. ייבוש: ${product.drying_time}.`;
      visualComponent = {
        type: "productCard",
        props: { ...product }
      };
    } else {
      const drivers = activeDrivers?.map(d => d.full_name).join(", ") || "צוות סבן";
      responseText = `לא מצאתי את "${message}", אבל ${drivers} זמינים למשלוח. תרצה עזרה נוספת?`;
    }

    return NextResponse.json({
      text: responseText,
      component: visualComponent,
      status: "success"
    });

  } catch (error: any) {
    console.error("DEBUG_SABAN_OS:", error);

    // המלשינון החריף - יגיד לנו בדיוק מה הבעיה במסך הצ'אט
    let errorDetail = "שגיאה לא ידועה במערכת";
    
    if (error.code === 'PGRST116') errorDetail = "חיפוש ה-Single החזיר יותר מתוצאה אחת או אפס תוצאות";
    if (error.code === '42P01') errorDetail = "טבלת המוצרים (products) לא קיימת!";
    if (error.code === '42703') errorDetail = `חסרה עמודה בטבלה! (כנראה sku או coverage). הודעה: ${error.message}`;
    if (error.message?.includes("fetch")) errorDetail = "בעיית תקשורת מול Supabase - בדוק API Keys";

    return NextResponse.json({ 
      text: `⚠️ **מלשינון סבן זיהה כשל:**\n\n${errorDetail}\n\n*פרטים:* ${error.message || 'אין פירוט'}`,
      status: "error_debug"
    }, { status: 200 });
  }
} // <--- הסוגר הזה היה חסר וגרם לשגיאה ב-Vercel!
