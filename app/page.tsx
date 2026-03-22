"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Send, Truck, ShoppingBag, Search, Plus, Minus, MessageCircle } from "lucide-react";

export default function SabanElitePage() {
  const [activeTab, setActiveTab] = useState('chat');
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
    const channel = supabase.channel('live_sync')
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
    const msgToSend = message.trim();
    if (!msgToSend || isLoading) return;
    
    setIsLoading(true);
    setMessage(''); // ניקוי מיידי

    try {
      await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msgToSend, userName: "ראמי", sessionId: "saban_session" }),
      });
      if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
    } catch (e) {
      console.error(e);
      setMessage(msgToSend);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#ece5dd] overflow-hidden font-sans relative" dir="rtl">
      
      {/* Header & Nav - z-50 */}
      <div className="shrink-0 z-[100] shadow-lg">
        <header className="bg-[#075e54] text-white p-3 pt-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/ai.png" className="w-10 h-10 rounded-full bg-white" />
            <h1 className="font-bold text-lg">ח.סבן Ai</h1>
          </div>
          <div className="flex gap-4">
            <Truck size={24} onClick={() => setActiveTab('track')} className="cursor-pointer" />
            <ShoppingBag size={24} onClick={() => setActiveTab('shop')} className="cursor-pointer" />
          </div>
        </header>
        <nav className="bg-[#075e54] text-white flex border-t border-white/10">
          <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'chat' ? 'border-white' : 'border-transparent opacity-60'}`}>צ'אט</button>
          <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'shop' ? 'border-white' : 'border-transparent opacity-60'}`}>מלאי</button>
          <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'track' ? 'border-white' : 'border-transparent opacity-60'}`}>מעקב</button>
        </nav>
      </div>

      {/* Main Content - z-10 */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 z-10 touch-pan-y mb-20" 
            style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "400px" }}>
        
        {activeTab === 'chat' && (
          <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] border border-gray-200 text-sm">אהלן ראמי, המוח מוכן. מה נבצע? 🦾</div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-4">
            <input type="text" placeholder="חפש מוצר..." className="w-full p-4 rounded-xl shadow-md border-none outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
            {inventory.filter(i => (i.product_name || "").includes(searchTerm)).map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border-r-8 border-green-600">
                <div className="flex-1"><h3 className="font-bold text-sm">{item.product_name}</h3><p className="text-[10px] opacity-50">מלאי: {item.stock_qty}</p></div>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                  <button onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})} className="text-green-600"><Plus size={20}/></button>
                  <span className="font-bold text-sm">{cart[item.id] || 0}</span>
                  <button onClick={() => { if(cart[item.id]>0) setCart({...cart, [item.id]: cart[item.id]-1})}} className="text-red-600"><Minus size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER - THE FIX - z-[999] */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#f0f0f0] flex items-center gap-2 pb-8 z-[999] border-t border-gray-300">
          <div className="flex-1 bg-white rounded-full px-5 py-3 shadow-md border border-gray-200">
            <input 
              type="text" 
              placeholder="כתוב פקודה למוח..." 
              className="w-full outline-none text-sm bg-transparent border-none focus:ring-0" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={isLoading}
            className={`p-4 rounded-full shadow-xl text-white transition-all ${isLoading ? 'bg-gray-400' : 'bg-[#075e54] active:scale-90 hover:bg-[#128c7e]'}`}
          >
            <Send size={22} className={isLoading ? 'animate-pulse' : ''} />
          </button>
        </div>
      )}
    </div>
  );
}
