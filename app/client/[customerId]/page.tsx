"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { useParams, useRouter } from 'next/navigation';
import {
  Menu, Bell, User, PackagePlus, Truck, History, MessageSquare,
  MapPin, Send, Mic, ChevronLeft, Package, CheckCircle2, Clock, 
  Sparkles, Loader2, LayoutGrid, ClipboardPaste, X, ShoppingCart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast, Toaster } from "sonner";

export default function SabanOSClientApp() {
  const { customerId } = useParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<"home" | "chat" | "history">("home");
  const [customer, setCustomer] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = getSupabase();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- סנכרון נתונים ---
  const fetchData = useCallback(async () => {
    if (!customerId) return;
    try {
      const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).maybeSingle();
      const { data: ords } = await supabase.from('saban_master_dispatch').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
      setCustomer(client);
      setActiveOrder(ords?.find(o => o.status !== 'סופקה') || null);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [customerId, supabase]);

  useEffect(() => { 
    fetchData();
    const sub = supabase.channel('client_live').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  // --- פונקציית שיגור טיל (שליחה לסידור) ---
  const launchBallisticOrder = async (parsedItems: any[]) => {
    setIsThinking(true);
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const { error } = await supabase.from('saban_master_dispatch').insert([{
      customer_id: customerId,
      customer_name: customer?.full_name,
      address: customer?.address,
      container_action: 'הזמנת חומר',
      status: 'הזמנה התקבלה',
      order_id_comax: orderId,
      created_by: 'AI טיל בליסטי'
    }]);

    if (!error) {
      setMessages(prev => [...prev, { 
        role: "ai", 
        text: `🚀 הטיל הבליסטי שוגר בהצלחה! מספר הזמנה: ${orderId}. ראמי התחיל להכין את הציוד. תהיה ליד מרחב מוגן!`,
        timestamp: new Date() 
      }]);
      toast.success("שוגר לסידור! 🚀");
    }
    setIsThinking(false);
  };

  // --- טיפול בהודעות צאט ולוגיקת הפיענוח ---
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text, timestamp: new Date() }]);
    setInputValue("");
    setIsThinking(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, mode: 'ballistic_order' })
      });
      const data = await res.json();
      
      // אם המוח זיהה רשימה, נציג קנבס
      if (data.parsedItems) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          text: `אהלן בר! אני מוכן. הנה מה שזיהיתי ברשימה שלך. מוכן לשיגור?`, 
          canvas: data.parsedItems,
          timestamp: new Date() 
        }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: data.answer || "קיבלתי, מעבד...", timestamp: new Date() }]);
      }
    } catch (e) { toast.error("נתק בשיגור"); }
    setIsThinking(false);
  };

  if (loading) return <div className="h-screen bg-white flex items-center justify-center font-black text-blue-800 animate-pulse italic">SABAN OS CONNECTING...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 backdrop-blur-xl bg-white/70 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0B2C63] rounded-2xl flex items-center justify-center shadow-lg"><span className="text-white font-black italic">S</span></div>
          <h1 className="text-lg font-black text-[#0B2C63]">SABAN OS</h1>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center"><User size={20} className="text-blue-900" /></div>
      </header>

      <main className="px-5 pb-32 pt-6">
        {activeView === "home" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <section>
              <h2 className="text-3xl font-black text-slate-800 italic tracking-tighter">שלום, {customer?.full_name?.split(' ')[0]} 👋</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1 mt-1"><MapPin size={12}/> {customer?.address}</p>
            </section>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              {/* כפתור הטיל הבליסטי */}
              <button onClick={() => { setActiveView('chat'); handleSendMessage("הדבקת הזמנה מהירה 🚀"); }} 
                className="group relative aspect-square p-5 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all overflow-hidden">
                <div className="p-4 rounded-2xl bg-orange-500 text-white shadow-orange-200 shadow-lg animate-pulse"><ClipboardPaste size={32}/></div>
                <span className="font-black text-slate-800 text-xs">הדבקת רשימה</span>
              </button>

              <button onClick={() => activeOrder && router.push(`/track/${activeOrder.order_id_comax}`)} 
                className={`aspect-square p-5 rounded-[2.5rem] bg-white border shadow-xl flex flex-col items-center justify-center gap-3 transition-all ${activeOrder ? 'border-blue-200 animate-pulse-slow' : 'opacity-40 pointer-events-none'}`}>
                <div className={`p-4 rounded-2xl ${activeOrder ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}><Truck size={32}/></div>
                <span className="font-black text-slate-800 text-xs italic">מעקב משלוח</span>
              </button>
            </div>

            {/* כרטיס סטטוס מהיר */}
            {activeOrder && (
              <Card className="p-6 rounded-[2.5rem] bg-[#0B2C63] text-white border-none shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <Badge className="bg-orange-500 text-white border-none font-black italic">{activeOrder.status}</Badge>
                  <p className="text-[10px] font-bold opacity-60 uppercase italic">Order #{activeOrder.order_id_comax}</p>
                </div>
                <h3 className="text-xl font-black italic mb-2">{activeOrder.container_action} בדרך</h3>
                <button onClick={() => router.push(`/track/${activeOrder.order_id_comax}`)} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-2xl font-black text-xs transition-all">לפרטי מעקב מלאים</button>
              </Card>
            )}
          </div>
        )}

        {activeView === "chat" && (
            <div className="h-[calc(100vh-220px)] flex flex-col animate-in slide-in-from-left-4">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setActiveView('home')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ChevronLeft size={20}/></button>
                    <h2 className="text-xl font-black italic text-slate-800">המוח של סבן</h2>
                </div>
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto rounded-[2.5rem] bg-slate-50/50 border border-slate-100 p-6 space-y-6 no-scrollbar">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}>
                            <div className={`max-w-[85%] p-5 rounded-[2rem] font-bold text-sm shadow-sm ${m.role === 'user' ? 'bg-white text-slate-800 rounded-br-none' : 'bg-[#0B2C63] text-white rounded-bl-none'}`}>
                                {m.text}
                            </div>
                            {/* רכיב קנבס בתוך הצאט */}
                            {m.canvas && (
                              <div className="mt-4 w-full bg-white p-5 rounded-3xl border-2 border-orange-500 shadow-2xl animate-in zoom-in">
                                 <div className="flex items-center gap-2 mb-4 text-orange-600 font-black italic border-b pb-2"><ShoppingCart size={18}/> הקנבס של סבן</div>
                                 <div className="space-y-2 mb-6">
                                    {m.canvas.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center text-xs font-black bg-slate-50 p-3 rounded-xl border border-slate-100">
                                         <span>{item.product}</span>
                                         <Badge className="bg-blue-100 text-blue-700 border-none">{item.qty}</Badge>
                                      </div>
                                    ))}
                                 </div>
                                 <button onClick={() => launchBallisticOrder(m.canvas)} className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">שגר רשימה לסידור! 🚀</button>
                              </div>
                            )}
                        </div>
                    ))}
                    {isThinking && <Loader2 className="animate-spin text-blue-600 mx-auto" />}
                </div>
                <div className="mt-4 p-3 bg-white rounded-[2.2rem] shadow-2xl border border-slate-50 flex items-center gap-3">
                    <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputValue)} placeholder="כתוב פקודה או הדבק רשימה..." className="flex-1 bg-transparent font-black text-right outline-none text-sm px-4" />
                    <button onClick={() => handleSendMessage(inputValue)} className="p-4 bg-[#0B2C63] text-white rounded-2xl shadow-lg"><Send size={20}/></button>
                </div>
            </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-8 left-6 right-6 z-50">
        <div className="flex items-center justify-around p-3 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl">
            {[
                { id: 'home', icon: LayoutGrid, label: 'ראשי' },
                { id: 'chat', icon: MessageSquare, label: 'צאט AI' },
                { id: 'history', icon: History, label: 'היסטוריה' }
            ].map(item => (
                <button key={item.id} onClick={() => setActiveView(item.id as any)} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeView === item.id ? 'bg-[#0B2C63] text-white shadow-xl scale-110' : 'text-slate-400'}`}>
                    <item.icon size={20}/>
                    <span className="text-[10px] font-black">{item.label}</span>
                </button>
            ))}
        </div>
      </nav>
    </div>
  );
}
