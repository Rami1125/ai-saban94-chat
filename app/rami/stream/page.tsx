"use client";

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query } from 'firebase/database';

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

    const inRef = query(ref(db, 'rami/incoming'), limitToLast(15));
    const unsubIn = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setIncoming(list.reverse());
      }
    });

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

  // פונקציה חכמה לחילוץ טקסט מכל שדה אפשרי
  const getMessageText = (msg: any) => {
    if (msg.body) return msg.body;
    if (msg.text) return msg.text;
    if (msg.message) return msg.message;
    if (msg.content) return msg.content;
    // אם לא מצאנו כלום, נראה את כל מה ש-JONI שלח כטקסט
    return JSON.stringify(msg);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-10 p-4 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">Saban OS</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{status}</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            RS
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-700">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              הודעות נכנסות
            </h2>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">LIVE</span>
          </div>

          <div className="space-y-3">
            {incoming.length > 0 ? incoming.map((msg) => (
              <div key={msg.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    {msg.from || msg.sender || msg.pushName || "לקוח"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'עכשיו'}
                  </span>
                </div>
                <p className="text-lg text-gray-800 leading-tight font-medium">
                  {getMessageText(msg)}
                </p>
              </div>
            )) : (
              <div className="text-center py-20 text-gray-300 italic font-medium">הצינור שקט כרגע...</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-700">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              תשובות סבן AI
            </h2>
          </div>

          <div className="space-y-3">
            {outgoing.length > 0 ? outgoing.map((msg) => (
              <div key={msg.id} className="bg-emerald-600 p-5 rounded-3xl shadow-lg shadow-emerald-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">אל: {msg.to}</span>
                  <span className="text-[10px] text-emerald-200">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className="text-lg text-white leading-tight font-bold">
                  {msg.body}
                </p>
              </div>
            )) : (
              <div className="text-center py-10 text-gray-300 italic">ממתין לתשובה ראשונה...</div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
