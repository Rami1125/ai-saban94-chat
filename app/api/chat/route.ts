import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body.messages || [];
    const lastMsg = messages[messages.length - 1];
    const userContent = lastMsg?.content || "";

    if (!userContent) {
      return NextResponse.json({ text: "שלום ראמי, במה אוכל לעזור?" });
    }

    const query = userContent.toLowerCase().trim();

    // חיפוש חכם - מוודא ששואבים את כל העמודות החדשות
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(1)
      .maybeSingle();

    if (pError) throw pError;

    if (product) {
      // יצירת התגובה הטקסטואלית (עם הגנה על מחיר ריק)
      const priceText = product.price ? `₪${product.price}` : "צרו קשר למחיר";
      const responseText = `מצאתי את ${product.name}! המחיר: ${priceText}.\n📏 צריכה: ${product.coverage_per_sqm || '0'} ק"ג/מ"ר | ⏱️ ייבוש: ${product.drying_time || 'בבדיקה'}`;
      
      // כאן התיקון הקריטי לכרטיס (UI Blueprint)
      return NextResponse.json({
        text: responseText,
        // ה-ChatShell שלך מצפה לנתונים האלו בתוך האובייקט הראשי
        uiBlueprint: {
          type: "product_card",
          data: {
            title: product.name,
            price: product.price || 0,
            image: product.image_url, 
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

    // אם לא נמצא מוצר
    return NextResponse.json({
      text: `לא מצאתי את "${userContent}" בקטלוג סבן. תרצה שאבדוק זמינות במחסן?`,
      status: "not_found"
    });

  } catch (error: any) {
    return NextResponse.json({ 
      text: `⚠️ כשל בזיהוי מוצר: ${error.message}`,
      status: "error"
    }, { status: 200 });
  }
}
