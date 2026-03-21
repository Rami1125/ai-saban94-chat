"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, X, Truck, Package, History, MessageSquare, 
  Send, MapPin, Clock, RefreshCcw, Trash2, ChevronRight, Loader2, Bell
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SabanClientApp() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'chat' | 'history'>('live');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const supabase = getSupabase();

  useEffect(() => {
    if (!customerId) return;
    
    const fetchData = async () => {
      setLoading(true);
      const cleanId = customerId.toString();
      
      // 1. משיכת פרטי לקוח
      const { data: clientData } = await supabase
        .from('saban_customers')
        .select('*')
        .eq('customer_id', cleanId)
        .single();
      
      setCustomer(clientData);

      // 2. משיכת הזמנות חיות והיסטוריה
      const { data: ordersData } = await supabase
        .from('saban_master_dispatch')
        .select('*')
        .eq('customer_id', cleanId)
        .order('created_at', { ascending: false });

      setOrders(ordersData || []);
      setLoading(false);
    };

    fetchData();
    
    // Realtime - עדכון אוטומטי כשאיש הסידור (אתה) משנה משהו
    const channel = supabase.channel(`client_${customerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [customerId, supabase]);

  // פונקציה להזרקת פקודת "החלפת מכולה" מהצ'אט של הלקוח
  const requestExchange = (order: any) => {
    const cmd = `[CLIENT_REQUEST: EXCHANGE | ORDER: ${order.order_id_comax} | LOC: ${order.address}]`;
    setChatInput(cmd);
    setActiveTab('chat');
    toast.info("הפקודה הוזרקה לצ'אט - לחץ שלח לאישור");
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-black italic">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48}/>
        <p className="animate-pulse">מתחבר לפורטל ח. סבן...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header יוקרתי עם המבורגר */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between shadow-sm">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><Menu size={24}/></button>
        <div className="text-center">
            <h1 className="text-xl font-black italic text-blue-700 tracking-tighter">ח. סבן</h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Client Portal</p>
        </div>
        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black italic text-xs border border-blue-100 uppercase">
            {customer?.full_name?.substring(0,2) || "SB"}
        </div>
      </header>

      {/* תפריט המבורגר צדדי */}
      <div className={`fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <aside className={`absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} p-6 flex flex-col`}>
            <div className="flex justify-between items-center mb-10">
                <span className="font-black italic text-blue-700">תפריט לקוח</span>
                <button onClick={() => setIsMenuOpen(false)}><X/></button>
            </div>
            <nav className="space-y-4 flex-1">
                {[
                    { id: 'live', label: 'הזמנות חיות', icon: <Truck size={20}/> },
                    { id: 'chat', label: 'צ\'אט סיוע AI', icon: <MessageSquare size={20}/> },
                    { id: 'history', label: 'היסטוריית עבודות', icon: <History size={20}/> }
                ].map(item => (
                    <button key={item.id} onClick={() => {setActiveTab(item.id as any); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}>
                        {item.icon} {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase">מנהל תיק: ראמי</p>
                <button className="text-[10px] text-blue-600 font-bold underline mt-1">חיוג מהיר למשרד</button>
            </div>
        </aside>
      </div>

      {/* תוכן דינמי */}
      <main className="p-4 max-w-2xl mx-auto space-y-6">
        
        {activeTab === 'live' && (
            <div className="space-y-4 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-2 px-2">
                    <h2 className="text-lg font-black text-slate-800 italic">הזמנות בביצוע</h2>
                    <Badge className="bg-green-50 text-green-600 border-none font-black italic">Live</Badge>
                </div>
                {orders.filter(o => o.status !== 'הושלם').map(order => (
                    <Card key={order.id} className="bg-white border-none rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all overflow-hidden relative border-r-4 border-blue-600">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Package size={20}/></div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">{order.container_action} | {order.order_id_comax}</h3>
                                    <p className="text-[10px] font-bold text-slate-400">{order.address}</p>
                                </div>
                            </div>
                            <Badge className="bg-blue-600 text-white border-none font-black text-[9px] px-3 py-1 uppercase">{order.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-50 pt-4">
                            <button onClick={() => requestExchange(order)} className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 py-3 rounded-xl font-black text-[10px] hover:bg-blue-50 hover:text-blue-700 transition-all">
                                <RefreshCcw size={14}/> בקש החלפה
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 py-3 rounded-xl font-black text-[10px] hover:bg-red-50 hover:text-red-600 transition-all">
                                <Trash2 size={14}/> בקש פינוי
                            </button>
                        </div>
                    </Card>
                ))}
                {orders.filter(o => o.status !== 'הושלם').length === 0 && (
                    <div className="text-center py-20 opacity-30 font-black italic">אין עבודות פעילות כרגע</div>
                )}
            </div>
        )}

        {activeTab === 'chat' && (
            <div className="h-[70vh] flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-500">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"><MessageSquare size={16}/></div>
                    <p className="font-black text-xs text-slate-700 italic underline decoration-blue-500 underline-offset-4">סייען ה-AI של ח. סבן</p>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    <div className="flex justify-start">
                        <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none font-bold text-xs max-w-[80%]">
                            שלום בר, אני כאן לכל שאלה. אפשר להזמין חומר, לבקש החלפת מכולה או לשלוח רשימת מוצרים.
                        </div>
                    </div>
                    {/* כאן תבוא היסטוריית הצ'אט של הלקוח */}
                </div>
                <div className="p-4 border-t border-slate-50 flex gap-2">
                    <input 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)} 
                        placeholder="כתוב כאן..." 
                        className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-xs font-bold outline-none text-right"
                    />
                    <button className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all">
                        <Send size={18}/>
                    </button>
                </div>
            </div>
        )}

      </main>

      {/* תפריט תחתון קבוע (Bottom Navigation) */}
      <nav className="fixed bottom-6 left-6 right-6 z-50">
        <Card className="bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex justify-around items-center ring-4 ring-black/5">
            <button onClick={() => setActiveTab('live')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'live' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
                <Truck size={24}/>
                <span className="text-[9px] font-black uppercase">חי</span>
            </button>
            <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
                <div className="p-3 bg-blue-600 text-white rounded-full -mt-8 shadow-xl ring-8 ring-[#F8FAFC]">
                    <MessageSquare size={24}/>
                </div>
                <span className="text-[9px] font-black uppercase mt-1 tracking-tighter italic">צאט פקודות</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
                <History size={24}/>
                <span className="text-[9px] font-black uppercase">עבר</span>
            </button>
        </Card>
      </nav>
    </div>
  );
}
