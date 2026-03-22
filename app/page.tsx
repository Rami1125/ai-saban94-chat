"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { User, Send, CheckCheck, ShoppingBag, Truck, MessageCircle, Search, Plus, Minus } from "lucide-react";

export default function SabanWhatsAppUI() {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // טעינת נתונים בזמן אמת
  useEffect(() => {
    fetchInventory();
    subscribeToDispatch();
    
    // סנכרון משתמש
    if (!localStorage.getItem('saban_user_id')) {
      localStorage.setItem('saban_user_id', `user_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('saban_inventory').select('*').order('name');
    setInventory(data || []);
  };

  const subscribeToDispatch = async () => {
    // משיכת הזמנות פעילות בלבד (סטטוס לא סגור)
    const { data } = await supabase.from('saban_master_dispatch')
      .select('*')
      .not('status', 'eq', 'בוצע')
      .order('created_at', { ascending: false });
    setActiveOrders(data || []);

    // האזנה לשינויים בסידור
    supabase.channel('dispatch_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, () => {
        // רענון אוטומטי כשמשתנה סטטוס בסידור
        window.playNotificationSound?.();
        fetchInventory(); // רענון מלאי במידה והשתנה
      }).subscribe();
  };

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    if (cart[id] > 0) {
      setCart(prev => ({ ...prev, [id]: prev[id] - 1 }));
    }
  };

  // פונקציית שליחה למוח להתייעצות
  const consultAI = (productName: string) => {
    setMessage(`אני רוצה להתייעץ לגבי ${productName}, כמה פחת כדאי לקחת?`);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-screen bg-[#ece5dd] max-w-full overflow-hidden" dir="rtl">
      
      {/* Header - WhatsApp Style */}
      <header className="bg-[#075e54] text-white p-3 pt-6 shadow-md flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/ai.png" className="w-10 h-10 rounded-full border border-white/20 bg-white shadow-sm" />
          <div>
            <h1 className="font-bold text-lg leading-tight">ח.סבן Ai</h1>
            <span className="text-[10px] text-green-200">מחובר למלאי ולסידור</span>
          </div>
        </div>
        <div className="flex gap-4 opacity-90">
          <Truck size={22} onClick={() => setActiveTab('track')} className={activeTab === 'track' ? 'text-white' : 'text-green-200'} />
          <ShoppingBag size={22} onClick={() => setActiveTab('shop')} className={activeTab === 'shop' ? 'text-white' : 'text-green-200'} />
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#075e54] text-white flex shrink-0">
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'chat' ? 'border-white' : 'border-transparent opacity-60'}`}>צ'אט</button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'shop' ? 'border-white' : 'border-transparent opacity-60'}`}>מלאי</button>
        <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'track' ? 'border-white' : 'border-transparent opacity-60'}`}>מעקב ({activeOrders.length})</button>
      </nav>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 touch-pan-y" style={{ background: "url('https://i.ibb.co/5G7999D/whatsapp-bg.png')" }}>
        
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] self-start border border-gray-200">
              <p className="text-sm">אהלן ראמי, המוח של סבן מחובר למערכת ה-ERP. כל פקודה שלך כאן תזריק ישירות לסידור או לסל.</p>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" placeholder="חפש מוצר במלאי..." 
                className="w-full p-3 pr-10 rounded-full border-none shadow-sm text-sm"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-3 text-gray-400" size={18} />
            </div>
            <div className="grid grid-cols-1 gap-3 pb-20">
              {inventory.filter(i => i.name.includes(searchTerm)).map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border-b-2 border-green-500">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                    <p className="text-xs text-gray-500">מלאי זמין: {item.quantity}</p>
                    <button onClick={() => consultAI(item.name)} className="text-[10px] text-blue-600 underline mt-1">התייעץ עם המוח</button>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                    <button onClick={() => removeFromCart(item.id)} className="bg-red-100 text-red-600 p-1 rounded-full"><Minus size={16}/></button>
                    <span className="font-bold w-4 text-center">{cart[item.id] || 0}</span>
                    <button onClick={() => addToCart(item.id)} className="bg-green-100 text-green-600 p-1 rounded-full"><Plus size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-4 pb-20">
            {activeOrders.length === 0 ? (
              <div className="text-center py-20 opacity-40">
                <Truck size={48} className="mx-auto mb-2" />
                <p>אין הזמנות פעילות בסידור</p>
              </div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-xl shadow-md border-r-8 border-r-green-600 animate-in fade-in slide-in-from-right duration-500">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900">{order.customer_name}</h3>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-tighter">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{order.order_id_comax}</p>
                  <div className="flex justify-between items-center mt-3 border-t pt-2">
                    <span className="text-[10px] text-gray-400">שעה: {order.scheduled_time}</span>
                    <span className="text-[10px] text-gray-400">נהג: {order.driver_name || 'טרם שובץ'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer Input */}
      {activeTab === 'chat' && (
        <footer className="p-3 bg-[#f0f0f0] flex items-center gap-2 pb-8 shrink-0 z-50 shadow-2xl">
          <div className="flex-1 bg-white rounded-full px-4 py-3 shadow-inner flex items-center">
            <input 
              type="text" placeholder="כתוב פקודה למוח..." 
              className="flex-1 outline-none text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button className="bg-[#075e54] text-white p-3 rounded-full shadow-lg active:scale-90 transition-all">
            <Send size={24} />
          </button>
        </footer>
      )}
    </div>
  );
}
