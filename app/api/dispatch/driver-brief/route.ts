import { NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { driverName, date } = await req.json();
    const supabase = getSupabase();

    // 1. שליפת כל ההזמנות של הנהג לאותו יום
    const { data: orders, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('driver_name', driverName)
      .eq('scheduled_date', date)
      .order('scheduled_time', { ascending: true });

    if (error || !orders.length) return NextResponse.json({ error: 'No orders found' }, { status: 404 });

    // 2. בניית הודעת הסידור בעזרת המוח של גימני
    let driverMessage = `🚛 *בוקר טוב ${driverName} אחי, זה סידור העבודה שלך:* 🚛\n`;
    driverMessage += `📅 יום: ${new Date(date).toLocaleDateString('he-IL')}\n`;
    driverMessage += `------------------------------\n\n`;

    orders.forEach((order, index) => {
      const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(order.delivery_address)}`;
      const estDuration = order.estimated_duration_mins || 45; // ברירת מחדל או מה שלמדנו
      
      driverMessage += `${index + 1}. *שעה ${order.scheduled_time.slice(0, 5)}* | ${order.customer_name}\n`;
      driverMessage += `📍 כתובת: ${order.delivery_address}\n`;
      driverMessage += `🏗️ סוג: ${order.truck_type === 'crane' ? 'מנוף' : 'פריקה ידנית'}\n`;
      
      // הזרקת היסטוריה מהלמידה של היום
      if (order.estimated_duration_mins) {
        driverMessage += `💡 *תובנת AI:* פריקה משוערת: ${estDuration} דקות (מבוסס היסטוריה).\n`;
      }
      
      driverMessage += `🚗 ניווט Waze: ${wazeUrl}\n\n`;
    });

    driverMessage += `------------------------------\n`;
    driverMessage += `*סע בזהירות אחי, ח. סבן איתך.* 🙏`;

    // 3. כתיבה ל-Firebase כדי ש-JONI ישלח לנהג בווטסאפ
    const newMessageRef = adminDb.ref('saban94/chat-sidor').push();
    await newMessageRef.set({
      text: driverMessage,
      phone: "050XXXXXXX", // כאן נכניס את הטלפון של הנהג מה-DB
      user_name: "Saban-OS System",
      timestamp: Date.now()
    });

    return NextResponse.json({ success: true, message: driverMessage });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
