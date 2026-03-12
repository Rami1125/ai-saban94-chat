import { NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { driverName, date } = await req.json();
    if (!driverName || !date) {
      return NextResponse.json({ error: 'Missing driverName or date' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Database not initialized' }, { status: 503 });
    }

    const supabase = getSupabase();
    const { data: orders, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('driver_name', driverName)
      .eq('scheduled_date', date)
      .order('scheduled_time', { ascending: true });

    if (error || !orders || orders.length === 0) {
      return NextResponse.json({ error: 'No orders found for this driver' }, { status: 404 });
    }

    // בניית הודעת הסידור
    let driverMessage = `🚛 *בוקר טוב ${driverName} אחי, זה סידור העבודה שלך:* 🚛\n`;
    driverMessage += `📅 יום: ${new Date(date).toLocaleDateString('he-IL')}\n`;
    driverMessage += `------------------------------\n\n`;

    orders.forEach((order, index) => {
      const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(order.delivery_address)}`;
      driverMessage += `${index + 1}. *שעה ${order.scheduled_time.slice(0, 5)}* | ${order.customer_name}\n`;
      driverMessage += `📍 כתובת: ${order.delivery_address}\n`;
      driverMessage += `📞 טלפון: ${order.phone_number}\n`;
      if (order.estimated_duration_mins) {
        driverMessage += `💡 פריקה משוערת: ${order.estimated_duration_mins} דקות\n`;
      }
      driverMessage += `🚗 ניווט: ${wazeUrl}\n\n`;
    });

    driverMessage += `------------------------------\n`;
    driverMessage += `*סע בזהירות, ח. סבן איתך.* 🙏`;

    // שליחה לצינור של JONI (Firebase)
    const newMessageRef = adminDb.ref('saban94/chat-sidor').push();
    await newMessageRef.set({
      text: driverMessage,
      phone: "0500000000", // כאן המערכת תשלח לנהג עצמו בעתיד
      timestamp: Date.now(),
      is_automated: true
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Driver Brief Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
