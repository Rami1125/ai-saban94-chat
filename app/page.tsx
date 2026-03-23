"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { 
  Send, Search, MoreVertical, CheckCheck, Activity, X, Mic, 
  ShoppingBag, Truck, MessageCircle, Plus, Minus, Trash2, Check
} from "lucide-react";

export default function SabanWhatsAppFinal() {
  // --- States ---
  const [activeTab, setActiveTab] = useState('chats');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string, time: string}[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{[key: string]: {qty: number, name: string, price?: number}}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: string, time: string}[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // --- Initialization ---
  useEffect(() => {
    setIsMounted(true);
    fetchInventory();
    fetchOrders();
    
    // Real-time Sync לסידור העבודה
    const channel = supabase.channel('saban_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, () => {
        report("עדכון בסידור העבודה!", "success");
        fetchOrders();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages, activeTab]);

  const report = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
    setLogs(prev => [{msg, type, time}, ...prev].slice(0, 10));
  };

  // --- Data Fetching ---
  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*').order('product_name');
    setInventory(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('saban_master_dispatch').select('*').order('created_at', {ascending: false});
    setActiveOrders(data || []);
  };

  // --- Logic ---
  const handleSendMessage = async () => {
    const msg = message.trim();
    if (!msg || isLoading) return;

    const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user' as const, content: msg, time };
    
    setChatMessages(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);
    report(`שיגור: ${msg.substring(0,10)}...`, "info");

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg, userName: "ראמי", history: chatMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.answer) {
          setChatMessages(prev => [...prev, { 
            role: 'assistant', 
            content: data.answer, 
            time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) 
          }]);
          report("המוח הגיב בהצלחה", "success");
        }
      } else {
        report(`שגיאת שרת: ${res.status}`, "error");
      }
    } catch (e) {
      report("נתק בתקשורת", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (item: any) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { 
        qty: (prev[item.id]?.qty || 0) + 1, 
        name: item.product_name 
      }
    }));
    report(`נוסף לסל: ${item.product_name}`, "success");
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-[#efeae2] overflow-hidden relative font-sans" dir="rtl">
      
      {/* מלשינון צף - Diagnostics Overlay */}
      {showLogs && (
        <div className="fixed top-24 left-4 right-4 z-[1000] bg-black/95 text-white p-3 rounded-2xl font-mono shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
            <span className="text-emerald-400 font-bold text-[12px]">SABAN_DIAGNOSTICS_V13.5</span>
            <X size={16} className="cursor-pointer text-slate-500" onClick={() => setShowLogs(false)} />
          </div>
          <div className="max-h-[120px] overflow-y-auto space-y-1">
            {logs.map((l, i) => (
              <div key={i} className={`text-[10px] ${l.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                [{l.time}] {l.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Header */}
      <header className="bg-[#008069] text-white p-3 pt-12 flex justify-between items-center shrink-0 shadow-md z-50">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => setShowLogs(!showLogs)}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#008069] font-black shadow-inner">AI</div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#008069] ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`}></div>
          </div>
          <div>
            <h1 className="font-bold text-[17px] leading-tight">ח. סבן Ai</h1>
            <span className="text-[12px] opacity-80">{isLoading ? 'מקליד/ה...' : 'מחובר • פעיל'}</span>
          </div>
        </div>
        <div className="flex gap-5 opacity-90 pl-2">
          <Search size={22} />
          <MoreVertical size={22} />
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="bg-[#008069] text-white flex shrink-0 z-40 shadow-sm font-bold text-[14px]">
        {[
          { id: 'chats', label: "צ'אטים", icon: <MessageCircle size={16} /> },
          { id: 'shop', label: "חנות", icon: <ShoppingBag size={16} /> },
          { id: 'track', label: "מעקב", icon: <Truck size={16} /> }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-4 transition-all ${activeTab === tab.id ? 'border-white' : 'border-transparent opacity-60'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-32 scroll-smooth">
        
        {/* Tab: Chats */}
        {activeTab === 'chats' && (
          <>
            <div className="bg-[#e1f3fb] p-2 rounded-lg text-center text-[12px] text-slate-600 mb-2 self-center px-4 shadow-sm">
              🔒 ההודעות מוצפנות מקצה לקצה במוח של סבן
            </div>
            {chatMessages.map((m, i) => (
              <div key={i} className={`p-3 rounded-2xl max-w-[85%] shadow-sm text-[15px] relative animate-in slide-in-from-bottom-2 duration-300 ${
                m.role === 'user' 
                  ? 'self-end bg-[#dcf8c6] rounded-tr-none' 
                  : 'self-start bg-white rounded-tl-none border-l-4 border-[#008069]'
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                <div className="flex justify-end items-center gap-1 mt-1 opacity-50 text-[10px]">
                  <span>{m.time}</span>
                  {m.role === 'user' && <CheckCheck size={14} className="text-[#53bdeb]" />}
                </div>
              </div>
            ))}
            {chatMessages.length === 0 && (
                <div className="bg-white p-4 rounded-2xl rounded-tl-none self-start border-l-4 border-[#008069] shadow-sm italic text-slate-500">
                    ראמי אחי, הכל מוכן לביצוע. מה הפקודה הבאה? 🦾
                </div>
            )}
          </>
        )}

        {/* Tab: Shop */}
        {activeTab === 'shop' && (
          <div className="grid grid-cols-2 gap-3">
            {inventory.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="text-[14px] font-bold text-slate-800 mb-1">{item.product_name}</div>
                <div className="text-[11px] text-slate-500 mb-2">מלאי: {item.stock_qty} יח'</div>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full bg-[#008069] text-white py-1.5 rounded-lg flex items-center justify-center gap-1 text-[12px] active:scale-95 transition-transform"
                >
                  <Plus size={14} /> הוסף לסל
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Track */}
        {activeTab === 'track' && (
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border-r-4 border-amber-500">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-[#111b21]">{order.customer_name}</h4>
                  <Badge status={order.status} />
                </div>
                <div className="text-[12px] text-slate-500 space-y-1">
                  <p>📍 יעד: {order.warehouse_source}</p>
                  <p>⏰ שעה: {order.scheduled_time}</p>
                  <p>🏗️ פירוט: {order.order_id_comax}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Shop Cart Overlay (Floating) */}
      {Object.keys(cart).length > 0 && activeTab === 'shop' && (
        <div className="fixed bottom-24 left-4 right-4 bg-[#008069] text-white p-4 rounded-2xl shadow-2xl z-[100] animate-bounce-short">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} />
              <span className="font-bold">{Object.values(cart).reduce((a, b) => a + b.qty, 0)} מוצרים בסל</span>
            </div>
            <button onClick={() => { report("הזמנה נשלחה מהסל", "success"); setCart({}); }} className="bg-white text-[#008069] px-4 py-1 rounded-full font-bold text-sm">בצע הזמנה</button>
          </div>
        </div>
      )}

      {/* Input Footer */}
      {activeTab === 'chats' && (
        <footer className="fixed bottom-0 left-0 right-0 p-3 bg-[#f0f2f5] flex items-center gap-2 pb-10 border-t border-gray-300 z-50">
          <div className="flex-1 bg-white rounded-full px-5 py-2.5 flex items-center shadow-sm border border-white">
            <input 
              type="text" 
              placeholder="הודעה למוח..." 
              className="w-full outline-none text-[16px] bg-transparent text-[#111b21]" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={isLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${isLoading ? 'bg-slate-400 rotate-12' : 'bg-[#008069]'}`}
          >
            {message.trim() ? <Send size={22} className="text-white mr-1" /> : <Mic size={22} className="text-white" />}
          </button>
        </footer>
      )}
    </div>
  );
}

// --- Helpers ---
function Badge({ status }: { status: string }) {
  const colors: {[key: string]: string} = {
    'פתוח': 'bg-blue-100 text-blue-700',
    'בביצוע': 'bg-amber-100 text-amber-700',
    'בוצע': 'bg-emerald-100 text-emerald-700'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
