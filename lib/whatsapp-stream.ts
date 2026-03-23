// lib/whatsapp-stream.ts
import { adminDb } from "@/lib/firebaseAdmin";

export function initializeWhatsAppBrain() {
  console.log("🦾 המוח של סבן מאזין לצינור הווצאפ...");

  // 1. האזנה להודעות נכנסות מ-JONI
  const incomingRef = adminDb.ref('incoming');
  
  incomingRef.on('child_added', async (snapshot) => {
    const data = snapshot.val();
    
    // הגנה: שלא יענה לעצמו או להודעות שכבר טופלו
    if (!data || data.processed) return;

    console.log(`📩 הודעה חדשה בצינור: ${data.body} מ-${data.from}`);

    try {
      // 2. פנייה ל-API המוח המרכזי שבנינו (pro_brain)
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pro_brain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: data.body, 
          userName: data.pushName || "לקוח",
          senderId: data.from,
          source: 'whatsapp'
        }),
      });

      const result = await response.json();

      if (result.answer) {
        // 3. הזרקת התשובה לצינור ה-Outgoing של JONI
        await adminDb.ref('outgoing').push({
          to: data.from,
          body: result.answer,
          timestamp: Date.now(),
          status: 'pending' // התוסף יזהה 'pending' וישלח לווצאפ
        });

        // 4. סימון ההודעה כ"טופלה" כדי שלא ייווצר לופ
        await snapshot.ref.update({ processed: true });
        console.log(`✅ תשובה הוזרקה לצינור עבור: ${data.from}`);
      }
    } catch (error) {
      console.error("❌ כשל בהזרקת תשובה לצינור:", error);
    }
  });
}
