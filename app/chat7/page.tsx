import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // חילוץ נתונים עם ערכי ברירת מחדל למניעת שגיאת 400
    const message = body.message || body.content || "";
    const phone = body.phone || "972508860896"; // ברירת מחדל לג'וני
    const history = body.history || [];

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. חיפוש מוצר רלוונטי ב-Supabase (זיהוי SKU או שם בתוך ההודעה)
    const { data: products, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${message}%,sku.eq.${message}`)
      .limit(1);

    const foundProduct = products && products.length > 0 ? products[0] : null;

    // 2. בניית תשובה מבוססת הקשר (כאן יבוא החיבור למודל ה-AI שלך)
    // לצורך הדוגמה, נחזיר תשובה טכנית שתקינה לממשק שבנינו
    let reply = "";
    if (foundProduct) {
      reply = `מצאתי את ${foundProduct.product_name} במלאי. המחיר הוא ${foundProduct.price} ₪. האם תרצה להוסיף להזמנה?`;
    } else {
      reply = "אני בודק את הפרטים עבורך במערכת סבן OS...";
    }

    // החזרת תשובה במבנה שה-UI מצפה לו
    return NextResponse.json({
      reply: reply,
      product: foundProduct,
      status: "success"
    });

  } catch (error: any) {
    console.error("Brain API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
