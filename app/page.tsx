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
        if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
          (window as any).playNotificationSound();
        }
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('id, product_name, stock_qty, category, sku, image_url')
      .order('product_name', { ascending: true });
    if (!error) setInventory(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('saban_master_dispatch')
      .select('*')
      .neq('status', 'בוצע')
      .order('created_at', { ascending: false });
    setActiveOrders(data || []);
  };

  // --- תיקון ליבת השליחה ---
  const handleSendMessage = async () => {
    const currentMsg = message.trim();
    if (!currentMsg || isLoading) return;
    
    setIsLoading(true);
    // ניקוי מיידי של השדה כדי למנוע הרגשת "תקיעה"
    setMessage(''); 

    try {
      await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentMsg,
          userName: "ראמי",
          sessionId: "saban_session"
        }),
      });

      if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage(currentMsg); // מחזיר את ההודעה אם נכשלה השליחה
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#ece5dd] overflow-hidden font-sans relative" dir="rtl">
      
      {/* Header */}
      <header className="bg-[#075e54] text-white p-3 pt-10 shadow-lg flex justify-between items-center z-[100] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/ai.png" className="w-10 h-10 rounded-full border-2 border-white/20 bg-white" 
               onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Saban+AI&background=075e54&color=fff"; }} />
          <div>
            <h1 className="font-bold text-lg leading-tight">ח.סבן Ai</h1>
            <span className="text-[10px] text-green-200 block italic leading-none">מוח מבצע פעיל</span>
          </div>
        </div>
        <div className="flex gap-4">
          <Truck size={24} onClick={() => setActiveTab('track')} className={activeTab === 'track' ? 'text-white' : 'text-green-200'} />
          <ShoppingBag size={24} onClick={() => setActiveTab('shop')} className={activeTab === 'shop' ? 'text-white' : 'text-green-200'} />
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="bg-[#075e54] text-white flex shrink-0 z-[100] shadow-md font-bold">
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm border-b-4 transition-all ${activeTab === 'chat' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>צ'אט</button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 text-sm border-b-4 transition-all ${activeTab === 'shop' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>מלאי</button>
        <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 text-sm border-b-4 transition-all ${activeTab === 'track' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>מעקב ({activeOrders.length})</button>
      </nav>

      {/* Main Container */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 z-10 relative touch-pan-y" 
            style={{ backgroundColor: "#e5ddd5", backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "400px" }}>
        
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] self-start text-sm border border-gray-200">
              אהלן ראמי אחי! המוח מוכן. מה נבצע היום? 🦾
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-4 pb-20">
            <div className="sticky top-0 z-20">
               <input type="text" placeholder="חפש מוצר..." 
                      className="w-full p-4 pr-12 rounded-2xl shadow-md border-none text-sm outline-none bg-white font-bold"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
               <Search className="absolute right-4 top-4 text-gray-400" size={20} />
            </div>
            {inventory.filter(i => (i.product_name || "").includes(searchTerm)).map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border-r-8 border-green-600">
                <div className="flex-1 pr-2">
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.product_name}</h3>
                  <p className="text-[10px] text-gray-500 italic">מלאי: {item.stock_qty}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <button onClick={() => { if(cart[item.id]>0) setCart({...cart, [item.id]: cart[item.id]-1})}} className="p-1 bg-white shadow-sm text-red-600 rounded-lg"><Minus size={20}/></button>
                  <span className="font-bold w-5 text-center text-sm">{cart[item.id] || 0}</span>
                  <button onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})} className="p-1 bg-white shadow-sm text-green-600 rounded-lg"><Plus size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-4 pb-20 text-sm italic opacity-50 text-center py-20">
             {activeOrders.length === 0 ? "אין הזמנות בביצוע" : "טוען מעקב..."}
          </div>
        )}
      </main>

      {/* Footer - התיקון הקריטי כאן */}
      {activeTab === 'chat' && (
        <footer className="p-3 bg-[#f0f0f0] flex items-center gap-2 pb-10 shrink-0 z-[999] relative border-t border-gray-200">
          <div className="flex-1 bg-white rounded-full px-5 py-3 shadow-md border border-gray-200 flex items-center">
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
            type="button"
            onClick={(e) => { e.preventDefault(); handleSendMessage(); }}
            disabled={isLoading}
            className={`p-4 rounded-full shadow-xl transition-all flex items-center justify-center cursor-pointer pointer-events-auto ${isLoading ? 'bg-gray-400' : 'bg-[#075e54] active:scale-90 hover:bg-[#128c7e]'}`}
            style={{ minWidth: '56px', minHeight: '56px' }}
          >
            <Send size={22} className="text-white mr-1" />
          </button>
        </footer>
      )}
    </div>
  );
}
