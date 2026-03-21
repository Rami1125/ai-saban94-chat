"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutGrid, MessageSquare, History, Truck, 
  RefreshCcw, Trash2, PlusSquare, Package, 
  Send, Bell, Navigation, Phone, Menu, X, CheckCircle2
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SabanClientMagicApp() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'history'>('home');
  const [chatInput, setChatInput] = useState("");
  const [isNotifyActive, setIsNotifyActive] = useState(false);
  const supabase = getSupabase();

  // צליל פעמון עדין
  const playBell = () => {
    const audio = new Audio('/sounds/gentle-bell.mp3'); 
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (!customerId) return;
    const fetchData = async () => {
      const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).single();
      setCustomer(client);
      const { data: ordersData } = await supabase.from('saban_master_dispatch').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
      setOrders(ordersData || []);
    };
    fetchData();

    // OneSignal Integration (Placeholder logic)
    // window.OneSignal = window.OneSignal || [];
    // OneSignal.push(() => { OneSignal.init({ appId: "YOUR_ONESIGNAL_ID" }); });
  }, [customerId, supabase]);

  // הזרקת פקודה מהירה לצ'אט
  const injectCommand = (action: string, details: string = "") => {
    playBell();
    const command = `[בקשה מלקוח: ${action}] ${details}`;
    setChatInput(command);
    setActiveTab('chat');
    toast.success(`הפעולה ${action} הוכנה לשליחה לסידור`);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans pb-32" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header יוקרתי - לוגו ח. סבן */}
      <header className="p-6 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <span className="text-xl font-black italic">S</span>
          </div>
          <div>
            <h1 className="text-xl font-black italic text-slate-800 leading-none">ח. סבן</h1>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.2em]">Premium Logistics</p>
          </div>
        </div>
        <button onClick={() => setIsNotifyActive(!isNotifyActive)} className="relative p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all">
          <Bell size={20} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-8">
        
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* כרטיס ברוך הבא */}
            <section>
              <h2 className="text-2xl font-black text-slate-800 italic mb-1">אהלן, {customer?.full_name?.split(' ')[0] || 'אורח'} 👋</h2>
              <p className="text-sm font-bold text-slate-400">מה נבצע היום בפרויקט ב{customer?.address}?</p>
            </section>

            {/* כפתורי שער ריבועיים - פעולות מהירות */}
            <section className="grid grid-cols-2 gap-4">
              <button onClick={() => injectCommand("הזמנת חומר", "חומרי בניין")} className="aspect-square bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
                <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all"><PlusSquare size={28}/></div>
                <span className="font-black text-sm italic">הזמנה חדשה</span>
              </button>
              <button onClick={() => injectCommand("החלפה", "מכולה קיימת")} className="aspect-square bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
                <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all"><RefreshCcw size={28}/></div>
                <span className="font-black text-sm italic">בקשת החלפה</span>
              </button>
              <button onClick={() => injectCommand("פינוי/הוצאה")} className="aspect-square bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
                <div className="p-4 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all"><Trash2 size={28}/></div>
                <span className="font-black text-sm italic">בקשת פינוי</span>
              </button>
              <button onClick={() => injectCommand("הצבה", "מכולה חדשה")} className="aspect-square bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
                <div className="p-4 bg-green-50 text-green-500 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all"><Navigation size={28}/></div>
                <span className="font-black text-sm italic">בקשת הצבה</span>
              </button>
            </section>

            {/* הזמנות חיות */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black italic text-slate-800">מעקב משלוחים חי</h3>
                <span className="text-[10px] font-black text-blue-600 animate-pulse">LIVE TRACKING</span>
              </div>
              {orders.slice(0, 2).map(order => (
                <Card key={order.id} className="p-5 border-none shadow-sm rounded-[2rem] bg-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600"><Truck size={24}/></div>
                    <div>
                      <p className="font-black text-xs italic">{order.container_action} | {order.order_id_comax}</p>
                      <p className="text-[10px] font-bold text-slate-400">{order.status}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </Card>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[70vh] flex flex-col animate-in slide-in-from-left duration-500">
             <Card className="flex-1 bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden flex flex-col">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white"><MessageSquare size={18}/></div>
                  <div>
                    <p className="font-black text-sm italic text-slate-800">צאט פקודות AI</p>
                    <p className="text-[9px] font-bold text-green-500 uppercase">מחובר ישירות לראמי</p>
                  </div>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                   <div className="bg-blue-50 p-4 rounded-3xl rounded-br-none max-w-[85%]">
                      <p className="text-xs font-bold text-blue-900 leading-relaxed">
                        אהלן בר, המפקד! אני רואה שהזרקת פקודה. לחץ על החץ למטה כדי לשלוח אותה לאישור של ראמי בסידור.
                      </p>
                   </div>
                </div>
                <div className="p-4 flex gap-2">
                  <input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="כתוב הודעה או בחר פעולה..."
                    className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-4 text-xs font-bold outline-none text-right"
                  />
                  <button onClick={playBell} className="bg-blue-700 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all">
                    <Send size={20}/>
                  </button>
                </div>
             </Card>
          </div>
        )}
      </main>

      {/* תפריט תחתון (Floating Glassmorphism) */}
      <div className="fixed bottom-8 left-8 right-8 z-[100]">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex justify-between items-center px-10">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-blue-700 scale-110' : 'text-slate-300'}`}>
            <LayoutGrid size={24} />
            <span className="text-[8px] font-black uppercase">ראשי</span>
          </button>
          
          <button onClick={() => setActiveTab('chat')} className="relative -mt-16">
            <div className="w-20 h-20 bg-blue-700 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-300 ring-[12px] ring-[#FDFDFD] active:scale-90 transition-all">
              <MessageSquare size={32} />
            </div>
          </button>

          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-blue-700 scale-110' : 'text-slate-300'}`}>
            <History size={24} />
            <span className="text-[8px] font-black uppercase">היסטוריה</span>
          </button>
        </div>
      </div>
    </div>
  );
}
