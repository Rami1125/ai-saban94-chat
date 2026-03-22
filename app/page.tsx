"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Send, Truck, ShoppingBag, Search, Plus, Minus, MessageCircle, Camera, Mic, Paperclip, MoreVertical, ChevronRight, CheckCheck } from "lucide-react";

export default function SabanWhatsAppPro() {
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
    // סנכרון Realtime
    const channel = supabase.channel('ws_sync')
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
    setMessage(''); // ניקוי מיידי לחווית WhatsApp חלקה

    try {
      await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg, userName: "ראמי", sessionId: "saban_session" }),
      });
      if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
    } catch (e) {
      setMessage(msg); // החזרה במקרה של שגיאה
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#efeae2] overflow-hidden font-sans select-none antialiased" dir="rtl">
      
      {/* --- WhatsApp Top Header --- */}
      <header className="bg-[#008069] text-white p-3 pt-11 flex justify-between items-center shrink-0 shadow-sm z-[100]">
        <div className="flex items-center gap-3">
          <ChevronRight size={24} className="opacity-80" />
          <div className="relative">
            <img src="/ai.png" className="w-10 h-10 rounded-full bg-white object-cover border-[1px] border-black/10" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] rounded-full border-2 border-[#008069]"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-base leading-tight">ח. סבן Ai - מוח מבצע</h1>
            <span className="text-[11px] text-[#b3d9d2]">מחובר למלאי ולסידור • פעיל</span>
          </div>
        </div>
        <div className="flex gap-5 items-center opacity-90 pl-1">
          <Camera size={20} />
          <Search size={20} />
          <MoreVertical size={20} />
        </div>
      </header>

      {/* --- WhatsApp Navigation Tabs --- */}
      <nav className="bg-[#008069] text-white flex shrink-0 z-[90] uppercase text-[13px] font-bold tracking-wider">
        <button onClick={() => setActiveTab('chats')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'chats' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>צ'אטים</button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'shop' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>חנות ומלאי</button>
        <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 border-b-4 transition-all ${activeTab === 'track' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>מעקב ({activeOrders.length})</button>
      </nav>

      {/* --- Main Content (Chat Area) --- */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto relative z-10 touch-pan-y" 
            style={{ backgroundImage: "url('https://i.ibb.co/3s6S48Y/wa-bg-light.png')", backgroundSize: "repeat" }}>
        
        <div className="p-4 flex flex-col gap-2 min-h-full pb-32">
          
          {/* Chat Mode */}
          {activeTab === 'chats' && (
            <>
              <div className="self-center bg-[#d1eaef] text-[#54656f] text-[11px] px-3 py-1 rounded-md shadow-sm mb-4 uppercase font-medium">הודעות מוצפנות מקצה לקצה</div>
              <div className="bg-white p-2.5 rounded-lg rounded-tr-none shadow-sm max-w-[85%] self-start relative border-l-4 border-[#008069]">
                <p className="text-[14px] text-[#111b21] leading-relaxed">ראמי אחי, המוח מחובר למערכת. המלאי של 427 המוצרים מעודכן וסידור העבודה פתוח לשינויים. מה הפקודה?</p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-[10px] text-[#667781]">08:30</span>
                  <CheckCheck size={15} className="text-[#53bdeb]" />
                </div>
              </div>
            </>
          )}

          {/* Shop Mode */}
          {activeTab === 'shop' && (
            <div className="space-y-3">
              <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-md border border-gray-200/50">
                <div className="relative flex items-center bg-[#f0f2f5] rounded-lg px-3">
                  <Search size={18} className="text-[#8696a0]" />
                  <input type="text" placeholder="חפש מוצר במלאי..." className="w-full p-2.5 bg-transparent outline-none text-sm text-[#111b21]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {inventory.filter(i => (i.product_name || "").includes(searchTerm)).map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between border-r-4 border-[#008069] active:bg-[#f5f6f6]">
                    <div className="flex-1">
                      <h3 className="font-bold text-[14px] text-[#111b21]">{item.product_name}</h3>
                      <p className="text-[11px] text-[#667781]">מלאי: {item.stock_qty} | מק"ט: {item.sku}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-full p-1 border border-gray-200">
                      <button onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-[#008069]"><Plus size={18}/></button>
                      <span className="font-bold text-sm min-w-[20px] text-center">{cart[item.id] || 0}</span>
                      <button onClick={() => { if(cart[item.id]>0) setCart({...cart, [item.id]: cart[item.id]-1})}} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-[#ea0038]"><Minus size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- WhatsApp Bottom Input Bar --- */}
      {activeTab === 'chats' && (
        <footer className="fixed bottom-0 left-0 right-0 p-2 bg-[#f0f2f5] flex items-center gap-2 z-[999] pb-8 md:pb-4 border-t border-gray-200/50">
          <div className="flex gap-3 text-[#54656f] px-2 shrink-0">
             <Paperclip size={24} className="rotate-45" />
          </div>
          <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center shadow-sm border border-white">
            <input 
              type="text" 
              placeholder="הודעה" 
              className="w-full outline-none text-[15px] bg-transparent py-1 text-[#111b21]" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 shrink-0 ${!message.trim() ? 'bg-[#008069]' : 'bg-[#008069] hover:bg-[#00a884]'}`}
          >
            {!message.trim() ? <Mic size={22} className="text-white" /> : <Send size={22} className="text-white mr-1" />}
          </button>
        </footer>
      )}
    </div>
  );
}
