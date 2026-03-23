// קוד המאזין לצינור ה-Firebase
import { adminDb } from "@/lib/firebaseAdmin";

const incomingRef = adminDb.ref('incoming');

// פונקציה שמתעוררת בכל פעם שנכנסת הודעה ל-Firebase
incomingRef.on('child_added', async (snapshot) => {
  const data = snapshot.val();
  
  // מניעת כפילויות
  if (!data || data.ai_processed) return;

  console.log(`📩 הודעה חדשה בצינור מ-${data.from}: ${data.body}`);

  // 1. שליחת השאלה למוח (Pro Brain)
  const response = await fetch('https://your-saban-os.vercel.app/api/pro_brain', {
    method: 'POST',
    body: JSON.stringify({ 
      query: data.body, 
      userName: data.pushName || "לקוח",
      senderId: data.from 
    })
  });

  const result = await response.json();

  // 2. הזרקת התשובה לתיקיית outgoing (JONI ימשוך וישלח לווצאפ)
  await adminDb.ref('outgoing').push({
    to: data.from,
    body: result.answer,
    timestamp: Date.now()
  });

  // 3. סימון שההודעה טופלה
  await snapshot.ref.update({ ai_processed: true });
});
