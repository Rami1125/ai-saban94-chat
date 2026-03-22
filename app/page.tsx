"use client";
import React, { useState, useEffect } from 'react';
import { MessageCircle, ShoppingBag, Truck, User, Send, CheckCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SabanWhatsAppUI() {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  
  // שמירת מזהה משתמש קבוע בקוקיז לסנכרון
  useEffect(() => {
    if (!localStorage.getItem('saban_user_id')) {
      localStorage.setItem('saban_user_id', `user_${Math.random().toString(36).substr(2, 9)}`);
    }
    // בקשת הרשאות למיקום והתראות
    if ("Notification" in window) {
      Notification.requestPermission();
    }
    navigator.geolocation.getCurrentPosition(() => {}, () => {});
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#ece5dd] font-sans" dir="rtl">
      
      {/* Header - WhatsApp Style */}
      <header className="bg-[#075e54] text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/ai.png" alt="Logo" className="w-10 h-10 rounded-full border border-white/20 bg-white p-1" />
          <div>
            <h1 className="font-bold text-lg">ח.סבן Ai</h1>
            <span className="text-xs text-green-200">מחובר - מוח מבצע פעיל</span>
          </div>
        </div>
        <div className="flex gap-4">
          <User size={22} className="opacity-80" />
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#075e54] text-white flex border-t border-white/10">
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'chat' ? 'border-white' : 'border-transparent opacity-60'}`}>צ'אט</button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'shop' ? 'border-white' : 'border-transparent opacity-60'}`}>חנות</button>
        <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'track' ? 'border-white' : 'border-transparent opacity-60'}`}>מעקב משלוחים</button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-4">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] relative self-start">
              <p className="text-sm">אהלן ראמי אחי, המוח של ח.סבן לרשותך. מה נבצע היום?</p>
              <span className="text-[10px] text-gray-500 block mt-1">07:00</span>
            </div>
            {/* כאן ירוצו הודעות הצ'אט */}
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 border-none shadow-sm flex flex-col items-center">
              <img src="/block.png" alt="בלוק" className="w-20 h-20 object-contain" />
              <h3 className="font-bold mt-2 text-sm">בלוק 20 תקני</h3>
              <button className="bg-[#25d366] text-white px-4 py-1 rounded-full text-xs mt-2 font-bold">הוסף לסל</button>
            </Card>
            {/* עוד מוצרים */}
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-3">
            <Card className="p-4 border-r-4 border-r-[#25d366] shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#075e54]">הזמנה #8812 - סטרומה 4</h3>
                <Badge className="bg-green-100 text-green-700">בדרך</Badge>
              </div>
              <p className="text-xs mt-2 text-gray-600">משאית מנוף (עלי) בדרך לפריקה. צפי: 09:00</p>
            </Card>
          </div>
        )}
      </main>

      {/* Input Area - WhatsApp Style */}
      {activeTab === 'chat' && (
        <footer className="p-2 bg-[#f0f0f0] flex items-center gap-2">
          <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-inner flex items-center border border-gray-200">
            <input 
              type="text" 
              placeholder="הקלד הודעה..." 
              className="flex-1 outline-none text-sm py-1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button className="bg-[#075e54] text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform">
            <Send size={20} />
          </button>
        </footer>
      )}
    </div>
  );
}
