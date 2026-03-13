import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // טיפול אגרסיבי יותר בתווי ירידת שורה
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`
      });
      console.log("✅ Saban-OS: Firebase Admin מחובר בהצלחה");
    } else {
      console.error("❌ חסרים משתני סביבה ל-Firebase - לכן קיבלת 503");
    }
  } catch (error: any) {
    console.error("❌ שגיאת אתחול Firebase:", error.message);
  }
}

export const adminDb = admin.apps.length ? admin.database() : null;
