import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

/**
 * המלשינון של סבן: מאזין לצינור ומפעיל את ה-AI
 */

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: "חיבור ל-Firebase נכשל" }, { status: 500 });
  }

  console.log("🦾 המלשינון של סבן OS התחיל לעבוד...");

  // האזנה להודעות חדשות בנתיב המדויק של JONI
  adminDb.ref('rami/incoming').on('child_added', async (snapshot) => {
    const data = snapshot.val();
    
    // בדיקה שההודעה לא עובדה כבר (המלשינון לא עובד פעמיים)
    if (!data || data.ai_processed) return;

    const messageId = snapshot.key;
    const userMessage = data.body;
    const senderNumber = data.from;

    console.log(`📩 הודעה חדשה מ-${senderNumber}: ${userMessage}`);

    try {
      // 1. קריאה למוח המרכזי (Pro Brain) לקבלת תשובה מה-AI
      // וודא שכתובת ה-URL תואמת לסביבת העבודה שלך (Vercel או Local)
      const brainResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pro_brain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage, 
          userName: data.pushName || "לקוח",
          senderId: senderNumber 
        })
      });

      const { answer } = await brainResponse.json();

      // 2. הזרקה לצינור ה-Outgoing (המבנה ש-JONI אוהב)
      const outgoingRef = adminDb.ref('rami/outgoing').push();
      await outgoingRef.set({
        body: answer,
        to: senderNumber,
        status: "pending", // JONI מחפש את הסטטוס הזה כדי לשלוח
        timestamp: Date.now()
      });

      // 3. עדכון ה"מלשינון" שההודעה טופלה בהצלחה
      await adminDb.ref(`rami/incoming/${messageId}`).update({
        ai_processed: true
      });

      console.log(`✅ תשובה נשלחה ל-${senderNumber}`);

    } catch (error) {
      console.error("❌ תקלה בתהליך המלשינון:", error);
    }
  });

  return NextResponse.json({ status: "Saban Listener is ONLINE" });
}
