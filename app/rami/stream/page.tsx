"use client";

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query } from 'firebase/database';

// הגדרות Firebase - חיבור ישיר לצינור של סבן
const firebaseConfig = {
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function SabanAppMonitor() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [status, setStatus] = useState("מתחבר...");

  useEffect(() => {
    setStatus("מחובר לצינור 🚀");

    // 1. מלשינון נכנסות - האזנה חיה
    const inRef = query(ref(db, 'rami/incoming'), limitToLast(15));
    const unsubIn = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setIncoming(list.reverse());
      }
    });

    // 2. מלשינון יוצאות - תשובות AI
    const outRef = query(ref(db, 'rami/outgoing'), limitToLast(15));
    const unsubOut = onValue(outRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setOutgoing(list.reverse());
      }
    });

    return () => {
      unsubIn();
      unsubOut();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10" dir="rtl">
      {/* Header אפליקטיבי */}
      <header className="bg-white border-b sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">Saban OS</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{status}</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            RS
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* סקטור הודעות נכנסות - עיצוב כחול בהיר */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-700">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              הודעות מהלקוח
            </h2>
            <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">LIVE</span>
          </div>

          <div className="space-y-3">
            {incoming.length > 0 ? incoming.map((msg) => (
              <div key={msg.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-blue-600">
                    {msg.from || msg.sender || "לקוח חדש"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'עכשיו'}
                  </span>
                </div>
                <p className="text-lg text-gray-800 leading-snug font-medium">
                  {msg.body || msg.text || "תוכן הודעה לא זוהה"}
                </p>
                {msg.ai_processed && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                    עובד ע"י המוח
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-10 text-gray-300 italic">מחכה להודעות בצינור...</div>
            )}
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* סקטור מענה AI - עיצוב ירוק מקצועי */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-700">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              תשובות סבן AI
            </h2>
          </div>

          <div className="space-y-3">
            {outgoing.length > 0 ? outgoing.map((msg) => (
              <div key={msg.id} className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-emerald-700 tracking-wide">נשלח אל: {msg.to}</span>
                  <span className="text-[10px] text-emerald-400">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className="text-lg text-emerald-900 leading-snug font-semibold">
                  {msg.body}
                </p>
              </div>
            )) : (
              <div className="text-center py-10 text-gray-300 italic">אין מענה AI כרגע</div>
            )}
          </div>
        </section>

      </main>

      {/* כפתור צף לפעולה מהירה */}
      <button className="fixed bottom-6 left-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-blue-700 active:scale-95 transition-all">
        +
      </button>
    </div>
  );
}
