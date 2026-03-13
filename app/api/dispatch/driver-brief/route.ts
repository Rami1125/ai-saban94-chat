import { NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    // 1. קבלת נתונים מהבקשה
    const body = await req.json();
    const { driverName, date } = body;

    if (!driverName || !date) {
      return NextResponse.json({ error: 'חסר שם נהג או תאריך' }, { status: 400 });
    }

    // 2. בדיקת חיבור ל-Firebase (הגנה מפני קריסה)
    if (!adminDb) {
      console.error("Firebase Admin DB not initialized");
      return NextResponse.json({ error: 'חיבור ל-Firebase נכשל' }, { status: 503 });
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
      return NextResponse.json({ error: 'לא נמצאו הזמנות לנהג זה' }, { status: 404 });
    }

    // 4. בניית הודעת הסידור לווטסאפ
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

    // 5. חילוץ מספר הטלפון ופורמט ל-JONI
    const rawPhone = orders[0].phone_number ? orders[0].phone_number.replace(/\D/g, '') : '';
    const formattedPhone = rawPhone.startsWith('0') ? '972' + rawPhone.substring(1) : rawPhone;

    // 6. הזרקה לצינור Realtime Database של סבן
    // הנתיב הוגדר לפי צילום המסך שלך: saban94/chat-sidor
    const newMessageRef = adminDb.ref('saban94/chat-sidor').push();
    await newMessageRef.set({
      to: formattedPhone,      // המספר של חכמת
      message: message,         // תוכן ההודעה המעוצב
      status: "pending",        // סטטוס ש-JONI מחפש
      timestamp: Date.now(),
      driver_name: driverName,
      source: "Saban-OS AI"
    });

    return NextResponse.json({ 
      success: true, 
      sentTo: formattedPhone,
      path: "saban94/chat-sidor"
    });

  } catch (err: any) {
    console.error("Brief API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
