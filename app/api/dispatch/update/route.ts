import { NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { orderId, status, type } = await req.json();
    const supabase = getSupabase();

    // 1. שליפת נתוני אמת מה-Supabase
    const { data: order, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // 2. עיצוב ההודעה (ללא מגע אדם - AI Style)
    let message = "";
    if (type === "CLIENT_UPDATE") {
      message = `🏗️ *ח. סבן 1994 - עדכון אספקה* 🏗️\n\n` +
                `*${order.customer_name}* אחי,\n` +
                `הנה עדכון על האספקה ל*${order.project_name || 'האתר'}*:\n\n` +
                `🚚 סטטוס: *${translateStatus(status)}*\n` +
                `🚛 נהג: ${order.driver_name}\n` +
                `📍 כתובת: ${order.delivery_address}\n` +
                `🕒 צפי הגעה: ${order.scheduled_time?.slice(0, 5) || '--:--'}\n\n` +
                `*Saban-AI: המנוף בדרך אליך.*`;
    } else if (type === "CHANNEL_POST") {
      message = `📢 *עדכון סידור חי - ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}* 📢\n` +
                `------------------------------\n` +
                `✅ יעד: *${order.customer_name}*\n` +
                `🚛 נהג: ${order.driver_name}\n` +
                `📍 כתובת: ${order.delivery_address}\n` +
                `🏁 מצב: *${translateStatus(status)}*`;
    }

    // 3. כתיבה ל-Firebase (כאן JONI רואה את זה)
    // הנתיב: saban94/chat-sidor
    const newMessageRef = adminDb.ref('saban94/chat-sidor').push();
    await newMessageRef.set({
      text: message,
      phone: order.phone_number, // הטלפון של הלקוח לשליחה פרטית
      user_name: "Saban-OS System",
      timestamp: Date.now(),
      is_automated: true
    });

    return NextResponse.json({ success: true, messageId: newMessageRef.key });
  } catch (err) {
    console.error("Firebase Update Error:", err);
    return NextResponse.json({ error: 'Failed to send to WhatsApp' }, { status: 500 });
  }
}

function translateStatus(s: string) {
  const map: any = { 
    pending: "ממתין", 
    loaded: "הועמס", 
    in_transit: "בדרך אליך", 
    unloading: "בפריקה 🏗️", 
    completed: "בוצע בהצלחה ✅" 
  };
  return map[s] || s;
}
