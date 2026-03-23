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
        const list = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(item => item.id !== '__listener');
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

    return () => { unsubIn(); unsubOut(); };
  }, []);

  // מפענח הודעות אוניברסלי - מוצא טקסט בכל מקום ב-JSON
  const smartParse = (msg: any) => {
    if (!msg) return "הודעה ריקה";

    // 1. אם יש שדה body/text/message ישיר
    const simpleText = msg.body || msg.text || msg.message || msg.content;
    if (typeof simpleText === 'string') return simpleText;
    if (typeof simpleText === 'object' && simpleText !== null) return Object.values(simpleText).join('');

    // 2. סריקה עמוקה של כל השדות באובייקט
    const allValues = Object.values(msg);
    for (let val of allValues) {
      if (typeof val === 'string' && val.length > 1 && !val.includes('http') && val !== msg.id) {
        return val;
      }
      if (typeof val === 'object' && val !== null) {
        const joined = Object.values(val).join('');
        if (joined.length > 0 && joined !== msg.id) return joined;
      }
    }

    return "ממתין לתוכן...";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10" dir="rtl">
      {/* Header סגנון אפליקציית ניהול */}
      <header className="bg-white border-b sticky top-0 z-10 p-5 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-blue-600 tracking-tighter italic">SABAN OS</span>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              {status}
            </span>
          </div>
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg transform rotate-3">
            RS
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-8 mt-4">
        
        {/* הודעות נכנסות */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">נכנסות</h2>
            <div className="h-px flex-1 bg-gray-200 mx-4"></div>
            <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-md uppercase">Live Stream</span>
          </div>

          <div className="space-y-4">
            {incoming.length > 0 ? incoming.map((msg) => (
              <div key={msg.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-blue-500 px-3 py-1 bg-blue-50 rounded-full">
                    {msg.from || msg.sender || "לקוח"}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'עכשיו'}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-800 leading-[1.2]">
                  {smartParse(msg)}
                </p>
              </div>
            )) : (
              <div className="text-center py-20 opacity-20 font-black text-2xl italic">NO DATA</div>
            )}
          </div>
        </section>

        {/* הודעות יוצאות */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-black text-gray-800 tracking-tight text-opacity-50">תשובות AI</h2>
            <div className="h-px flex-1 bg-gray-100 mx-4"></div>
          </div>

          <div className="space-y-4 opacity-90">
            {outgoing.length > 0 ? outgoing.map((msg) => (
              <div key={msg.id} className="bg-emerald-600 p-6 rounded-[2rem] shadow-xl shadow-emerald-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">AL: {msg.to}</span>
                  <span className="text-[10px] font-bold text-emerald-200">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className="text-lg font-bold text-white leading-tight italic">
                  {msg.body}
                </p>
              </div>
            )) : (
              <div className="text-center py-10 opacity-20 font-bold italic">WAITING...</div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
