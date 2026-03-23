import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
  }

  console.log("🦾 Saban-OS: Starting WhatsApp Stream Listener...");

  // מאזין להודעות חדשות שנכנסות מ-JONI
  adminDb.ref('incoming').on('child_added', async (snapshot) => {
    const data = snapshot.val();
    
    // מניעת כפילויות וטיפול רק בהודעות שלא עובדו
    if (!data || data.ai_processed) return;

    try {
      // 1. קריאה למוח המרכזי של סבן (החלף ב-URL המלא שלך ב-Vercel)
      const brainUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/pro_brain`;
      
      const brainRes = await fetch(brainUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: data.body, 
          userName: data.pushName || "לקוח",
          senderId: data.from 
        })
      });

      const { answer } = await brainRes.json();

      // 2. הזרקת התשובה לצינור ה-Outgoing של JONI
      await adminDb.ref('outgoing').push({
        to: data.from,
        body: answer,
        timestamp: Date.now(),
        status: 'pending'
      });

      // 3. סימון הודעה כטופלה
      await snapshot.ref.update({ ai_processed: true });
      console.log(`✅ AI Replied to ${data.from}`);

    } catch (err) {
      console.error("❌ Stream Processing Error:", err);
    }
  });

  return NextResponse.json({ status: "Stream Listener Active" });
}
