import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin not connected" }, { status: 500 });
    }

    console.log("🦾 המלשינון של סבן OS התחיל לעבוד...");

    // מאזין להודעות נכנסות בנתיב המדויק
    adminDb.ref('rami/incoming').on('child_added', async (snapshot) => {
      const data = snapshot.val();
      
      // מניעת כפילויות ועיבוד רק של הודעות חדשות
      if (!data || data.ai_processed === true || data.ai_processed === "processing") return;

      const messageId = snapshot.key;
      const userMessage = data.body;
      const senderNumber = data.from;

      console.log(`📩 הודעה חדשה מ-${senderNumber}: ${userMessage}`);

      try {
        // 1. סימון התחלת עיבוד כדי שלא ירוץ פעמיים
        await snapshot.ref.update({ ai_processed: "processing" });

        // 2. פנייה למוח ה-AI (וודא שה-URL תקין ב-Vercel שלך)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-saban94-chat.vercel.app';
        const brainRes = await fetch(`${baseUrl}/api/pro_brain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: userMessage, 
            userName: data.pushName || "לקוח",
            senderId: senderNumber 
          })
        });

        const brainData = await brainRes.json();
        const aiAnswer = brainData.answer || "סליחה אחי, המוח רגע בהפסקה. נסה שוב?";

        // 3. הזרקת תשובה מלאה לצינור ה-Outgoing (המבנה שהמוניטור והווצאפ צריכים)
        const outgoingRef = adminDb.ref('rami/outgoing').push();
        await outgoingRef.set({
          body: aiAnswer,
          to: senderNumber,
          from_me: "Saban AI",
          timestamp: Date.now(),
          status: "pending" // הפקודה ל-JONI לשלוח
        });

        // 4. סימון סופי שההודעה טופלה
        await snapshot.ref.update({ ai_processed: true });
        console.log(`✅ תשובה נשלחה בהצלחה ל-${senderNumber}`);

      } catch (err: any) {
        console.error("❌ שגיאה בעיבוד המלשינון:", err.message);
        await snapshot.ref.update({ ai_processed: "error" });
      }
    });

    return NextResponse.json({ 
      status: "Saban Listener is ONLINE",
      listening_to: "rami/incoming",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
