import { NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";
import { adminDb } from "@/lib/firebaseAdmin"; // וודא שיש לך הגדרת Firebase Admin

export async function POST(req: Request) {
  const { orderId, status, type } = await req.json();
  const supabase = getSupabase();

  // 1. שליפת נתוני ההזמנה המלאים מהסידור
  const { data: order } = await supabase
    .from('dispatch_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // 2. ניסוח ההודעה בעזרת היגיון "ח. סבן" (כאן נכנס ה-AI בעתיד)
  let message = "";
  if (type === "CLIENT_UPDATE") {
    message = `🏗️ *ח. סבן 1994 - עדכון אספקה* 🏗️\n\n${order.customer_name} אחי,\nהעדכון האחרון להזמנה שלך (${order.project_name}):\n🚚 סטטוס: *${translateStatus(status)}*\n🚛 מוביל: ${order.driver_name}\n📍 יעד: ${order.delivery_address}\n\n*נמשיך לעדכן ברגע שהמנוף יתחיל בפריקה!*`;
  } else if (type === "CHANNEL_POST") {
    message = `📢 *עדכון סידור עבודה - ${new Date().toLocaleDateString('he-IL')}* 📢\n------------------------------\n👤 נהג: ${order.driver_name}\n✅ יעד: ${order.customer_name} (${order.delivery_address})\n🏁 סטטוס: *${translateStatus(status)}*`;
  }

  // 3. כתיבה ל-Firebase RTDB (היכן ש-JONI מאזין)
  const chatRef = adminDb.ref('saban94/chat-sidor').push();
  await chatRef.set({
    text: message,
    phone: order.phone_number, // עבור הודעה ללקוח
    isChannel: type === "CHANNEL_POST",
    timestamp: Date.now(),
    status: 'pending'
  });

  return NextResponse.json({ success: true });
}

function translateStatus(s: string) {
  const map: any = { loaded: "הועמס", in_transit: "בדרך", unloading: "בפריקה", completed: "הסתיים" };
  return map[s] || s;
}
