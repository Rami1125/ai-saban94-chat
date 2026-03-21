"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { useParams, useRouter } from 'next/navigation';
import {
  Menu, X, Bell, User, PackagePlus, Truck, History, MessageSquare,
  MapPin, Send, Mic, ChevronLeft, Package, CheckCircle2, Clock, Navigation,
  Sparkles, Loader2, LayoutGrid
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";

export default function SabanPortalFinal() {
  const { customerId } = useParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<"home" | "chat" | "history">("home");
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null); // הזמנה חיה למעקב
  const [messages, setMessages] = useState<any[]>([
    { id: "1", role: "ai", text: "שלום בר! אני המוח של ח. סבן. איך אפשר לעזור היום?", timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabase();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- שליפת נתונים וזיהוי הזמנה חיה ---
  const fetchData = useCallback(async () => {
    if (!customerId) return;
    try {
      const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).maybeSingle();
      const { data: ords } = await supabase.from('saban_master_dispatch')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      setCustomer(client);
      setOrders(ords || []);
      
      // מציאת ההזמנה הראשונה שאינה "סופקה" לצורך הבהוב הכפתור
      const live = ords?.find(o => o.status !== 'סופקה');
      setActiveOrder(live || null);

    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [customerId, supabase]);

  useEffect(() => { 
    fetchData();
    // סנכרון Realtime - אם ראמי משנה סטטוס בסידור, הכפתור יתחיל להבהב אצל הלקוח
    const sub = supabase.channel('client_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text, timestamp: new Date() }]);
    setIsThinking(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: "ai", text: "קיבלתי, בודק מול ראמי בסידור ומעדכן.", timestamp: new Date() }]);
      setIsThinking(false);
    }, 1500);
  };

  if (loading) return <div className="h-screen bg-white flex items-center justify-center font-black text-blue-800 animate-pulse italic uppercase">Saban OS Premium...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 px-5 py-4 backdrop-blur-xl bg-white/70 border-b border-white/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black italic">S</span>
          </div>
          <h1 className="text-lg font-black text-[#0B2C63]">SABAN OS</h1>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-[#0B2C63] flex items-center justify-center text-white"><User size={20} /></div>
        </div>
      </header>

      <main className="px-5 pb-32 pt-6">
        {activeView === "home" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <section>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">שלום, {customer?.full_name?.split(' ')[0] || 'בר'}! 👋</h2>
              <p className="text-slate-400 font-bold text-xs flex items-center gap-1 mt-1 uppercase tracking-widest"><MapPin size={12}/> {customer?.address}</p>
            </section>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* הזמנה חדשה */}
              <button onClick={() => { setActiveView('chat'); handleSendMessage("אני רוצה להזמין מכולה חדשה"); }} 
                className="group relative aspect-square p-5 rounded-[2.5rem] bg-white border border-white shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
                <div className="p-4 rounded-2xl bg-blue-50 text-[#0B2C63] shadow-sm group-hover:bg-[#0B2C63] group-hover:text-white transition-all"><PackagePlus size={28}/></div>
                <span className="font-black text-slate-800 text-sm tracking-tight">הזמנה חדשה</span>
              </button>

              {/* כפתור מעקב אחר הזמנה - עם הבהוב דינמי */}
              <button 
                onClick={() => activeOrder ? router.push(`/track/${activeOrder.order_id_comax}`) : toast.error("אין הזמנה פעילה למעקב")} 
                className={`group relative aspect-square p-5 rounded-[2.5rem] bg-white border shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all
                  ${activeOrder ? 'border-orange-200 ring-4 ring-orange-500/10 animate-pulse' : 'border-white opacity-60'}`}
              >
                {activeOrder && (
                  <div className="absolute top-4 left-4 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                )}
                <div className={`p-4 rounded-2xl transition-all ${activeOrder ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-slate-50 text-slate-400'}`}>
                  <Truck size={28}/>
                </div>
                <span className={`font-black text-sm tracking-tight ${activeOrder ? 'text-orange-600' : 'text-slate-400'}`}>
                  {activeOrder ? 'עקוב אחר משלוח' : 'אין משלוח'}
                </span>
              </button>

              {/* היסטוריה */}
              <button onClick={() => setActiveView('history')} 
                className="group relative aspect-square p-5 rounded-[2.5rem] bg-white border border-white shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
                <div className="p-4 rounded-2xl bg-slate-50 text-slate-600 shadow-sm group-hover:bg-slate-800 group-hover:text-white transition-all"><History size={28}/></div>
                <span className="font-black text-slate-800 text-sm tracking-tight">היסטוריה</span>
              </button>

              {/* דבר עם ראמי */}
              <button onClick={() => { setActiveView('chat'); handleSendMessage("אני צריך לדבר עם ראמי"); }} 
                className="group relative aspect-square p-5 rounded-[2.5rem] bg-white border border-white shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all"><MessageSquare size={28}/></div>
                <span className="font-black text-slate-800 text-sm tracking-tight">דבר עם ראמי</span>
              </button>
            </div>

            {/* כרטיס סטטוס מהיר בבית */}
            {activeOrder && (
              <Card className="p-6 rounded-[2.5rem] bg-[#0B2C63] text-white border-none shadow-2xl relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="flex justify-between items-center mb-4">
                  <Badge className="bg-orange-500 text-white border-none font-black italic">{activeOrder.status}</Badge>
                  <p className="text-[10px] font-bold opacity-60 uppercase italic">Active Order #{activeOrder.order_id_comax}</p>
                </div>
                <h3 className="text-xl font-black italic mb-4">{activeOrder.container_action} בדרך אליך</h3>
                <button onClick={() => router.push(`/track/${activeOrder.order_id_comax}`)} className="w-full bg-white text-[#0B2C63] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                  פתח מעקב חי <ChevronLeft size={14}/>
                </button>
              </Card>
            )}
          </div>
        )}

        {activeView === "chat" && (
            <div className="h-[calc(100vh-220px)] flex flex-col animate-in slide-in-from-left-4 duration-500">
                {/* צאט AI זהה לקוד הקודם... */}
                <div className="flex-1 overflow-y-auto rounded-[2.5rem] bg-slate-50/50 border border-slate-100 p-6 space-y-6 no-scrollbar">
                    {messages.map(m => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-5 rounded-[2rem] font-bold text-sm shadow-sm ${m.role === 'user' ? 'bg-white text-slate-800 rounded-bl-none' : 'bg-[#0B2C63] text-white rounded-br-none italic'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && <Loader2 className="mx-auto text-blue-600 animate-spin" />}
                </div>
                <div className="mt-4 p-3 bg-white rounded-[2.2rem] shadow-2xl border border-slate-50 flex items-center gap-3">
                    <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputValue)} placeholder="כתוב פקודה..." className="flex-1 bg-transparent font-black text-right outline-none text-sm px-4" />
                    <button onClick={() => handleSendMessage(inputValue)} className="p-4 bg-[#0B2C63] text-white rounded-2xl shadow-lg"><Send size={20}/></button>
                </div>
            </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-8 left-6 right-6 z-50">
        <div className="flex items-center justify-around p-3 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl ring-8 ring-black/5">
            {[
                { id: 'home', icon: LayoutGrid, label: 'ראשי' },
                { id: 'chat', icon: MessageSquare, label: 'צאט' },
                { id: 'history', icon: History, label: 'היסטוריה' }
            ].map(item => (
                <button key={item.id} onClick={() => setActiveView(item.id as any)} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeView === item.id ? 'bg-[#0B2C63] text-white shadow-xl' : 'text-slate-400'}`}>
                    <item.icon size={20}/>
                    <span className="text-[10px] font-black">{item.label}</span>
                </button>
            ))}
        </div>
      </nav>
    </div>
  );
}
