import { NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    // 1. קבלת נתונים מהבקשה (מהכפתור ב-Admin)
    const body = await req.json();
    const { driverName, date } = body;

    if (!driverName || !date) {
      return NextResponse.json({ error: 'Missing driverName or date' }, { status: 400 });
    }

    // 2. בדיקת חיבור ל-Firebase (מניעת קריסת 503)
    if (!adminDb) {
      console.error("Firebase Admin DB not initialized");
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    // 3. שליפת ההזמנות של הנהג מה-Supabase
    const supabase = getSupabase();
    const { data: orders, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('driver_name', driverName)
      .eq('scheduled_date', date)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'No orders for this driver' }, { status: 404 });
    }

    // 4. בניית הודעת הסידור לווטסאפ (מעוצבת בסגנון ח. סבן)
    let message = `🚛 *בוקר טוב ${driverName}, זה סידור העבודה:* 🚛\n`;
    message += `📅 יום: ${new Date(date).toLocaleDateString('he-IL')}\n`;
    message += `------------------------------\n\n`;

    orders.forEach((order, index) => {
      const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(order.delivery_address)}`;
      message += `${index + 1}. *שעה ${order.scheduled_time.slice(0, 5)}* | ${order.customer_name}\n`;
      message += `📍 יעד: ${order.delivery_address}\n`;
      if (order.estimated_duration_mins) {
        message += `💡 זמן פריקה משוער: ${order.estimated_duration_mins} דק'\n`;
      }
      message += `🚗 ניווט Waze: ${wazeUrl}\n\n`;
    });

    message += `------------------------------\n`;
    message += `*סע בזהירות אחי, ח. סבן איתך!* 🙏`;

    // 5. הזרקה לצינור של JONI ב-Firebase
    // אנחנו משתמשים במספר הטלפון של ההזמנה הראשונה בלו"ז
    const driverPhone = orders[0].phone_number ? orders[0].phone_number.replace(/\D/g, '') : null;
    
    // המרה לפורמט בינלאומי אם חסר (לישראל)
    const formattedPhone = driverPhone?.startsWith('0') ? '972' + driverPhone.substring(1) : driverPhone;

    const newMessageRef = adminDb.ref('whatsapp_queue').push();
    await newMessageRef.set({
      to: formattedPhone, // מספר הטלפון של הנהג
      message: message,    // הודעת הלו"ז המלאה
      status: "pending",   // JONI יזהה את זה וישלח
      timestamp: Date.now(),
      driver_name: driverName,
      is_automated: true
    });

    // 6. עדכון סטטוס ב-Supabase שהלו"ז נשלח (אופציונלי)
    await supabase
      .from('dispatch_orders')
      .update({ status: 'in_transit' })
      .eq('driver_name', driverName)
      .eq('scheduled_date', date);

    return NextResponse.json({ success: true, phone: formattedPhone });
  } catch (err: any) {
    console.error("Brief API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
