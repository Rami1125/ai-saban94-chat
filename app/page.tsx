"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Send, Truck, ShoppingBag, Search, Plus, Minus, MessageCircle, Mic, Paperclip, MoreVertical, CheckCheck, AlertTriangle, Activity } from "lucide-react";

export default function SabanWhatsAppFinal() {
  const [activeTab, setActiveTab] = useState('chats');
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // מערך ה"מלשינון" - לוגים חיים על המסך
  const [logs, setLogs] = useState<{msg: string, type: 'error' | 'success' | 'info', time: string}[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // פונקציית המלשינון - הזרקה למערך הלוגים
  const report = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
    setLogs(prev => [{msg, type, time}, ...prev].slice(0, 10)); // שומר 10 אחרונים
    if (type === 'error') console.error(`[SABAN_ERR] ${msg}`);
    else console.log(`[SABAN_LOG] ${msg}`);
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

    const channel = supabase.channel('ws_sync_final')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, (payload) => {
        report(`שינוי בסידור: ${payload.new.customer_name}`, "success");
        if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
        fetchOrders();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('id, product_name, stock_qty, category, sku').order('product_name');
    if (error) report(`כשל בשליפת מלאי: ${error.message}`, "error");
    else {
      setInventory(data || []);
      report(`נטענו ${data?.length} מוצרים מהמחסן`, "success");
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('saban_master_dispatch').select('*').neq('status', 'בוצע');
    if (error) report(`כשל בשליפת סידור: ${error.message}`, "error");
    else setActiveOrders(data || []);
  };

  const handleSendMessage = async () => {
    const msg = message.trim();
    if (!msg) return;
    if (isLoading) { report("ניסיון שליחה בזמן טעינה נחסם", "info"); return; }
    
    setIsLoading(true);
    setMessage(''); 
    report(`שולח פקודה: ${msg.substring(0, 20)}...`, "info");

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg, userName: "ראמי", sessionId: "saban_session" }),
      });

      if (res.ok) {
        report("הודעה התקבלה במוח ובוצעה", "success");
        if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
      } else {
        report(`קריסת API: סטטוס ${res.status}`, "error");
        setMessage(msg); 
      }
    } catch (e: any) {
      report(`כשל תקשורת: ${e.message}`, "error");
      setMessage(msg); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#efeae2] overflow-hidden font-sans relative select-none antialiased" dir="rtl">
      
      {/* המלשינון הצף - Diagnostic Monitor */}
      <div className={`fixed top-24 left-4 right-4 z-[1000] bg-black/90 text-white text-[10px] p-2 rounded-lg font-mono shadow-2xl transition-all ${showLogs ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex justify-between border-b border-white/20 pb-1 mb-1">
          <span className="text-yellow-400 font-bold tracking-widest">SABAN_DIAGNOSTICS</span>
          <X size={12} onClick={() => setShowLogs(false)} />
        </div>
        {logs.map((l, i) => (
          <div key={i} className={`mb-0.5 ${l.type === 'error' ? 'text-red-400 font-bold' : l.type === 'success' ? 'text-green-400' : 'text-blue-300'}`}>
            [{l.time}] {l.msg}
          </div>
        ))}
      </div>

      {/* Header WhatsApp Pro */}
      <header className="bg-[#008069] text-white p-3 pt-11 flex justify-between items-center shrink-0 z-[200]">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => setShowLogs(!showLogs)}>
            <img src="/ai.png" className="w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm" 
                 onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Saban+AI&background=008069&color=fff"; }} />
            {logs.some(l => l.type === 'error') && <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-ping"></div>}
          </div>
          <div>
            <h1 className="font-bold text-[16px]">ח. סבן Ai</h1>
            <span className="text-[11px] text-[#b3d9d2] flex items-center gap-1">
              <Activity size={10} /> {isLoading ? 'המוח חושב...' : 'פעיל • מסונכרן'}
            </span>
          </div>
        </div>
        <div className="flex gap-4 opacity-90 pl-1">
          <Search size={20} />
          <MoreVertical size={20} />
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="bg-[#008069] text-white flex shrink-0 z-[190] text-[13px] font-bold">
        <button onClick={() => setActiveTab('chats')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'chats' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>צ'אטים</button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'shop' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>חנות</button>
        <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'track' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>מעקב</button>
      </nav>

      {/* Main Container */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto z-10 touch-pan-y pb-32" style={{ backgroundColor: "#efeae2" }}>
        <div className="p-4 flex flex-col gap-3 min-h-full">
          {activeTab === 'chats' && (
            <div className="bg-white p-2.5 rounded-lg rounded-tr-none shadow-sm max-w-[88%] self-start relative border-l-[3px] border-[#008069]">
              <p className="text-[14px] text-[#111b21]">ראמי אחי, המלשינון פועל. אם משהו ייתקע - אתה תראה התראה אדומה על הלוגו שלי. מה נבצע? 🦾</p>
              <div className="flex justify-end items-center gap-1 mt-1 opacity-60 text-[10px]">
                <span>08:45</span>
                <CheckCheck size={14} className="text-[#53bdeb]" />
              </div>
            </div>
          )}
          {/* ... שאר הלוגיקה של החנות והמעקב כאן ... */}
        </div>
      </main>

      {/* Footer - המלשינון מוודא שהוא תמיד לחיץ */}
      {activeTab === 'chats' && (
        <footer className="fixed bottom-0 left-0 right-0 p-3 bg-[#f0f2f5] flex items-center gap-2 z-[999] pb-10 border-t border-gray-300 shadow-2xl">
          <div className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center shadow-sm border border-white">
            <input 
              type="text" 
              placeholder="הודעה" 
              className="w-full outline-none text-[16px] bg-transparent text-[#111b21] selection:bg-green-100" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              onFocus={() => report("שדה טקסט בפוקוס", "info")}
            />
          </div>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); handleSendMessage(); }}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${isLoading ? 'bg-gray-400' : 'bg-[#008069]'}`}
          >
            {message.trim() ? <Send size={22} className="text-white mr-1" /> : <Mic size={22} className="text-white" />}
          </button>
        </footer>
      )}
    </div>
  );
}

// רכיב X קטן לסגירה
function X({size, onClick}: {size: number, onClick: () => void}) {
  return <span onClick={onClick} className="cursor-pointer hover:text-red-500">✕</span>;
}
