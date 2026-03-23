import admin from 'firebase-admin';

/**
 * Saban-OS: Firebase Admin Connection
 * חיבור מאובטח ל-Realtime Database עבור הצינור של JONI
 */

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const databaseURL = process.env.FIREBASE_DATABASE_URL;

    if (projectId && clientEmail && privateKey && databaseURL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL
      });
      console.log("✅ Saban-OS: Firebase Admin Connected");
    }
  } catch (error: any) {
    console.error("❌ Firebase Init Error:", error.message);
  }
}

export const adminDb = admin.apps.length ? admin.database() : null;
