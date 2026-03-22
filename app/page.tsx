"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Send, Truck, ShoppingBag, Search, Plus, Minus, MessageCircle, X } from "lucide-react";

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

  // 1. טעינת נתונים וסנכרון Realtime
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

    if (typeof window !== 'undefined' && !localStorage.getItem('saban_user_id')) {
      localStorage.setItem('saban_user_id', `user_${Math.random().toString(36).substring(2, 11)}`);
    }

    return () => { supabase.removeChannel(channel); };
  }, []);

  // גלילה אוטומטית בצ'אט
  useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, product_name, stock_qty, category, sku, image_url')
        .order('product_name', { ascending: true });
      if (!error) setInventory(data || []);
    } catch (e) {
      console.error("Inventory error:", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase.from('saban_master_dispatch')
        .select('*')
        .neq('status', 'בוצע')
        .order('created_at', { ascending: false });
      setActiveOrders(data || []);
    } catch (e) {
      console.error("Orders error:", e);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          userName: "ראמי",
          sessionId: "saban_session"
        }),
      });

      if (response.ok && typeof window !== 'undefined' && (window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const consultAI = (productName: string) => {
    setMessage(`אחי, אני רוצה להזמין ${productName}, תעזור לי עם כמויות ופחת.`);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#ece5dd] overflow-hidden font-sans" dir="rtl">
      
      {/* Header */}
      <header className="bg-[#075e54] text-white p-3 pt-10 shadow-lg flex justify-between items-center z-[100] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/ai.png" className="w-10 h-10 rounded-full border-2 border-white/20 bg-white shadow-sm"
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
      <nav className="bg-[#075e54] text-white flex shrink-0 z-[90] shadow-md font-bold">
        {['chat', 'shop', 'track'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-3 text-sm border-b-4 transition-all ${activeTab === tab ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>
            {tab === 'chat' ? 'צ\'אט' : tab === 'shop' ? 'מלאי' : `מעקב (${activeOrders.length})`}
          </button>
        ))}
      </nav>

      {/* Main Container */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 z-10 touch-pan-y" 
            style={{ backgroundColor: "#e5ddd5", backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "400px" }}>
        
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] self-start text-sm border border-gray-200 leading-relaxed">
              שלום ראמי אחי! המוח של ח. סבן מחובר למלאי ולסידור. מה נבצע היום? 🦾
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-4 pb-20">
            <div className="sticky top-0 z-20">
              <div className="relative">
                <input type="text" placeholder="חפש מוצר במלאי..." 
                       className="w-full p-4 pr-12 rounded-2xl shadow-md border-none text-sm outline-none bg-white font-bold"
                       value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute right-4 top-4 text-gray-400" size={20} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {inventory.filter(i => (i.product_name || "").includes(searchTerm)).map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border-r-8 border-green-600 active:scale-95 transition-all">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-gray-800 text-sm">{item.product_name}</h3>
                    <p className="text-[10px] text-gray-500 italic">מלאי: {item.stock_qty}</p>
                    <button onClick={() => consultAI(item.product_name)} className="text-[10px] text-blue-600 mt-2 font-bold flex items-center gap-1 underline italic">
                      <MessageCircle size={10} /> התייעץ
                    </button>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <button onClick={() => { if(cart[item.id]>0) setCart({...cart, [item.id]: cart[item.id]-1})}} className="p-1 bg-white shadow-sm text-red-600 rounded-lg"><Minus size={20}/></button>
                    <span className="font-bold w-5 text-center text-sm">{cart[item.id] || 0}</span>
                    <button onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})} className="p-1 bg-white shadow-sm text-green-600 rounded-lg"><Plus size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-4 pb-20">
            {activeOrders.length === 0 ? (
              <div className="text-center py-24 opacity-30 italic">אין הזמנות פעילות בסידור</div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-lg border-r-8 border-[#25d366] animate-in slide-in-from-right">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#075e54]">{order.customer_name}</h3>
                    <span className="text-[9px] font-black bg-green-100 text-green-800 px-3 py-1 rounded-full uppercase tracking-tighter">{order.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 leading-tight">{order.order_id_comax}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 text-[10px] text-gray-400 font-bold border-t">
                    <span>🕒 {order.scheduled_time}</span>
                    <span>🚚 {order.driver_name || 'ממתין לשיבוץ'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {activeTab === 'chat' && (
        <footer className="p-3 bg-[#f0f0f0] flex items-center gap-2 pb-10 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-[100]">
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
            className={`p-4 rounded-full shadow-xl transition-all flex items-center justify-center ${isLoading ? 'bg-gray-400' : 'bg-[#075e54] active:scale-90'}`}
          >
            <Send size={22} className={`text-white ${isLoading ? 'animate-pulse' : 'mr-1'}`} />
          </button>
        </footer>
      )}
    </div>
  );
}        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message, userName: "ראמי", sessionId: "saban_session" }),
      });
      if (response.ok && (window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }
      setMessage('');
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const consultAI = (productName: string) => {
    setMessage(`אחי, אני רוצה להזמין ${productName}, תעזור לי עם כמויות ופחת.`);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#ece5dd] overflow-hidden font-sans" dir="rtl">
      
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
      <nav className="bg-[#075e54] text-white flex shrink-0 z-[90] shadow-md">
        {['chat', 'shop', 'track'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === tab ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>
            {tab === 'chat' ? 'צ\'אט' : tab === 'shop' ? 'מלאי' : `מעקב (${activeOrders.length})`}
          </button>
        ))}
      </nav>

      {/* Main Body */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 z-10" 
            style={{ backgroundColor: "#e5ddd5", backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "400px" }}>
        
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] self-start text-sm border border-gray-200">
              שלום ראמי אחי! המוח מוכן לביצוע. כל פקודה שתקליד כאן תעובד ותוזרק לסידור. 🦾
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-4 pb-20">
            <div className="sticky top-0 z-20">
              <div className="relative">
                <input type="text" placeholder="חפש מוצר במלאי..." 
                       className="w-full p-4 pr-12 rounded-2xl shadow-md border-none text-sm outline-none bg-white"
                       value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute right-4 top-4 text-gray-400" size={20} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {inventory.filter(i => (i.product_name || "").includes(searchTerm)).map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border-r-8 border-green-600 active:scale-[0.98] transition-all">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-gray-800 text-sm">{item.product_name}</h3>
                    <p className="text-[10px] text-gray-500 italic">מלאי: {item.stock_qty}</p>
                    <button onClick={() => consultAI(item.product_name)} className="text-[10px] text-blue-600 mt-2 font-bold flex items-center gap-1 underline">
                      <MessageCircle size={10} /> התייעץ
                    </button>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <button onClick={() => { if(cart[item.id]>0) setCart({...cart, [item.id]: cart[item.id]-1})}} className="p-1 bg-white shadow-sm text-red-600 rounded-lg"><Minus size={20}/></button>
                    <span className="font-bold w-5 text-center text-sm">{cart[item.id] || 0}</span>
                    <button onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})} className="p-1 bg-white shadow-sm text-green-600 rounded-lg"><Plus size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-4 pb-20">
            {activeOrders.length === 0 ? (
              <div className="text-center py-24 opacity-30 italic">אין הזמנות פעילות</div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-lg border-r-8 border-[#25d366]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#075e54]">{order.customer_name}</h3>
                    <span className="text-[9px] font-black bg-green-100 text-green-800 px-3 py-1 rounded-full uppercase">{order.status}</span>
                  </div>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">{order.order_id_comax}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {activeTab === 'chat' && (
        <footer className="p-3 bg-[#f0f0f0] flex items-center gap-2 pb-10 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-[100]">
          <div className="flex-1 bg-white rounded-full px-5 py-3 shadow-md border border-gray-200 flex items-center">
            <input 
              type="text" 
              placeholder="כתוב פקודה למוח..." 
              className="w-full outline-none text-sm bg-transparent" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </div>
          <button 
            onClick={handleSendMessage}
            className="bg-[#075e54] text-white p-4 rounded-full shadow-xl active:scale-90 transition-all flex items-center justify-center disabled:bg-gray-400"
            disabled={isLoading}
          >
            <Send size={22} className="mr-1" />
          </button>
        </footer>
      )}
    </div>
  );
}      });

      const data = await response.json();
      if (window.playNotificationSound) window.playNotificationSound();
      
      // איפוס שדה ההודעה
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const consultAI = (productName: string) => {
    setMessage(`אחי, אני רוצה להזמין ${productName}, תעזור לי עם כמויות ופחת.`);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#ece5dd] overflow-hidden font-sans" dir="rtl">
      
      {/* Header */}
      <header className="bg-[#075e54] text-white p-3 pt-10 shadow-lg flex justify-between items-center z-[100] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/ai.png" className="w-10 h-10 rounded-full border-2 border-white/20 bg-white shadow-sm"
               onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Saban+AI&background=075e54&color=fff"; }} />
          <div>
            <h1 className="font-bold text-lg leading-tight">ח.סבן Ai</h1>
            <span className="text-[10px] text-green-200 block italic">מוח מבצע פעיל</span>
          </div>
        </div>
        <div className="flex gap-4">
          <Truck size={24} onClick={() => setActiveTab('track')} className={activeTab === 'track' ? 'text-white' : 'text-green-200'} />
          <ShoppingBag size={24} onClick={() => setActiveTab('shop')} className={activeTab === 'shop' ? 'text-white' : 'text-green-200'} />
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="bg-[#075e54] text-white flex shrink-0 z-[90] shadow-md">
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'chat' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>צ'אט</button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'shop' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>מלאי</button>
        <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 text-sm font-bold border-b-4 transition-all ${activeTab === 'track' ? 'border-white opacity-100' : 'border-transparent opacity-60'}`}>מעקב ({activeOrders.length})</button>
      </nav>

      {/* Main Container */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 touch-pan-y z-10" 
            style={{ backgroundColor: "#e5ddd5", backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "400px" }}>
        
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] self-start text-sm border border-gray-200">
              אהלן ראמי אחי! המוח מוכן לביצוע. כל פקודה שתקליד כאן תעובד ותוזרק לסידור. 🦾
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-4">
            <div className="sticky top-0 z-20">
              <input type="text" placeholder="חפש מוצר במלאי..." 
                     className="w-full p-4 pr-12 rounded-2xl shadow-md border-none text-sm outline-none bg-white"
                     value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Search className="absolute right-4 top-4 text-gray-400" size={20} />
            </div>
            <div className="grid grid-cols-1 gap-3 pb-24">
              {inventory.filter(i => (i.product_name || "").includes(searchTerm)).map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border-r-8 border-green-600 active:scale-95 transition-all">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-gray-800 text-sm">{item.product_name}</h3>
                    <p className="text-[10px] text-gray-500 italic">מלאי: {item.stock_qty}</p>
                    <button onClick={() => consultAI(item.product_name)} className="text-[10px] text-blue-600 mt-2 font-bold flex items-center gap-1 underline italic">
                      <MessageCircle size={10} /> התייעץ עם המוח
                    </button>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <button onClick={() => { if(cart[item.id]>0) setCart({...cart, [item.id]: cart[item.id]-1})}} className="p-1 bg-white shadow-sm text-red-600 rounded-lg"><Minus size={20}/></button>
                    <span className="font-bold w-5 text-center text-sm">{cart[item.id] || 0}</span>
                    <button onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})} className="p-1 bg-white shadow-sm text-green-600 rounded-lg"><Plus size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-4 pb-24">
            {activeOrders.length === 0 ? (
              <div className="text-center py-24 opacity-30 italic">אין הזמנות פעילות</div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-lg border-r-8 border-green-600 animate-in slide-in-from-right">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{order.customer_name}</h3>
                    <span className="text-[9px] font-black bg-green-100 text-green-800 px-3 py-1 rounded-full">{order.status}</span>
                  </div>
                  <p className="text-xs text-gray-600">{order.order_id_comax}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer - המפתח לתיקון הבעיה (z-index גבוה ופונקציית שליחה) */}
      {activeTab === 'chat' && (
        <footer className="p-3 bg-[#f0f0f0] flex items-center gap-2 pb-10 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-[100]">
          <div className="flex-1 bg-white rounded-full px-5 py-3 shadow-md border border-gray-200">
            <input 
              type="text" 
              placeholder="כתוב פקודה למוח..." 
              className="w-full outline-none text-sm bg-transparent border-none focus:ring-0" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              autoFocus
            />
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={isLoading}
            className={`p-4 rounded-full shadow-xl transition-all flex items-center justify-center ${isLoading ? 'bg-gray-400' : 'bg-[#075e54] active:scale-90'}`}
          >
            <Send size={22} className={`text-white ${isLoading ? 'animate-pulse' : 'mr-1'}`} />
          </button>
        </footer>
      )}
    </div>
  );
}      <header className="bg-[#075e54] text-white p-3 pt-10 shadow-lg flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/ai.png" className="w-10 h-10 rounded-full border-2 border-white/20 bg-white" 
               onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Saban+AI&background=075e54&color=fff"; }} />
          <div>
            <h1 className="font-bold text-lg leading-tight">ח.סבן Ai</h1>
            <span className="text-[10px] text-green-200 block italic">מוח מבצע פעיל // מלאי חי</span>
          </div>
        </div>
        <div className="flex gap-4 opacity-90">
          <Truck size={24} onClick={() => setActiveTab('track')} className={activeTab === 'track' ? 'text-white' : 'text-green-200'} />
          <ShoppingBag size={24} onClick={() => setActiveTab('shop')} className={activeTab === 'shop' ? 'text-white' : 'text-green-200'} />
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#075e54] text-white flex shrink-0 shadow-md">
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'chat' ? 'border-white' : 'border-transparent opacity-60'}`}>צ'אט</button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'shop' ? 'border-white' : 'border-transparent opacity-60'}`}>מלאי</button>
        <button onClick={() => setActiveTab('track')} className={`flex-1 py-3 text-sm font-bold border-b-4 ${activeTab === 'track' ? 'border-white' : 'border-transparent opacity-60'}`}>מעקב ({activeOrders.length})</button>
      </nav>

      {/* Main Container - Scrollable */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 touch-pan-y" 
            style={{ backgroundColor: "#e5ddd5", backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "600px" }}>
        
        {activeTab === 'chat' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] self-start text-sm leading-relaxed border border-gray-200">
              אהלן ראמי אחי! אני מחובר לטבלת ה-Inventory שלך. כל פקודה שתיתן כאן תזריק ישירות לסידור או לסל. 🦾
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-4">
            <div className="sticky top-0 z-20 shadow-sm">
              <div className="relative">
                <input type="text" placeholder="חפש מוצר במלאי..." 
                       className="w-full p-4 pr-12 rounded-2xl border-none text-sm outline-none bg-white shadow-md"
                       value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <Search className="absolute right-4 top-4 text-gray-400" size={20} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 pb-24">
              {inventory.filter(i => (i.product_name || "").includes(searchTerm)).map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border-r-8 border-green-600 transition-transform active:scale-[0.98]">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.product_name}</h3>
                    <p className="text-[10px] text-gray-500 italic">מק"ט: {item.sku} | מלאי: {item.stock_qty}</p>
                    <button onClick={() => consultAI(item.product_name)} className="text-[10px] text-blue-600 mt-2 font-bold flex items-center gap-1 underline">
                      <MessageCircle size={10} /> התייעץ עם המוח
                    </button>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <button onClick={() => { if(cart[item.id]>0) setCart({...cart, [item.id]: cart[item.id]-1})}} className="p-1 bg-white shadow-sm text-red-600 rounded-lg"><Minus size={20}/></button>
                    <span className="font-bold w-5 text-center text-sm">{cart[item.id] || 0}</span>
                    <button onClick={() => setCart({...cart, [item.id]: (cart[item.id]||0)+1})} className="p-1 bg-white shadow-sm text-green-600 rounded-lg"><Plus size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-4 pb-24">
            {activeOrders.length === 0 ? (
              <div className="text-center py-24 opacity-30 italic">אין הזמנות בביצוע כרגע</div>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl shadow-lg border-r-8 border-[#25d366] animate-in slide-in-from-right duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#075e54]">{order.customer_name}</h3>
                    <span className="text-[9px] font-black bg-green-100 text-green-800 px-3 py-1 rounded-full uppercase italic">{order.status}</span>
                  </div>
                  <p className="text-[11px] text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">{order.order_id_comax}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 text-[10px] text-gray-400 font-bold border-t border-gray-50">
                    <span>🕒 {order.scheduled_time}</span>
                    <span>🚚 {order.driver_name || 'ממתין לשיבוץ'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer - WhatsApp Style */}
      {activeTab === 'chat' && (
        <footer className="p-3 bg-[#f0f0f0] flex items-center gap-2 pb-10 shrink-0 shadow-2xl z-50">
          <div className="flex-1 bg-white rounded-full px-5 py-3 shadow-md border border-gray-200">
            <input type="text" placeholder="כתוב פקודה למוח..." 
                   className="w-full outline-none text-sm bg-transparent" value={message}
                   onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button className="bg-[#075e54] text-white p-4 rounded-full shadow-xl active:scale-90 transition-all">
            <Send size={22} className="mr-1" />
          </button>
        </footer>
      )}
    </div>
  );
}
