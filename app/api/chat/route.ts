import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // 1. קריאת הנתונים עם "מלשינון פנימי" למבנה ה-JSON
    const body = await req.json().catch(() => ({}));
    
    // שליפת התוכן: תמיכה גם בהודעה בודדת (message) וגם במערך (messages) מה-ChatShell
    let userContent = "";

    if (body.messages && Array.isArray(body.messages)) {
      // לוקחים את התוכן מההודעה האחרונה במערך
      const lastMsg = body.messages[body.messages.length - 1];
      userContent = lastMsg?.content || "";
    } else {
      // תמיכה בפורמט ישן או פשוט
      userContent = body.message || body.text || body.input || body.content || "";
    }

    // 2. בדיקה אם המלשינון זיהה הודעה ריקה
    if (!userContent || typeof userContent !== 'string' || userContent.trim() === "") {
      return NextResponse.json({ 
        text: "אהלן ראמי! אני כאן בסבן חומרי בניין. שלח לי שם של מוצר או שאלה על משלוח.",
        status: "waiting_for_input"
      });
    }

    const query = userContent.toLowerCase().trim();

    // 3. חיפוש במוצרים (כולל השדות הטכניים שסגרנו ב-SQL)
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*') // שולף את כל העמודות כולל image_url, coverage, drying_time
      .ilike('name', `%${query}%`)
      .maybeSingle();

    if (pError) throw pError;

    // 4. בדיקת נהגים זמינים בטייבה
    const { data: drivers } = await supabase
      .from('drivers')
      .select('full_name')
      .eq('status', 'active')
      .limit(2);

    let responseText = "";
    let uiBlueprint = null;

    if (product) {
      // תשובה מקצועית מבוססת נתונים מהסטודיו
      responseText = `מצאתי את ${product.name}.\n` +
                     `💰 מחיר: ₪${product.price}\n` +
                     `📏 צריכה: ${product.coverage_per_sqm || '0'} ק"ג למ"ר\n` +
                     `⏱️ ייבוש: ${product.drying_time || 'בבדיקה'}\n` +
                     `🛠️ יישום: ${product.application_method || 'פנה לייעוץ טכני'}`;
      
      // אובייקט הנתונים עבור ה-Frontend (uiBlueprint)
      uiBlueprint = {
        type: "product_display",
        data: {
          ...product,
          is_available: true
        }
      };
    } else {
      // תשובה חכמה כשלא נמצא מוצר
      const driverList = drivers?.map(d => d.full_name).join(", ");
      responseText = `לא מצאתי מוצר בשם "${userContent}" בקטלוג סבן.\n\n` +
                     (driverList 
                       ? `אבל הנהגים שלנו (${driverList}) פעילים כרגע ויכולים לעזור בהובלה של חומרים דומים!` 
                       : "תרצה שאעביר אותך לנציג אנושי שיבדוק במחסן?");
    }

    // 5. החזרת התשובה המסונכרנת ל-ChatShell
    return NextResponse.json({
      text: responseText,
      uiBlueprint: uiBlueprint, // ה-Frontend שלך משתמש בזה להצגת כרטיסים
      status: "success"
    });

  } catch (error: any) {
    // "המלשינון החריף" - הדפסה לטרמינל והחזרה לצ'אט
    console.error("🚨 כשל במערכת סבן:", error);

    let errorMessage = "חלה שגיאה לא צפויה";
    if (error.code === '42P01') errorMessage = "טבלת המוצרים (products) חסרה במסד הנתונים";
    if (error.code === '42703') errorMessage = "חסרה עמודה ב-SQL (וודא שהרצת את פקודות ה-ALTER)";

    return NextResponse.json({ 
      text: `⚠️ **מלשינון סבן זיהה כשל:**\n${errorMessage}\n\n*פרטים:* ${error.message}`,
      status: "error_debug"
    }, { status: 200 });
  }
}
