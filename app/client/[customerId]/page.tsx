"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, X, Truck, History, MessageSquare, 
  ChevronLeft, MapPin, Clock, RefreshCcw, 
  Trash2, Send, LayoutGrid, Bell, CheckCircle2, 
  ArrowLeftRight, PackagePlus, Loader2
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SabanClientAirApp() {
  const { customerId } = useParams();
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'chat'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    if (!customerId) return;
    const cleanId = customerId.toString();
    
    // משיכת פרטי לקוח והזמנות בסנכרון מלא למאסטר
    const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', cleanId).single();
    const { data: ordersData } = await supabase.from('saban_master_dispatch')
      .select('*')
      .eq('customer_id', cleanId)
      .order('created_at', { ascending: false });

    setCustomer(client);
    setOrders(ordersData || []);
    setLoading(false);
  }, [customerId, supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel(`client_air_${customerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, customerId, supabase]);

  // שליחת פקודה מהירה למאסטר (המלשינון שראית בסידור)
  const sendQuickRequest = async (action: string, orderDetails?: any) => {
    toast.loading(`מעבד בקשת ${action}...`);
    const { error } = await supabase.from('saban_customer_requests').insert([{
        customer_id: customerId,
        action_type: action,
        details: orderDetails || { address: customer?.address },
        status: 'pending'
    }]);

    if (!error) {
        toast.dismiss();
        toast.success("הבקשה נשלחה לראמי בסידור! תקבל התראה כשיאושר.");
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
    }
  };

  if (loading) return <div className="h-screen bg-white flex flex-col items-center justify-center font-black italic text-blue-700 animate-pulse text-xl uppercase tracking-tighter">Saban Client Air...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans pb-32" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* --- Glass Header --- */}
      <header className="sticky top-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-100 p-5 flex items-center justify-between">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-50 rounded-2xl transition-all border-none"><Menu size={24}/></button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic text-blue-700 tracking-tighter leading-none">ח. סבן</h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Premium Client Portal</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Bell size={20}/>
        </div>
      </header>

      {/* --- Sidebar Menu --- */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm transition-all flex justify-end">
              <aside className="w-80 bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right duration-300 flex flex-col">
                  <div className="flex justify-between items-center mb-12">
                      <span className="font-black italic text-blue-700">תפריט לקוח</span>
                      <button onClick={() => setIsMenuOpen(false)} className="bg-slate-50 p-2 rounded-full border-none"><X size={20}/></button>
                  </div>
                  <nav className="space-y-4 flex-1">
                      {[
                        { id: 'home', label: 'מרכז בקרה', icon: <LayoutGrid size={22}/> },
                        { id: 'history', label: 'היסטוריית הזמנות', icon: <History size={22}/> },
                        { id: 'chat', label: 'צאט פקודות AI', icon: <MessageSquare size={22}/> }
                      ].map(item => (
                          <button key={item.id} onClick={() => {setActiveTab(item.id as any); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 p-5 rounded-[2rem] font-black transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                              {item.icon} {item.label}
                          </button>
                      ))}
                  </nav>
                  <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2 italic">תמיכה ישירה</p>
                      <button className="text-sm font-black text-blue-700 flex items-center gap-2 underline decoration-2 underline-offset-4">דבר עם ראמי <ChevronLeft size={16}/></button>
                  </div>
              </aside>
          </div>
      )}

      {/* --- Main Content --- */}
      <main className="p-6 max-w-xl mx-auto space-y-8">
        
        {/* --- Home View: Live Radar --- */}
        {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <section>
                    <h2 className="text-3xl font-black text-slate-800 italic tracking-tight">שלום, {customer?.full_name?.split(' ')[0]} 👋</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase italic tracking-widest">{customer?.address}</p>
                </section>

                {/* Live Order Card (המהבהב) */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-black italic text-slate-800">פעילות חיה בשטח</h3>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div><span className="text-[10px] font-black text-green-600">LIVE</span></div>
                    </div>
                    {orders.filter(o => o.status !== 'הושלם').map(order => (
                        <Card key={order.id} className="p-6 rounded-[2.5rem] bg-white border-none shadow-xl shadow-slate-200/50 relative overflow-hidden ring-1 ring-slate-100 animate-pulse-slow">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center animate-bounce shadow-inner">
                                        <Truck size={28}/>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1 italic">משלוח פעיל</p>
                                        <h4 className="text-xl font-black text-slate-800 italic leading-none">{order.container_action || 'הובלה'}</h4>
                                    </div>
                                </div>
                                <Badge className="bg-blue-600 text-white border-none font-black text-[10px] px-3 py-1 italic uppercase tracking-tighter">{order.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-50 pt-6 font-black italic">
                                <button onClick={() => sendQuickRequest('החלפה', order)} className="bg-slate-50 text-slate-600 p-4 rounded-2xl flex flex-col items-center gap-1 hover:bg-blue-50 hover:text-blue-700 transition-all text-[10px]">
                                    <RefreshCcw size={18}/> בקש החלפה
                                </button>
                                <button onClick={() => sendQuickRequest('פינוי', order)} className="bg-slate-50 text-slate-600 p-4 rounded-2xl flex flex-col items-center gap-1 hover:bg-red-50 hover:text-red-600 transition-all text-[10px]">
                                    <Trash2 size={18}/> בקש פינוי
                                </button>
                            </div>
                        </Card>
                    ))}
                    {orders.filter(o => o.status !== 'הושלם').length === 0 && (
                        <Card className="p-10 rounded-[2.5rem] bg-slate-50/50 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center text-slate-300">
                            <PackagePlus size={48} className="mb-4 opacity-20"/>
                            <p className="font-black italic text-sm">אין עבודות פעילות כרגע</p>
                            <button onClick={() => setActiveTab('chat')} className="mt-4 text-xs font-black text-blue-600 underline underline-offset-4 italic">פתח הזמנה חדשה</button>
                        </Card>
                    )}
                </section>

                {/* Quick Actions Grid */}
                <section className="grid grid-cols-2 gap-4">
                    <button onClick={() => sendQuickRequest('הצבה')} className="bg-white p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 border border-slate-100 hover:shadow-xl transition-all group">
                        <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all"><PlusSquare size={24}/></div>
                        <span className="font-black italic text-xs">הזמנה חדשה</span>
                    </button>
                    <button onClick={() => setActiveTab('history')} className="bg-white p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center gap-3 border border-slate-100 hover:shadow-xl transition-all group">
                        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-slate-800 group-hover:text-white transition-all"><History size={24}/></div>
                        <span className="font-black italic text-xs">היסטוריית תיק</span>
                    </button>
                </section>
            </div>
        )}

        {/* --- History View --- */}
        {activeTab === 'history' && (
            <div className="space-y-6 animate-in slide-in-from-left duration-500">
                <h3 className="text-xl font-black italic text-slate-800 mr-2">היסטוריית פרויקט</h3>
                {orders.filter(o => o.status === 'הושלם').map(order => (
                    <Card key={order.id} className="p-6 rounded-[2.5rem] bg-white border-none shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 text-slate-300 rounded-2xl"><CheckCircle2 size={24}/></div>
                            <div>
                                <p className="font-black text-slate-800 italic text-sm">{order.container_action} | #{order.order_id_comax}</p>
                                <p className="text-[10px] font-bold text-slate-400 italic leading-none">{new Date(order.created_at).toLocaleDateString('he-IL')}</p>
                            </div>
                        </div>
                        <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all border-none"><ChevronLeft size={18}/></button>
                    </Card>
                ))}
            </div>
        )}

      </main>

      {/* --- Floating Navigation (Air Glass) --- */}
      <nav className="fixed bottom-8 left-8 right-8 z-[150]">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[3rem] p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] flex justify-around items-center px-12 ring-8 ring-black/5">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-blue-700 scale-110' : 'text-slate-300'}`}>
                <LayoutGrid size={24} />
            </button>
            <button onClick={() => setActiveTab('chat')} className="relative -mt-16">
                <div className="w-20 h-20 bg-blue-700 rounded-[2.2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-400/50 ring-[12px] ring-[#FDFDFD] active:scale-90 transition-all">
                    <MessageSquare size={32} />
                </div>
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-blue-700 scale-110' : 'text-slate-300'}`}>
                <History size={24} />
            </button>
        </div>
      </nav>
    </div>
  );
}

// תוספת קטנה ל-tailwind.config.js (או להוסיף ב-CSS גלובלי) להנפשת ההבהוב העדין:
// @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
// .animate-pulse-slow { animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
