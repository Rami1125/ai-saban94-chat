"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { 
  Send, Search, MoreVertical, CheckCheck, Activity, X, Mic 
} from "lucide-react";

export default function SabanWhatsAppFinal() {
  const [activeTab, setActiveTab] = useState('chats');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: string, time: string}[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // פתרון ל-Hydration

  const supabase = getSupabase();

  // מונע מהשרת לרנדר את הלוגים לפני שהדף נטען בדפדפן
  useEffect(() => {
    setIsMounted(true);
    report("מערכת SabanOS אותחלה בהצלחה", "success");
  }, []);

  const report = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
    setLogs(prev => [{msg, type, time}, ...prev].slice(0, 10));
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    const currentMsg = message;
    setIsLoading(true);
    setMessage('');
    report(`שיגור פקודה: ${currentMsg.substring(0, 15)}...`, "info");

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentMsg, userName: "ראמי" }),
      });
      if (res.ok) report("הזרקה לסידור בוצעה", "success");
      else report(`כשל בשרת: ${res.status}`, "error");
    } catch (e: any) {
      report(`נתק בצינור: ${e.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // אם הדף עוד לא "נחת" בדפדפן, אל תציג כלום (מונע שגיאה 418)
  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-[#efeae2] overflow-hidden relative" dir="rtl">
      
      {/* מלשינון צף - Diagnostics */}
      {showLogs && (
        <div className="fixed top-24 left-4 right-4 z-[1000] bg-black/95 text-white p-3 rounded-2xl font-mono shadow-2xl border border-white/10">
          <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
            <span className="text-emerald-400 font-bold text-[12px]">SABAN_LOGS_V13</span>
            <X size={14} className="cursor-pointer text-slate-500" onClick={() => setShowLogs(false)} />
          </div>
          <div className="max-h-[150px] overflow-y-auto space-y-1">
            {logs.map((l, i) => (
              <div key={i} className={`text-[10px] ${l.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                [{l.time}] {l.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header WhatsApp */}
      <header className="bg-[#008069] text-white p-3 pt-12 flex justify-between items-center shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => setShowLogs(!showLogs)}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#008069] font-bold shadow-inner">AI</div>
            {logs.some(l => l.type === 'error') && (
                <div className="absolute -top-1 -right-1 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-[#008069] animate-bounce"></div>
            )}
          </div>
          <div>
            <h1 className="font-bold text-[17px]">ח. סבן Ai</h1>
            <div className="flex items-center gap-1.5 text-[12px] opacity-80">
                <Activity size={12} className={isLoading ? "animate-spin" : ""} />
                <span>{isLoading ? 'חושב...' : 'מחובר'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 opacity-90 pl-2">
          <Search size={22} />
          <MoreVertical size={22} />
        </div>
      </header>

      {/* Main Chat */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm self-start max-w-[85%] border-l-4 border-[#008069]">
          <p className="text-[15px] text-[#111b21]">ראמי אחי, המלשינון חסין שגיאות עכשיו. מה נבצע בסטרומה 4? 🦾</p>
        </div>
      </main>

      {/* Input */}
      <footer className="p-3 bg-[#f0f2f5] flex items-center gap-2 pb-10 border-t shadow-2xl">
        <div className="flex-1 bg-white rounded-full px-5 py-2.5 shadow-sm border border-gray-200">
          <input 
            type="text" 
            placeholder="הודעה..." 
            className="w-full outline-none text-[16px]" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
        </div>
        <button 
          onClick={handleSendMessage}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${isLoading ? 'bg-slate-400' : 'bg-[#008069]'}`}
        >
          <Send size={22} className="text-white mr-1" />
        </button>
      </footer>
    </div>
  );
}
