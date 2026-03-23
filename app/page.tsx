"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { 
  Send, Truck, ShoppingBag, Search, Plus, Minus, 
  MessageCircle, Mic, Paperclip, MoreVertical, 
  CheckCheck, AlertTriangle, Activity, X as CloseIcon 
} from "lucide-react";

export default function SabanWhatsAppFinal() {
  const [activeTab, setActiveTab] = useState('chats');
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- מערך ה"מלשינון" - לוגים חיים על המסך ---
  const [logs, setLogs] = useState<{msg: string, type: 'error' | 'success' | 'info', time: string}[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // פונקציית המלשינון - הזרקה למערך הלוגים
  const report = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
    setLogs(prev => [{msg, type, time}, ...prev].slice(0, 15)); // שומר 15 לוגים אחרונים
    if (type === 'error') console.error(`[SABAN_ERR] ${msg}`);
  };

  useEffect(() => {
    report("מערכת SabanOS אותחלה", "info");
    fetchInventory();
    fetchOrders();

    // בדיקת דופק ל-Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) report("Service Worker פעיל ותקין", "success");
        else report("Service Worker חסר או לא רשום!", "error");
      });
    }

    // סינכרון Real-time עם המלשינון
    const channel = supabase.channel('ws_sync_final')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, (payload) => {
        report(`שינוי בסידור: ${payload.new?.customer_name || 'עדכון'}`, "success");
        fetchOrders();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('*').order('product_name');
    if (error) report(`כשל בשליפת מלאי: ${error.message}`, "error");
    else {
      setInventory(data || []);
      report(`נטענו ${data?.length} מוצרים מהמחסן`, "success");
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('saban_master_dispatch').select('*').neq('status', 'בוצע');
    if (error) report(`כשל בשליפת סידור: ${error.message}`, "error");
    else {
        setActiveOrders(data || []);
        report("רשימת הובלות עודכנה", "info");
    }
  };

  const handleSendMessage = async () => {
    const msg = message.trim();
    if (!msg) return;
    if (isLoading) { report("ממתין לתשובה קודמת...", "info"); return; }
    
    setIsLoading(true);
    setMessage(''); 
    report(`שיגור פקודה: ${msg.substring(0, 30)}...`, "info");

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg, userName: "ראמי", sessionId: "saban_session" }),
      });

      if (res.ok) {
        report("הפקודה בוצעה בהצלחה ב-DB", "success");
      } else {
        const errData = await res.json();
        report(`שגיאת מוח (${res.status}): ${errData.error || 'Unknown'}`, "error");
        setMessage(msg); 
      }
    } catch (e: any) {
      report(`נתק בצינור ה-API: ${e.message}`, "error");
      setMessage(msg); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#efeae2] overflow-hidden font-sans relative select-none antialiased" dir="rtl">
      
      {/* המלשינון הצף - Diagnostic Monitor */}
      <div className={`fixed top-24 left-4 right-4 z-[1000] bg-black/95 text-white text-[11px] p-3 rounded-2xl font-mono shadow-2xl border border-white/10 transition-all duration-300 transform ${showLogs ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 font-bold tracking-tighter text-[12px]">SABAN_NERVE_CENTER v12.9</span>
          </div>
          <CloseIcon size={14} className="cursor-pointer text-slate-500 hover:text-white" onClick={() => setShowLogs(false)} />
        </div>
        <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
            {logs.length === 0 && <div className="text-slate-600 italic">ממתין לפעילות...</div>}
            {logs.map((l, i) => (
            <div key={i} className={`flex gap-2 border-b border-white/5 pb-1 ${l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-emerald-400' : 'text-blue-300'}`}>
                <span className="opacity-40 shrink-0">[{l.time}]</span>
                <span className="break-words font-medium">{l.msg}</span>
            </div>
            ))}
        </div>
      </div>

      {/* Header WhatsApp Pro */}
      <header className="bg-[#008069] text-white p-3 pt-12 flex justify-between items-center shrink-0 z-[200] shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer transition-transform active:scale-90" onClick={() => setShowLogs(!showLogs)}>
            <img src="/ai.png" className="w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm" 
                 onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Saban+AI&background=008069&color=fff"; }} />
            {logs.some(l => l.type === 'error') && (
                <div className="absolute -top-1 -right-1 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-[#008069] animate-bounce"></div>
            )}
          </div>
          <div>
            <h1 className="font-bold text-[17px] leading-tight">ח. סבן Ai</h1>
            <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                <span className="text-[12px] text-[#b3d9d2]">
                {isLoading ? 'מעבד נתונים...' : 'מחובר • LIVE'}
                </span>
            </div>
          </div>
        </div>
        <div className="flex gap-5 opacity-90 pl-2">
          <Search size={22} className="cursor-pointer" />
          <MoreVertical size={22} className="cursor-pointer" />
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="bg-[#008069] text-white flex shrink-0 z-[190] text-[14px] font-bold shadow-sm">
        {['chats', 'shop', 'track'].map((tab) => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`flex-1 py-3 border-b-4 transition-all uppercase tracking-tight ${activeTab === tab ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}
            >
                {tab === 'chats' ? 'צ\'אטים' : tab === 'shop' ? 'חנות' : 'מעקב'}
            </button>
        ))}
      </nav>

      {/* Main Container */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto z-10 touch-pan-y pb-32" style={{ backgroundColor: "#efeae2" }}>
        <div className="p-4 flex flex-col gap-3 min-h-full">
          {activeTab === 'chats' && (
            <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[90%] self-start relative border-l-4 border-[#008069]">
              <p className="text-[15px] text-[#111b21] leading-relaxed">
                ראמי אחי, המלשינון חמוש. לחץ על האייקון שלי למעלה כדי לראות את הצינורות בזמן אמת. מה התוכנית להיום? 🦾
              </p>
              <div className="flex justify-end items-center gap-1 mt-1 opacity-60 text-[11px]">
                <span>{new Date().toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
                <CheckCheck size={15} className="text-[#53bdeb]" />
              </div>
            </div>
          )}
          
          {/* תצוגת סידור עבודה מהירה (Track) */}
          {activeTab === 'track' && activeOrders.map((order, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border-r-4 border-amber-500">
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>{order.customer_name}</span>
                    <span className="text-emerald-600">{order.scheduled_time}</span>
                  </div>
                  <p className="text-xs text-slate-500">{order.order_id_comax}</p>
              </div>
          ))}
        </div>
      </main>

      {/* Footer עם המלשינון מוזרק */}
      {activeTab === 'chats' && (
        <footer className="fixed bottom-0 left-0 right-0 p-3 bg-[#f0f2f5]/95 backdrop-blur-md flex items-center gap-2 z-[999] pb-8 border-t border-gray-200 shadow-2xl">
          <div className="flex-1 bg-white rounded-full px-5 py-3 flex items-center shadow-inner border border-gray-200">
            <input 
              type="text" 
              placeholder="כתוב פקודה לראמי..." 
              className="w-full outline-none text-[16px] bg-transparent text-[#111b21]" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              onFocus={() => report("ראמי מתחיל להקליד...", "info")}
            />
          </div>
          <button 
            onClick={() => handleSendMessage()}
            disabled={isLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${isLoading ? 'bg-slate-400 rotate-12' : 'bg-[#008069] hover:bg-[#006e5a]'}`}
          >
            {message.trim() ? <Send size={22} className="text-white mr-1" /> : <Mic size={22} className="text-white" />}
          </button>
        </footer>
      )}
    </div>
  );
}
