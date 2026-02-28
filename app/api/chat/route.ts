import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // 1. בדיקה שה-Body קיים ושנשלחה הודעה (מונע את שגיאת ה-toLowerCase)
    const body = await req.json().catch(() => null);
    
    if (!body || !body.message) {
      return NextResponse.json({ 
        text: "אהלן ראמי! הגעת לסבן חומרי בניין. איך אוכל לעזור לך היום?",
        status: "empty_input"
      });
    }

    const message = body.message;
    const query = message.toLowerCase();

    // 2. חיפוש במוצרים (כולל השדות הטכניים של סבן)
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('name, price, image_url, video_url, coverage_per_sqm, drying_time, application_method, sku')
      .ilike('name', `%${query}%`)
      .maybeSingle();

    if (pError) throw pError;

    // 3. בדיקת נהגים פעילים (Active)
    const { data: drivers } = await supabase
      .from('drivers')
      .select('full_name, status')
      .eq('status', 'active')
      .limit(3);

    let responseText = "";
    let visualComponent = null;

    if (product) {
      // תשובה מפורטת למוצר שנמצא
      responseText = `מצאתי את ${product.name}. המחיר הוא ₪${product.price}.\n\n` +
                     `📏 צריכה: ${product.coverage_per_sqm || '0'} ק"ג למ"ר\n` +
                     `⏱️ ייבוש: ${product.drying_time || 'לא צוין'}\n` +
                     `🛠️ יישום: ${product.application_method || 'צרו קשר להדרכה'}`;
      
      visualComponent = {
        type: "productCard",
        props: { ...product }
      };
    } else {
      // תשובה אם לא נמצא מוצר - בודק זמינות נהגים
      const driverList = drivers?.map(d => d.full_name).join(", ");
      responseText = `לא מצאתי מוצר בשם "${message}" בקטלוג.\n\n` +
                     (driverList 
                       ? `אבל אל דאגה, הנהגים שלנו (${driverList}) זמינים כרגע למשלוחים מהירים בטייבה והסביבה!` 
                       : "צרו איתנו קשר בטלפון ונשמח לעזור לכם למצוא את מה שאתם מחפשים.");
    }

    // 4. החזרת תשובה תקינה
    return NextResponse.json({
      text: responseText,
      component: visualComponent,
      status: "success"
    });

  } catch (error: any) {
    // ה"מלשינון החריף" - לוגיקת זיהוי תקלות
    console.error("SABAN_OS_DEBUG:", error);

    let debugMessage = "שגיאה לא ידועה במערכת";
    if (error.code === '42P01') debugMessage = "טבלת המוצרים (products) לא קיימת ב-Supabase!";
    if (error.code === '42703') debugMessage = `חסרה עמודה בטבלה! בדוק את ה-SQL: ${error.message}`;
    if (error.message?.includes("toLowerCase")) debugMessage = "התקבלה הודעה ריקה לשרת (Undefined message)";

    return NextResponse.json({ 
      text: `⚠️ **מלשינון סבן זיהה כשל:**\n\n${debugMessage}\n\n*פרטים טכניים:* ${error.message || 'אין פירוט'}`,
      status: "error_debug"
    }, { status: 200 }); // מחזירים 200 כדי שהבועה תופיע בצ'אט
  }
}
