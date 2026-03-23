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
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState("מתחבר...");

  useEffect(() => {
    setStatus("חי בצינור 🚀");

    const inRef = query(ref(db, 'rami/incoming'), limitToLast(20));
    
    const unsub = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // הפיכת המבנה השטוח של JONI לרשימה קריאה
        const list = Object.entries(data)
          .map(([key, value]: any) => {
            // אם המפתח הוא 'body', זה הטקסט של ההודעה
            if (key === 'body') return { type: 'msg', text: value, id: key };
            // אם זה הליסנר או משהו אחר, נתעלם או נציג כסטטוס
            if (key === '__listener') return null;
            // לכל מקרה אחר ש-JONI ישלח
            return { type: 'info', text: typeof value === 'string' ? value : JSON.stringify(value), id: key };
          })
          .filter(item => item !== null);
        
        setMessages(list.reverse());
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10" dir="rtl">
      {/* Header יוקרתי */}
      <header className="bg-white border-b sticky top-0 z-10 p-5 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-blue-600 italic tracking-tighter">SABAN OS</h1>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{status}</p>
        </div>
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg transform -rotate-3">
          RS
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 mt-2">
        
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xl font-bold text-gray-800">הזרם הנכנס</h2>
          <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">ONLINE</span>
        </div>

        <div className="space-y-4">
          {messages.length > 0 ? messages.map((msg, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                  הודעה חדשה
                </span>
                <span className="text-[10px] text-gray-300 font-bold">עכשיו</span>
              </div>
              
              <p className="text-2xl font-bold text-gray-800 leading-tight">
                {msg.text}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">נקלט במוח של סבן</span>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 opacity-20 font-black text-3xl italic">NO DATA</div>
          )}
        </div>

        {/* באנר תחתון - מוכן למענה AI */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 mt-10">
          <h3 className="text-lg font-black mb-1 italic underline decoration-blue-300">SABAN AI READY</h3>
          <p className="text-sm opacity-90 leading-tight">המלשינון מאזין ומחכה לפקודות הזרקה מ-Vercel.</p>
        </div>

      </main>
    </div>
  );
}
