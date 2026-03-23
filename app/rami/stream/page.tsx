"use client";
import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query } from 'firebase/database';

// הגדרות קליינט - אלו לא סודיות
const firebaseConfig = {
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app"
};

// אתחול בטוח
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function StreamMonitorPage() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);

  useEffect(() => {
    // 1. האזנה חיה להודעות נכנסות
    const inRef = query(ref(db, 'rami/incoming'), limitToLast(10));
    const unsubscribeIn = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // הפיכה למערך וסינון הודעות ריקות
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setIncoming(list.reverse());
      }
    });

    // 2. האזנה חיה לתשובות המוח
    const outRef = query(ref(db, 'rami/outgoing'), limitToLast(10));
    const unsubscribeOut = onValue(outRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setOutgoing(list.reverse());
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
        <h1 className="text-2xl font-bold italic tracking-tight">🚀 Saban-OS: ניטור צינור JONI</h1>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Live Connection</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* טור נכנס */}
        <div className="bg-[#111b21] rounded-2xl p-5 border border-blue-500/10 shadow-2xl">
          <h2 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">📩</span> הודעות נכנסות
          </h2>
          <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {incoming.length > 0 ? incoming.map((msg) => (
              <div key={msg.id} className="p-4 bg-[#202c33] rounded-xl border-r-4 border-blue-500 transition-all hover:bg-[#2a3942]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-400 text-[10px] font-mono font-bold">{msg.from || 'Unknown'}</span>
                  <span className="opacity-30 text-[9px]">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{msg.body}</p>
              </div>
            )) : (
              <div className="h-full flex items-center justify-center opacity-20 italic text-sm">ממתין לתנועה בצינור...</div>
            )}
          </div>
        </div>

        {/* טור יוצא */}
        <div className="bg-[#111b21] rounded-2xl p-5 border border-emerald-500/10 shadow-2xl">
          <h2 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">🤖</span> מענה סבן AI
          </h2>
          <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {outgoing.length > 0 ? outgoing.map((msg) => (
              <div key={msg.id} className="p-4 bg-[#005c4b] rounded-xl border-r-4 border-emerald-400 transition-all hover:bg-[#026c58]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-emerald-300 text-[10px] font-mono font-bold">To: {msg.to || 'Client'}</span>
                  <span className="opacity-50 text-[9px]">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
                </div>
                <p className="text-sm text-white leading-relaxed">{msg.body}</p>
              </div>
            )) : (
              <div className="h-full flex items-center justify-center opacity-20 italic text-sm">אין מענה AI כרגע...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
