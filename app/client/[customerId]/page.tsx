"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { useParams } from 'next/navigation';
import {
  Menu, X, Bell, User, PackagePlus, Truck, History, MessageSquare,
  MapPin, Send, Mic, ChevronLeft, Package, CheckCircle2, Clock, Navigation,
  Sparkles, Loader2
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";

// --- Types ---
type Message = { id: string; role: "ai" | "user"; text: string; timestamp: Date; };
type OrderStatus = "preparation" | "on_the_way" | "delivered";

export default function SabanPortalFinal() {
  const { customerId } = useParams();
  const [activeView, setActiveView] = useState<"home" | "chat" | "track" | "history">("home");
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", text: "שלום בר! אני המוח של ח. סבן. איך אפשר לעזור היום?", timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatContext, setChatContext] = useState<"default" | "success" | "active" | "urgent">("default");
  const [loading, setLoading] = useState(true);

  const supabase = getSupabase();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- Fetch Real Data ---
  const fetchData = useCallback(async () => {
    if (!customerId) return;
    try {
      const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).maybeSingle();
      const { data: ords } = await supabase.from('saban_master_dispatch').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
      const { data: projs } = await supabase.from('saban_projects').select('*').eq('customer_id', customerId);
      
      setCustomer(client);
      setOrders(ords || []);
      setProjects(projs || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [customerId, supabase]);

  useEffect(() => { 
    fetchData();
    // הרשאת OneSignal/Location מדומה
    if ("Notification" in window) Notification.requestPermission();
  }, [fetchData]);

  // --- Chat Logic & Real Commands ---
  const handleSendMessage = async (overrideInput?: string) => {
    const text = overrideInput || inputValue;
    if (!text.trim() || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsThinking(true);

    // לוגיקה חכמה לפי מילים
    let aiResponse = "";
    let newContext: typeof chatContext = "default";

    if (text.includes("הזמנה") || text.includes("מכולה")) {
      aiResponse = "מצוין בר. אני פותח הזמנה חדשה לפרויקט בויצמן 4. הצבה או החלפה?";
      newContext = "active";
      // שליחת בקשה ל-DB
      await supabase.from('saban_customer_requests').insert([{ customer_id: customerId, action_type: 'NEW_ORDER', details: { text } }]);
    } else {
      aiResponse = "קיבלתי, בודק מול ראמי בסידור ומעדכן אותך כאן.";
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: "ai", text: aiResponse, timestamp: new Date() }]);
      setChatContext(newContext);
      setIsThinking(false);
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
    }, 1500);
  };

  if (loading) return <div className="h-screen bg-white flex items-center justify-center font-black text-blue-800 animate-pulse italic">SABAN OS PREMIUM...</div>;

  const activeOrder = orders.find(o => o.status !== 'הושלם') || orders[0];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#0B2C63]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 px-5 py-4 backdrop-blur-xl bg-white/70 border-b border-white/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0B2C63] to-[#1a4a8f] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black italic">S</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0B2C63]">SABAN OS</h1>
            <Badge className="text-[8px] bg-blue-50 text-blue-700 border-0">PREMIUM HUB</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm"><Bell className="w-5 h-5 text-slate-600" /></button>
            <div className="w-11 h-11 rounded-2xl bg-[#0B2C63] flex items-center justify-center text-white"><User className="w-5 h-5" /></div>
        </div>
      </header>

      <main className="px-5 pb-32 pt-6">
        {activeView === "home" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <section>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter">שלום, {customer?.full_name?.split(' ')[0]}! 👋</h2>
              <p className="text-slate-400 font-bold text-xs flex items-center gap-1 mt-1"><MapPin size={12}/> {customer?.address}</p>
            </section>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'chat', title: 'הזמנה חדשה', icon: PackagePlus, color: 'from-[#0B2C63] to-[#1a4a8f]', cmd: 'אני רוצה להזמין מכולה חדשה' },
                { id: 'track', title: 'מעקב משאית', icon: Truck, color: 'from-orange-500 to-orange-600' },
                { id: 'history', title: 'היסטוריה', icon: History, color: 'from-slate-600 to-slate-700' },
                { id: 'chat', title: 'דבר עם ראמי', icon: MessageSquare, color: 'from-emerald-500 to-emerald-600', cmd: 'צריך לדבר עם ראמי' }
              ].map(action => (
                <button key={action.title} onClick={() => { setActiveView(action.id as any); if(action.cmd) handleSendMessage(action.cmd); }} 
                  className="group relative aspect-square p-5 rounded-[2.5rem] bg-white border border-white/50 shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-lg`}><action.icon size={28}/></div>
                  <span className="font-black text-slate-800 text-sm tracking-tight">{action.title}</span>
                </button>
              ))}
            </div>

            {/* Status Card */}
            {activeOrder && (
                <section className="p-6 rounded-[2.5rem] bg-white border border-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-orange-500 to-emerald-500" />
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Current Mission</p>
                            <h3 className="text-xl font-black text-slate-800">{activeOrder.container_action}</h3>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700 border-none font-black italic">{activeOrder.status}</Badge>
                    </div>
                    {/* Stepper Logic */}
                    <div className="flex items-center justify-between px-2">
                        {[
                            { id: 'פתוח', icon: Package, label: 'התקבל' },
                            { id: 'בביצוע', icon: Truck, label: 'בדרך' },
                            { id: 'הושלם', icon: CheckCircle2, label: 'סופק' }
                        ].map((s, i, arr) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeOrder.status === s.id ? 'bg-orange-500 text-white shadow-lg animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                                        <s.icon size={20}/>
                                    </div>
                                    <span className="text-[10px] font-black">{s.label}</span>
                                </div>
                                {i < arr.length - 1 && <div className="flex-1 h-1 bg-slate-100 rounded-full mx-2" />}
                            </React.Fragment>
                        ))}
                    </div>
                </section>
            )}
          </div>
        )}

        {activeView === "chat" && (
            <div className="h-[calc(100vh-220px)] flex flex-col animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setActiveView('home')} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100"><ChevronLeft size={20}/></button>
                    <div><h2 className="text-xl font-black italic text-slate-800 leading-none">SABAN BRAIN</h2><Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] mt-1">ONLINE</Badge></div>
                </div>
                <div ref={chatScrollRef} className={`flex-1 overflow-y-auto rounded-[2.5rem] ${chatContext === 'active' ? 'bg-orange-50/30 border-orange-100' : 'bg-slate-50/50 border-slate-100'} border p-6 space-y-6 no-scrollbar`}>
                    {messages.map(m => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-5 rounded-[2rem] font-bold text-sm shadow-sm ${m.role === 'user' ? 'bg-white text-slate-800 rounded-bl-none' : 'bg-[#0B2C63] text-white rounded-br-none italic'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && <div className="flex justify-end"><div className="bg-[#0B2C63] p-4 rounded-2xl animate-pulse flex gap-1"><span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"/></div></div>}
                </div>
                <div className="mt-4 p-3 bg-white rounded-[2.2rem] shadow-2xl border border-slate-50 flex items-center gap-3">
                    <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl"><Mic size={20}/></button>
                    <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="כתוב הודעה..." className="flex-1 bg-transparent font-black text-right outline-none text-sm" />
                    <button onClick={() => handleSendMessage()} className="p-4 bg-[#0B2C63] text-white rounded-2xl shadow-lg"><Send size={20}/></button>
                </div>
            </div>
        )}

        {/* Track & History views implementation follows the same design language... */}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-8 left-6 right-6 z-50">
        <div className="flex items-center justify-around p-3 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl ring-8 ring-black/5">
            {[
                { id: 'home', icon: Package, label: 'ראשי' },
                { id: 'chat', icon: MessageSquare, label: 'צאט' },
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
