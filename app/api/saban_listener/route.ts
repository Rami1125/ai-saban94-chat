import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

// מאלץ את Next.js לא לעשות Cache ל-API הזה
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin not connected" }, { status: 500 });
    }

    console.log("🦾 המלשינון של סבן OS התחיל לעבוד...");

    // הפעלת המאזין לצינור
    adminDb.ref('rami/incoming').on('child_added', async (snapshot) => {
      const data = snapshot.val();
      if (!data || data.ai_processed) return;

      // סימון זמני כדי לראות שזה עובד
      await snapshot.ref.update({ ai_processed: "processing" });
      
      console.log("📩 הודעה נקלטה במלשינון!");
      // כאן יבוא המשך הלוגיקה של ה-AI
    });

    return NextResponse.json({ 
      status: "Saban Listener is ONLINE",
      path: "rami/incoming",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
