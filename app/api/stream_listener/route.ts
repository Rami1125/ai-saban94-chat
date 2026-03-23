// app/api/stream_listener/route.ts
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  console.log("🦾 אתחול מאזין אוטומטי לצינור...");

  adminDb.ref('incoming').on('child_added', async (snapshot) => {
    const data = snapshot.val();
    
    // מניעת כפילויות וטיפול רק בהודעות חדשות
    if (!data || data.ai_processed) return;

    try {
      // 1. קריאה למוח המרכזי (ה-API של pro_brain)
      const brainRes = await fetch(`${process.env.APP_URL}/api/pro_brain`, {
        method: 'POST',
        body: JSON.stringify({ 
          query: data.body, 
          userName: data.pushName || "לקוח",
          senderId: data.from 
        })
      });

      const { answer } = await brainRes.json();

      // 2. הזרקת התשובה לצינור ה-Outgoing (כדי ש-JONI ישלח)
      await adminDb.ref('outgoing').push({
        to: data.from,
        body: answer,
        timestamp: Date.now(),
        status: 'pending' 
      });

      // 3. סימון שההודעה טופלה בהצלחה
      await snapshot.ref.update({ ai_processed: true });

    } catch (err) {
      console.error("❌ תקלה בצינור המוח:", err);
    }
  });

  return new Response("Stream Listener Active");
}
