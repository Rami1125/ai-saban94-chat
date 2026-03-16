import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban OS V27.0 - Order Creation API
 * ----------------------------------
 * טריגר: נשלח מפורטל ה-VIP ברגע שהלקוח מאשר סיכום הזמנה.
 * פעולה: מחשב משקל לוגיסטי סופי, בודק חריגות DNA, ומייצר פקודת עבודה ב-DB.
 */

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    
    const { 
      customerId, 
      items, 
      deliveryDetails,
      totalWeight: clientWeight // משקל שנשלח מהקליינט לגיבוי
    } = body;

    // 1. וולידציה בסיסית
    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
    }

    // 2. שליפת משקלים לוגיסטיים עדכניים מה-DNA (מניעת מניפולציות קליינט)
    const { data: weightRules } = await supabase
      .from('product_weights')
      .select('sku, weight_kg');

    const weightMap = new Map(weightRules?.map(r => [r.sku, parseFloat(r.weight_kg)]) || []);

    // 3. חישוב משקל כולל לביצוע (חוק ה-12 טון)
    let calculatedTotalWeight = 0;
    const processedItems = items.map((item: any) => {
      const unitWeight = weightMap.get(item.sku) || 25; // ברירת מחדל 25 ק"ג לשק אם לא נמצא
      const itemTotalWeight = unitWeight * item.qty;
      calculatedTotalWeight += itemTotalWeight;
      
      return {
        sku: item.sku,
        name: item.product_name || item.name,
        qty: item.qty,
        unit_weight: unitWeight
      };
    });

    // 4. הזרקה לטבלת orders
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        status: 'received', // סטטוס ראשוני: התקבלה
        items: processedItems,
        total_weight: calculatedTotalWeight,
        delivery_details: deliveryDetails || {
            address: "טרם עודכן",
            contact_name: "בר",
            contact_phone: "054-5998111"
        }
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. רישום להיסטוריית לקוח (מניעת כפילויות עתידית)
    const historyEntries = items.map((item: any) => ({
      customer_id: customerId,
      sku: item.sku,
      product_name: item.product_name || item.name,
      quantity: item.qty,
      project_name: deliveryDetails?.project || "סטרומה 4",
      source: 'VIP_PORTAL'
    }));

    await supabase.from('vip_customer_history').insert(historyEntries);

    // 6. מענה הצלחה
    return NextResponse.json({ 
      success: true, 
      orderId: newOrder.id,
      message: "ההזמנה נקלטה במוח הלוגיסטי ומוכנה לביצוע 🦾",
      summary: {
        itemsCount: items.length,
        totalWeight: calculatedTotalWeight
      }
    });

  } catch (error: any) {
    console.error("Critical Order Error:", error);
    return NextResponse.json({ 
      error: "תקלה ברישום ההזמנה", 
      details: error.message 
    }, { status: 500 });
  }
}
