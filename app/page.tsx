"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Send, CheckCheck, ShoppingBag, Truck, MessageCircle } from "lucide-react";

export default function SabanWhatsAppUI() {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // שמירת משתמש וסנכרון PWA
  useEffect(() => {
    if (!localStorage.getItem('saban_user_id')) {
      localStorage.setItem('saban_user_id', `user_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  // גלילה אוטומטית למטה בצ'אט
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeTab]);

  return (
    <div className="flex flex-col h-screen bg-[#ece5dd] text-right" dir="rtl">
      
      {/* Header - WhatsApp Style */}
      <header className="bg-[#075e54] text-white p-3 pt-10 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-white/20">
            <img src="/ai.png" alt="Logo" className="w-full h-full object-cover" 
                 onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Saban+AI&background=075e54&color=fff"; }} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">ח.סבן Ai</h1>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-green-100">מחובר - מוח מבצע</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 opacity-80">
          <Truck size={22} onClick={() => setActiveTab('track')} className="cursor-pointer" />
          <ShoppingBag size={22} onClick={() => setActiveTab('shop')} className="cursor-pointer" />
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#075e54] text-white flex shadow-inner">
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'chat' ? 'border-white' : 'border-transparent opacity-60'}`}>צ'אט</button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'shop' ? 'border-white' : 'border-transparent opacity-60'}`}>חנות</button>
        <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'track' ? 'border-white' : 'border-transparent opacity-60'}`}>מעקב</button>
      </nav>

      {/* Content Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "contain" }}>
        
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#dcf8c6] p-3 rounded-lg shadow-sm max-w-[85%] self-start relative">
              <p className="text-sm text-gray-800">שלום ראמי אחי! המוח של סבן מוכן לביצוע. מה נשלח היום לסטרומה?</p>
              <div className="flex justify-end items-center gap-1 mt-1">
                <span className="text-[9px] text-gray-500">08:00</span>
                <CheckCheck size={14} className="text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                   <img src="/ai.png" className="w-10 opacity-20" />
                </div>
                <h3 className="font-bold text-xs">מוצר {i}</h3>
                <button className="w-full bg-[#25d366] text-white py-2 rounded-lg text-[10px] mt-2 font-bold shadow-sm">הוסף לסל</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl border-r-4 border-r-[#25d366] shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[#075e54]">הזמנה פעילה</span>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">בדרך לאתר</span>
              </div>
              <h4 className="font-bold text-sm">סטרומה 4 | 550 בלוקים</h4>
              <p className="text-[11px] text-gray-500 mt-1 italic">נהג: עלי (משאית מנוף)</p>
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      {activeTab === 'chat' && (
        <footer className="p-3 bg-[#f0f0f0] flex items-center gap-2 pb-8">
          <div className="flex-1 bg-white rounded-full px-4 py-3 shadow-md flex items-center">
            <input 
              type="text" 
              placeholder="כתוב הודעה למוח..." 
              className="flex-1 outline-none text-sm bg-transparent"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button className="bg-[#075e54] text-white p-3 rounded-full shadow-lg hover:bg-[#128c7e] transition-all">
            <Send size={22} className="mr-1" />
          </button>
        </footer>
      )}
    </div>
  );
}
