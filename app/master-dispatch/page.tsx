"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { SabanBrain } from "@/lib/saban-brain";
import { 
  Truck, Plus, X, Send, Clock, Warehouse, MapPin, 
  Share2, UserCheck, Menu, Edit2, Calendar, RefreshCw, Trash2, Brain, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

/**
 * Saban Command Center v7.0 - Integrated AI & Full Dispatch
 * ---------------------------------------------------------
 * - תיקון סופי: Badge, Card, Input מוגדרים מקומית
 * - לוח פקודות AI מצד שמאל
 * - שליטה מלאה ב-saban_master_dispatch
 */

// --- רכיבי UI פנימיים (מובנים) ---
const LocalCard = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div style={style} className={`bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const LocalInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-black text-lg text-slate-900 outline-none focus:border-blue-500 transition-all ${props.className}`} />
);

const LocalBadge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${className}`}>{children}</span>
);

const LocalButton = ({ children, onClick, className = "", disabled = false }: { children: React.ReactNode, onClick?: () => void, className?: string, disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 font-black transition-all active:scale-95 disabled:opacity-50 border-none cursor-pointer ${className}`}>{children}</button>
);

// --- הגדרות מערכת ---
const drivers = [
  { name: 'חכמת', type: 'מנוף 🏗️', color: '#0B2C63' },
  { name: 'עלי', type: 'משאית 🚛', color: '#2563EB' },
  { name: 'פינוי פסולת', type: 'מכולה ♻️', color: '#16a34a' }
];

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
      const response = await SabanBrain.ask(userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      toast.success("פעולת AI בוצעה");
    } catch (e) {
      toast.error("נתק בסינפסות");
    } finally {
      setIsTyping(false);
    }
  };

  const saveOrder = async () => {
    if (!form.customer_name || !form.order_id_comax) return toast.error("חסר נתונים");
    const payload = { 
      ...form, 
      start_process_time: new Date().toISOString(),
      status: (form.driver_name && form.driver_name !== 'לא שובץ') ? 'אושר להפצה' : 'פתוח'
    };
    const { error } = await supabase.from('saban_master_dispatch').insert([payload]);
    if (!error) { setShowForm(false); fetchData(); toast.success("עודכן בלוח 🚀"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#0B2C63] text-2xl animate-pulse uppercase tracking-tighter">SABAN OS - SYNCING...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans text-right overflow-hidden flex flex-col" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Nav */}
      <nav className="h-20 bg-[#0B2C63] text-white flex items-center justify-between px-6 shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">SABAN <span className="text-blue-400 font-black">COMMAND</span></h1>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Operational Dispatch</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LocalButton onClick={() => setIsBrainOpen(true)} className="bg-blue-500/20 border-blue-400/30 px-4 py-2 rounded-xl text-blue-300 text-xs">
            <Brain size={18} /> לוח פקודות AI
          </LocalButton>
          <LocalButton onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl text-sm shadow-lg text-white">חדש +</LocalButton>
        </div>
      </nav>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            <LocalCard className="p-6 border-b-[10px]" style={{ borderBottomColor: driver.color }}>
              <h2 className="text-2xl font-black mb-4 italic uppercase">{driver.name}</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {Array.from({ length: 12 }, (_, i) => i + 7).map(h => (
                  <div key={h} className="flex flex-col items-center gap-1 min-w-[50px]">
                    <div className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center ${orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(h.toString().padStart(2, '0'))) ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100'}`}>
                      <Clock size={16} className={orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(h.toString().padStart(2, '0'))) ? 'text-white' : 'text-slate-300'} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{h}:00</span>
                  </div>
                ))}
              </div>
            </LocalCard>

            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <LocalCard key={order.id} className="p-7 relative border-r-[12px]" style={{ borderRightColor: driver.color }}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-[#0B2C63] text-white px-3 py-1.5 rounded-xl text-[11px] font-black italic shadow-md">{order.scheduled_time}</span>
                    <LocalBadge className={order.status === 'אושר להפצה' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}>
                      {order.status}
                    </LocalBadge>
                  </div>
                  <h3 className="font-black text-2xl leading-none mb-1">{order.customer_name}</h3>
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-tighter">COMAX: #{order.order_id_comax}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-black text-slate-500 uppercase">
                    <div className="flex items-center gap-2"><MapPin size={14} className="text-red-400"/> {order.address || 'לא צוינה'}</div>
                    <div className="flex items-center gap-2"><Warehouse size={14} className="text-blue-400"/> {order.warehouse_source}</div>
                  </div>
                </LocalCard>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI COMMAND SIDEBAR */}
      <AnimatePresence>
        {isBrainOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBrainOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 left-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col">
              <div className="p-6 bg-[#0B2C63] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-xl shadow-lg shadow-blue-500/30"><Brain size={24}/></div>
                  <h2 className="font-black text-xl italic uppercase tracking-tighter leading-none">Saban AI Control</h2>
                </div>
                <button onClick={() => setIsBrainOpen(false)} className="p-2 hover:bg-white/10 rounded-full border-none text-white cursor-pointer"><X size={28}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-8">
                    <Sparkles size={60} className="text-blue-600 mb-6 animate-pulse" />
                    <p className="font-black text-2xl uppercase italic tracking-tighter leading-tight">בקרת סידור אונליין</p>
                    <p className="text-sm font-bold mt-2">"ראמי, תפתח הזמנה ללקוח אלפא בניה לנהג עלי..."</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] font-black text-[15px] shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-blue-600 text-white rounded-tl-none shadow-blue-200 shadow-lg'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-center font-black text-blue-500 text-[10px] uppercase animate-bounce mt-4">המוח מעבד פקודה...</div>}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <div className="flex gap-3">
                  <LocalInput placeholder="פקודה לביצוע..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()} className="h-14" />
                  <LocalButton onClick={handleAiCommand} className="h-14 w-14 bg-blue-600 rounded-2xl text-white shadow-lg"><Send size={24}/></LocalButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manual Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/90 z-[120] flex items-center justify-center p-4 backdrop-blur-xl">
           <LocalCard className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 space-y-6 relative border-none">
              <button onClick={() => setShowForm(false)} className="absolute top-8 left-8 text-slate-300 hover:text-black border-none bg-transparent cursor-pointer"><X size={32}/></button>
              <h2 className="text-3xl font-black text-[#0B2C63] italic border-r-[10px] border-blue-600 pr-4 uppercase tracking-tighter">הזנה ידנית</h2>
              <div className="space-y-4">
                <LocalInput placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
                <LocalInput placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} />
                <LocalButton onClick={saveOrder} className="w-full h-20 bg-blue-600 text-white rounded-[2rem] text-2xl shadow-2xl">שגר לסידור 🚀</LocalButton>
              </div>
           </LocalCard>
        </div>
      )}
    </div>
  );
}
