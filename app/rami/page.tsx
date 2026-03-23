"use client";

import React, { useEffect, useState, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query, set, push } from 'firebase/database';

// קונפיגורציה
const firebaseConfig = { databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app" };
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function SabanCommandCenter() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [isAiActive, setIsAiActive] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>("ח. סבן הזמנות");
  
  // לינק תמונה שביקשת (ניתן להחליף ב-State אם תרצה להדביק דינמית)
  const userImageUrl = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"; 

  // אודיו להתראות
  const playNotification = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audio.play().catch(() => {});
  };

  useEffect(() => {
    // חיבור ל-OneSignal (בהנחה שהגדרת ב-Layout/Head)
    if (typeof window !== 'undefined' && (window as any).OneSignal) {
      (window as any).OneSignal.push(() => {
        (window as any).OneSignal.init({ appId: "YOUR_ONESIGNAL_APP_ID" });
      });
    }

    // מאזין להודעות נכנסות
    const inRef = query(ref(db, 'rami/incoming'), limitToLast(20));
    const unsubIn = onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(i => i.id !== '__listener');
        setIncoming(list.reverse());
        playNotification();
      }
    });

    // מאזין לתשובות AI
    const outRef = query(ref(db, 'rami/outgoing'), limitToLast(10));
    const unsubOut = onValue(outRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setOutgoing(list.reverse());
      }
    });

    return () => { unsubIn(); unsubOut(); };
  }, []);

  const getCleanText = (msg: any) => {
    if (typeof msg.body === 'string') return msg.body;
    if (typeof msg.body === 'object') return Object.values(msg.body).join('');
    return "הודעה התקבלה 📋";
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#111b21] font-sans overflow-hidden flex flex-col" dir="rtl">
      
      {/* Navbar Mobile עם המבורגר */}
      <nav className="bg-[#00a884] p-4 text-white shadow-md flex justify-between items-center z-50">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 outline-none">
          <div className="w-6 h-0.5 bg-white mb-1.5 transition-all"></div>
          <div className="w-6 h-0.5 bg-white mb-1.5"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
        <h1 className="text-xl font-bold tracking-tight italic">SABAN COMMAND</h1>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isAiActive ? 'bg-emerald-300 animate-pulse' : 'bg-red-400'}`}></div>
          <img src={userImageUrl} className="w-9 h-9 rounded-full border-2 border-white shadow-sm" alt="User" />
        </div>
      </nav>

      {/* תפריט צד (Layered Menu) */}
      <div className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}>
        <aside className={`absolute right-0 top-0 h-full bg-white w-72 shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="p-6 bg-[#00a884] text-white">
            <h3 className="font-black text-2xl mb-1">Saban OS</h3>
            <p className="text-xs opacity-80 italic underline">מחובר לקבוצת ח. סבן</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-sm">מענה AI אוטומטי</span>
              <button onClick={() => setIsAiActive(!isAiActive)} className={`w-12 h-6 rounded-full transition-colors relative ${isAiActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAiActive ? 'left-1' : 'left-7'}`}></div>
              </button>
            </div>
            <button className="w-full text-right p-3 hover:bg-gray-100 rounded-lg font-bold text-blue-600">📂 גוגל דרייב - מסמכים</button>
            <button className="w-full text-right p-3 hover:bg-gray-100 rounded-lg font-bold text-emerald-600">📊 טבלת הזמנות ח. סבן</button>
            <button className="w-full text-right p-3 hover:bg-gray-100 rounded-lg font-bold text-red-500">🧹 ניקוי צינור JONI</button>
          </div>
        </aside>
      </div>

      {/* תוכן ראשי - בסגנון צ'אט */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full pb-24">
        
        {/* הודעות נכנסות (המלשינון) */}
        <div className="space-y-3">
          <div className="text-center my-4"><span className="bg-white/80 px-4 py-1 rounded-lg text-[10px] font-bold text-gray-400 shadow-sm uppercase tracking-widest">Live Updates</span></div>
          
          {incoming.map((msg) => (
            <div key={msg.id} className="flex flex-col items-start animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-white p-4 rounded-2xl rounded-tr-none shadow-sm border border-gray-100 max-w-[90%] relative">
                <div className="flex justify-between items-center gap-8 mb-1">
                  <span className="text-[10px] font-black text-[#00a884] uppercase tracking-wide">
                    {msg.pushName || msg.from || "לקוח"}
                  </span>
                  <span className="text-[9px] text-gray-300 font-bold uppercase">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'LIVE'}
                  </span>
                </div>
                <p className="text-lg font-medium leading-tight text-[#111b21]">{getCleanText(msg)}</p>
                {msg.id === 'body' && <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] text-emerald-500 font-bold italic">📦 הזמנה נקלטה במאגר</div>}
              </div>
            </div>
          ))}
        </div>

        {/* הודעות יוצאות (תשובות סבן) */}
        <div className="space-y-3">
          {outgoing.map((msg) => (
            <div key={msg.id} className="flex flex-col items-end animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="bg-[#dcf8c6] p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[90%]">
                <div className="flex justify-between items-center gap-8 mb-1">
                  <span className="text-[10px] font-black text-emerald-700 uppercase">Saban AI (מגיב ל- {msg.to})</span>
                  <span className="text-[9px] text-emerald-500">✔✔</span>
                </div>
                <p className="text-lg font-bold leading-tight text-[#111b21] italic">{msg.body}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button - אימון המוח */}
      <button className="fixed bottom-6 right-6 w-16 h-16 bg-[#00a884] text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white">
        🧠
      </button>

      <style jsx global>{`
        body { background: #E5DDD5; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #00a884; border-radius: 10px; }
      `}</style>
    </div>
  );
}
