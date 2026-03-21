"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Menu, X, PlusCircle, RefreshCcw, UserPlus, 
  MessageSquare, Terminal, User, MapPin, Truck, Hash, Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast, Toaster } from "sonner";

export default function SabanSmartAdmin() {
  const [input, setInput] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [history, setHistory] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית לסוף הצאט
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const quickActions = [
    { label: "הזמנה חדשה", cmd: "[START_NEW_ORDER]", icon: <PlusCircle size={18}/> },
    { label: "עדכון סטטוס", cmd: "[START_STATUS_UPDATE]", icon: <RefreshCcw size={18}/> },
    { label: "העברת נהג", cmd: "[START_DRIVER_CHANGE]", icon: <UserPlus size={18}/> }
  ];

  const handleAction = (cmd: string) => {
    setInput(cmd);
    setIsMenuOpen(false);
    // שליחה אוטומטית כדי להתחיל את הדו-שיח
    setTimeout(() => sendMessage(cmd), 100);
  };

  const sendMessage = async (overrideInput?: string) => {
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim()) return;

    setHistory(prev => [...prev, { role: 'user', text: messageToSend }]);
    setInput("");
    setLoading(true);

    try {
      // כאן אנחנו שולחים ל-API של המוח
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            query: messageToSend, 
            history: history.slice(-10) // שולחים היסטוריה כדי שהמוח יזכור באיזה שלב הוא
        })
      });
      
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', text: data.aiResponse }]);
    } catch (err) {
      toast.error("שגיאת תקשורת עם המוח");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex overflow-hidden" dir="rtl">
      <Toaster position="top-left" richColors />

      {/* תפריט צד - שליטה מהירה */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 lg:static lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black italic text-blue-700">ח. סבן</h2>
            <button className="lg:hidden" onClick={() => setIsMenuOpen(false)}><X/></button>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">פעולות סידור</p>
            {quickActions.map((action) => (
              <button 
                key={action.label}
                onClick={() => handleAction(action.cmd)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all font-bold text-sm"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-2 text-green-500 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase">מוח מחובר</span>
             </div>
             <p className="text-[10px] text-slate-400 font-medium leading-tight">מערכת ניהול סידור חכמה לשליטה מכל מקום.</p>
          </div>
        </div>
      </aside>

      {/* אזור הצאט המרכזי */}
      <main className="flex-1 flex flex-col relative bg-white lg:bg-[#F8FAFC]">
        <header className="p-4 bg-white border-b border-slate-100 flex items-center justify-between lg:hidden">
            <h1 className="font-black italic text-blue-700">SabanOS</h1>
            <button onClick={() => setIsMenuOpen(true)}><Menu/></button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 pb-32">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-6 bg-blue-50 rounded-full text-blue-600 animate-pulse">
                    <Terminal size={48}/>
                </div>
                <h3 className="text-xl font-black text-slate-800 italic">אהלן ראמי, מוכן לסידור?</h3>
                <p className="text-sm text-slate-400 font-bold max-w-xs">בחר פעולה מהתפריט או פשוט כתוב לי מה אתה רוצה לבצע.</p>
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl font-bold text-sm shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
               <div className="bg-slate-100 p-3 rounded-2xl animate-pulse">
                  <Loader2 className="animate-spin text-blue-600" size={20}/>
               </div>
            </div>
          )}
        </div>

        {/* תיבת הקלט */}
        <div className="p-4 lg:p-8 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F8FAFC] to-transparent">
          <div className="max-w-3xl mx-auto flex items-center gap-2 bg-white p-2 rounded-2xl shadow-2xl border border-slate-100">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="כתוב כאן..."
              className="flex-1 px-4 py-2 outline-none font-bold text-slate-700 text-right bg-transparent"
            />
            <button 
                onClick={() => sendMessage()}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-transform active:scale-95"
            >
                <Send size={20}/>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
