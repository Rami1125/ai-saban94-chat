"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Send, Truck, ShoppingBag, Search, Plus, Minus, MessageCircle, Camera, Mic, Paperclip, MoreVertical, ChevronRight, CheckCheck } from "lucide-react";

export default function SabanWhatsAppFinal() {
  const [activeTab, setActiveTab] = useState('chats');
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  useEffect(() => {
    fetchInventory();
    fetchOrders();
    const channel = supabase.channel('ws_sync_final')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, () => {
        if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
        fetchOrders();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('id, product_name, stock_qty, category, sku').order('product_name');
    setInventory(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('saban_master_dispatch').select('*').neq('status', 'בוצע').order('created_at', { ascending: false });
    setActiveOrders(data || []);
  };

  const handleSendMessage = async () => {
    const msg = message.trim();
    if (!msg || isLoading) return;
    
    setIsLoading(true);
    setMessage(''); // ניקוי מיידי למניעת תקיעה

    try {
      await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg, userName: "ראמי", sessionId: "saban_session" }),
      });
      if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
    } catch (e) {
      console.error("Send Error:", e);
      setMessage(msg); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#efeae2] overflow-hidden font-sans select-none antialiased relative" dir="rtl">
      
      {/* --- Header & Nav (WhatsApp Style) --- */}
      <div className="shrink-0 z-[200] relative shadow-md">
        <header className="bg-[#008069] text-white p-3 pt-11 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/ai.png" className="w-10 h-10 rounded-full bg-white border border-black/10 shadow-sm" 
                   onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Saban+AI&background=008069&color=fff"; }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] rounded-full border-2 border-[#008069]"></div>
            </div>
            <div>
              <h1 className="font-bold text-[16px]">ח. סבן Ai</h1>
              <span className="text-[11px] text-[#b3d9d2] block">פעיל • מחובר למלאי</span>
            </div>
          </div>
          <div className="flex gap-4 opacity-90 pl-1">
            <Search size={20} />
            <MoreVertical size={20} />
          </div>
        </header>

        <nav className="bg-[#008069] text-white flex text-[13px] font-bold">
          <button onClick={() => setActiveTab('chats')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'chats' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>צ'אטים</button>
          <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'shop' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>חנות</button>
          <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'track' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>מעקב</button>
        </nav>
      </div>

      {/* --- Main Content Area --- */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto z-10 touch-pan-y pb-32" 
            style={{ backgroundColor: "#efeae2" }}>
        
        <div className="p-4 flex flex-col gap-3">
          {activeTab === 'chats' && (
            <div className="bg-white p-2.5 rounded-lg rounded-tr-none shadow-sm max-w-[88%] self-start relative border-l-[3px] border-[#008069]">
              <p className="text-[14px] text-[#111b21]">ראמי אחי, המערכת דרוכה. 427 מוצרים במלאי והסידור מסונכרן. שלח פקודה! 🦾</p>
              <div className="flex justify-end items-center gap-1 mt-1 opacity-60 text-[10px]">
                <span>08:45</span>
                <CheckCheck size={14} className="text-[#53bdeb]" />
              </div>
            </div>
          )}

          {activeTab === 'shop' && (
            <div className="space-y-3">
              <div className="sticky top-0 z-50 bg-[#efeae2]/90 backdrop-blur-md pb-2">
                <div className="bg-white flex items-center px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                  <Search size={18} className="text-gray-400 ml-2" />
                  <input type="text" placeholder="חיפוש מוצר..." className="w-full outline-none text-sm py-1" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              {inventory.filter(i => (i.product_name || "").includes(searchTerm)).map(item => (
                <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm flex items-center justify-between border-r-4 border-[#008069] active:bg-gray-50 transition-all">
                  <div className="flex-1"><h3 className="font-bold text-sm">{item.product_name}</h3><p className="text-[11px] text-gray-400">מלאי: {item.stock_qty}</p></div>
                  <div className="flex items-center gap-2 bg-[#f0f2f5] p-1.5 rounded-full border">
                    <button onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#008069] shadow-sm"><Plus size={16}/></button>
                    <span className="font-bold text-sm min-w-[20px] text-center">{cart[item.id] || 0}</span>
                    <button onClick={() => { if(cart[item.id]>0) setCart({...cart, [item.id]: cart[item.id]-1})}} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm"><Minus size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- FIXED BOTTOM BAR (THE FIX) --- */}
      {activeTab === 'chats' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#f0f2f5] flex items-center gap-2 z-[999] pb-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 text-[#54656f] px-1 shrink-0">
             <Paperclip size={24} className="rotate-45 opacity-70" />
          </div>
          <div className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center shadow-sm border border-white overflow-hidden">
            <input 
              type="text" 
              placeholder="הודעה" 
              className="w-full outline-none text-[16px] bg-transparent text-[#111b21]" 
              style={{ pointerEvents: 'auto' }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); handleSendMessage(); }}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 pointer-events-auto ${!message.trim() ? 'bg-[#008069]' : 'bg-[#008069]'}`}
          >
            {message.trim() ? <Send size={22} className="text-white mr-1" /> : <Mic size={22} className="text-white" />}
          </button>
        </div>
      )}
    </div>
  );
}
