"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { SabanBrain } from "@/lib/saban-brain"; // וודא שהקובץ קיים ב-lib
import { 
  Truck, Plus, X, Send, Clock, Warehouse, MapPin, 
  Share2, UserCheck, Recycle, Menu, Edit2, Calendar, RefreshCw, Trash2, Brain, Sparkles, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

// --- רכיבי UI פנימיים ---
const LocalCard = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div style={style} className={`bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const LocalInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-black text-lg text-slate-900 outline-none focus:border-blue-500 transition-all ${props.className}`} />
);

// --- הגדרות נהגים ---
const drivers = [
  { name: 'חכמת', type: 'מנוף 🏗️', color: '#0B2C63' },
  { name: 'עלי', type: 'משאית 🚛', color: '#2563EB' },
  { name: 'פינוי פסולת', type: 'מכולה ♻️', color: '#16a34a' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const warehouses = ['התלמיד (1)', 'החרש (4)', 'שארק (30)', 'כראדי (32)', 'שי שרון (40)'];

export default function SabanMasterDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isBrainOpen, setIsBrainOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [form, setForm] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    order_id_comax: '',
    driver_name: 'חכמת',
    warehouse_source: 'החרש (4)',
    container_action: 'הובלה',
    address: '',
    created_by: 'ראמי',
    status: 'פתוח'
  });

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase.from('saban_master_dispatch').select('*').order('scheduled_time', { ascending: true });
      setOrders(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('master_live').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAiCommand = async () => {
    if (!aiInput.trim() || isTyping) return;
    const userMsg = aiInput;
    setAiInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await SabanBrain.ask(userMsg); // המנוע שמעדכן SQL אונליין
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      toast.success("המוח ביצע את הפעולה ב-SQL");
    } catch (e) {
      toast.error("שגיאה בתקשורת עם המוח");
    } finally {
      setIsTyping(false);
    }
  };

  const saveOrder = async () => {
    if (!form.customer_name || !form.order_id_comax) return toast.error("חסר נתונים");
    const payload = { ...form, start_process_time: new Date().toISOString() };
    const { error } = await supabase.from('saban_master_dispatch').insert([payload]);
    if (!error) { setShowForm(false); fetchData(); toast.success("נשמר בסידור"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 text-2xl italic animate-pulse">ח. סבן - מסנכרן מערכת...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans text-right overflow-hidden flex flex-col" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Top Nav */}
      <nav className="h-20 bg-[#0B2C63] text-white flex items-center justify-between px-6 shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-4">
           <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">SABAN <span className="text-blue-400">COMMAND</span></h1>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Operational Dispatch</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsBrainOpen(true)} className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-4 py-2 rounded-xl text-blue-300 font-black text-xs hover:bg-blue-500/40 transition-all">
            <Brain size={18} /> שאל את המוח
          </button>
          <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-black text-sm shadow-lg border-none text-white cursor-pointer">חדש +</button>
        </div>
      </nav>

      {/* Dashboard Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            <LocalCard className="p-6 border-b-8" style={{ borderBottomColor: driver.color }}>
              <h2 className="text-2xl font-black mb-4 italic uppercase">{driver.name}</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {Array.from({ length: 12 }, (_, i) => i + 7).map(h => (
                  <div key={h} className="flex flex-col items-center gap-1 min-w-[45px]">
                    <div className={`w-11 h-14 rounded-2xl border-2 flex items-center justify-center ${orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(h.toString().padStart(2, '0'))) ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100'}`}>
                      <Clock size={14} className={orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(h.toString().padStart(2, '0'))) ? 'text-white' : 'text-slate-300'} />
                    </div>
                    <span className="text-[9px] font-black text-slate-400">{h}:00</span>
                  </div>
                ))}
              </div>
            </LocalCard>

            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <LocalCard key={order.id} className="p-6 relative border-r-[10px]" style={{ borderRightColor: driver.color }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-[#0B2C63] text-white px-2 py-1 rounded-lg text-[10px] font-black">{order.scheduled_time}</span>
                    <Badge className={`text-[9px] font-black ${order.status === 'אושר להפצה' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</Badge>
                  </div>
                  <h3 className="font-black text-xl leading-none">{order.customer_name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Comax: #{order.order_id_comax}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-black text-slate-500 uppercase">
                    <div className="flex items-center gap-1"><MapPin size={12}/> {order.address || 'לא צוינה'}</div>
                    <div className="flex items-center gap-1"><Warehouse size={12}/> {order.warehouse_source}</div>
                  </div>
                </LocalCard>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI COMMAND SIDEBAR (המגירה של המוח) */}
      <AnimatePresence>
        {isBrainOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBrainOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 left-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col border-r border-slate-200">
              <div className="p-6 bg-[#0B2C63] text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-xl"><Brain size={20}/></div>
                  <h2 className="font-black italic uppercase tracking-tighter">Saban Brain Chat</h2>
                </div>
                <button onClick={() => setIsBrainOpen(false)} className="p-2 hover:bg-white/10 rounded-full border-none text-white transition-all cursor-pointer"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                    <Sparkles size={48} className="text-blue-600 mb-4 animate-pulse" />
                    <p className="font-black text-lg uppercase leading-tight">מה הבוס דורש?</p>
                    <p className="text-xs font-bold italic mt-1">"תשנה את הסטטוס של מחמוד ל'בוצע'"</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl font-black text-sm ${m.role === 'user' ? 'bg-slate-200 text-slate-800 rounded-tr-none' : 'bg-blue-600 text-white rounded-tl-none shadow-lg shadow-blue-200'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-end">
                    <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase animate-bounce">המוח מעבד...</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                  <LocalInput placeholder="פקודה לראמי..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()} className="h-12 text-sm" />
                  <button onClick={handleAiCommand} className="h-12 w-12 bg-blue-600 rounded-2xl text-white flex items-center justify-center border-none shadow-lg active:scale-90 transition-all cursor-pointer"><Send size={20}/></button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Traditional Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/90 z-[120] flex items-center justify-center p-4 backdrop-blur-md">
           <Card className="bg-white w-full max-w-lg rounded-[3rem] p-10 space-y-4 relative border-none">
              <button onClick={() => setShowForm(false)} className="absolute top-6 left-6 text-slate-400 hover:text-black border-none bg-transparent cursor-pointer"><X size={28}/></button>
              <h2 className="text-2xl font-black text-[#0B2C63] italic border-r-8 border-blue-600 pr-3 uppercase">הזנת נתונים</h2>
              <LocalInput placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
              <LocalInput placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} />
              <button onClick={saveOrder} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black text-lg border-none shadow-xl cursor-pointer">שמור בסידור 🚀</button>
           </Card>
        </div>
      )}
    </div>
  );
}
