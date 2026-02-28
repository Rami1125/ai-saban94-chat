import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // 1. חיפוש חכם במוצרים לפי שם (למשל "סיקה 107")
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('name, price, image_url, video_url, coverage_per_sqm, drying_time, application_method')
      .ilike('name', `%${message}%`)
      .limit(1);

    if (productError) throw productError;

    // 2. בניית התשובה של ה-AI (הלוגיקה של סבן)
    let aiResponse = "";
    let productData = null;

    if (products && products.length > 0) {
      const p = products[0];
      productData = p;
      aiResponse = `מצאתי עבורך את ${p.name}. המחיר הוא ₪${p.price}. 
      הצריכה הממוצעת היא ${p.coverage_per_sqm} ק"ג למ"ר וזמן הייבוש הוא ${p.drying_time}. 
      שיטת היישום המומלצת: ${p.application_method}`;
    } else {
      aiResponse = "אני מצטער, לא מצאתי מוצר כזה בקטלוג של סבן. תרצה שאבדוק במלאי הכללי?";
    }

    // 3. החזרת תשובה תקינה (מונע את שגיאה 500)
    return NextResponse.json({ 
      text: aiResponse,
      product: productData // הנתונים האלו יזינו את האייפון סימולטור
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "שגיאה בשרת הצ'אט", details: error.message }, { status: 500 });
  }
}
