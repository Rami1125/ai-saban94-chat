import { NextResponse } from 'next/server';
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    // נתוני הבדיקה עבור בר אורן
    const customerPhone = "972508860896";
    const customerName = "בר אורן / אורניל";
    const address = "סטרומה 4, הרצליה";
    const time = "07:00";

    // בניית הודעה יוקרתית ללקוח
    const message = `👋 *שלום רב ללקוח: ${customerName}*\n\n` +
                    `שמחים לעדכן שההזמנה שלך ב-ח. סבן לוגיסטיקה אושרה!\n` +
                    `📍 *יעד:* ${address}\n` +
                    `⏰ *שעת הגעה מתוכננת:* ${time}\n` +
                    `🏗️ *נהג המנוף:* חכמת\n\n` +
                    `נציגנו יעדכן אותך ברגע שהפריקה מתחילה בשטח.\n` +
                    `*ח. סבן - עוצמה של שירות* 🚛`;

    // הזרקה לצינור JONI בנתיב שנתת
    if (!adminDb) throw new Error("Firebase Admin not initialized");

    const newMessageRef = adminDb.ref('saban94/chat-sidor').push();
    await newMessageRef.set({
      to: customerPhone,
      message: message,
      status: "pending",
      timestamp: Date.now(),
      recipient_type: "customer",
      customer_name: customerName
    });

    console.log(`✅ הודעת בדיקה הוזרקה לצינור עבור הלקוח: ${customerName}`);
    
    return NextResponse.json({ 
      success: true, 
      msg: "הודעת לקוח נשלחה לצינור",
      recipient: customerPhone 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
