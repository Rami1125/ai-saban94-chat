"use client";
import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query } from 'firebase/database';

// הגדרות קליינט - אלו לא סודיות, הן מאפשרות לדפדפן "להאזין" לצינור
const firebaseConfig = {
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app"
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getDatabase();

export default function StreamMonitorPage() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);

  useEffect(() => {
    // 1. האזנה חיה להודעות נכנסות (תחת rami/incoming כפי שהגדרת ב-JONI)
    const inRef = query(ref(db, 'rami/incoming'), limitToLast(10));
    const unsubscribeIn = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIncoming(Object.values(data).reverse());
      }
    });

    // 2. האזנה חיה לתשובות המוח (תחת rami/outgoing)
    const outRef = query(ref(db, 'rami/outgoing'), limitToLast(10));
    const unsubscribeOut = onValue(outRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOutgoing(Object.values(data).reverse());
      }
    });

    return () => {
      unsubscribeIn();
      unsubscribeOut();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b141a] text-white p-8 font-sans" dir="rtl">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">🚀 Saban-OS: ניטור צינור JONI (Live)</h1>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-emerald-500 font-mono">LIVE CONNECTION</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* הודעות נכנסות */}
        <div className="bg-[#111b21] rounded-xl p-4 border border-blue-500/20 shadow-2xl">
          <h2 className="text-blue-400 font-bold mb-4 flex items-center gap-2 italic">📩 מהלקוח (Incoming)</h2>
          <div className="space-y-3 h-[500px] overflow-y-auto pr-2">
            {incoming.length > 0 ? incoming.map((msg: any, i: number) => (
              <div key={i} className="p-3 bg-[#202c33] rounded-lg border-r-4 border-blue-500 animate-in fade-in slide-in-from-right-4 duration-500">
                <p className="opacity-50 text-[10px] mb-1">מספר: {msg.from} | {new Date(msg.timestamp).toLocaleTimeString()}</p>
                <p className="text-sm leading-relaxed">{msg.body}</p>
              </div>
            )) : <p className="text-xs opacity-30 italic text-center mt-10">ממתין להודעות מ-JONI...</p>}
          </div>
        </div>

        {/* תשובות AI */}
        <div className="bg-[#111b21] rounded-xl p-4 border border-emerald-500/20 shadow-2xl">
          <h2 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 italic">🤖 מענה סבן AI (Outgoing)</h2>
          <div className="space-y-3 h-[500px] overflow-y-auto pr-2">
            {outgoing.length > 0 ? outgoing.map((msg: any, i: number) => (
              <div key={i} className="p-3 bg-[#005c4b] rounded-lg border-r-4 border-emerald-400 animate-in fade-in slide-in-from-left-4 duration-500">
                <p className="opacity-70 text-[10px] mb-1">אל: {msg.to} | {new Date(msg.timestamp).toLocaleTimeString()}</p>
                <p className="text-sm leading-relaxed">{msg.body}</p>
              </div>
            )) : <p className="text-xs opacity-30 italic text-center mt-10">המנוע ממתין לעיבוד...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
