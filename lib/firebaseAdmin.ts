import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // טיפול בתווי ירידת שורה במפתח הפרטי כדי שגוגל יזהה אותו
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app"
      });
      console.log("✅ Saban-OS: Firebase Admin מחובר");
    } else {
      console.warn("⚠️ חסרים משתני סביבה ל-Firebase Admin");
    }
  } catch (error) {
    console.error("❌ Firebase Admin Init Error:", error);
  }
}

export const adminDb = admin.apps.length ? admin.database() : null;
