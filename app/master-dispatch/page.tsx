"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { SabanBrain } from "@/lib/saban-brain";
import { 
  Truck, Plus, X, Send, Clock, Warehouse, MapPin, 
  Share2, UserCheck, Edit2, RefreshCw, Trash2, Brain, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

/**
 * Saban Master Dispatch v7.6 - Command Center
 * ---------------------------------------------------------
 * - FIX: LocalButton, LocalCard, LocalInput defined
 * - Time Slots: Clickable hours under drivers
 * - Realtime: Syncs with saban_master_dispatch
 */

// --- רכיבי UI פנימיים (מניעת ReferenceError) ---
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

// --- הגדרות נהגים ונתונים ---
const drivers = [
  { id: 'hakmat', name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', type: 'מנוף 🏗️' },
  { id: 'ali', name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', type: 'משאית 🚛' },
  { id: 'waste', name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', type: 'מכולה ♻️' }
];

const warehouses = ['החרש (4)', 'התלמיד (1)', 'שארק (30)', 'כראדי (32)', 'שי שרון (40)'];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanMasterDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isBrainOpen, setIsBrainOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
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

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const saveOrder = async () => {
    if (!form.customer_name) return toast.error("ציין שם לקוח");
    const payload = { 
      ...form, 
      order_id_comax: form.order_id_comax || `AI-${Math.floor(Math.random()*100000)}`,
      start_process_time: new Date().toISOString()
    };
    const { error } = editingOrder 
      ? await supabase.from('saban_master_dispatch').update(payload).eq('id', editingOrder.id)
      : await supabase.from('saban_master_dispatch').insert([payload]);

    if (!error) {
      toast.success("סידור עודכן");
      setShowForm(false);
      setEditingOrder(null);
      fetchData();
    }
  };

  const handleAiCommand = async () => {
    if (!aiInput.trim() || isTyping) return;
    const msg = aiInput; setAiInput("");
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTyping(true);
    try {
      const res = await SabanBrain.ask(msg);
      setMessages(prev => [...prev, { role: 'ai', content: res }]);
    } catch (e) { toast.error("שגיאה בסינפסות"); } finally { setIsTyping(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 text-2xl animate-pulse italic uppercase">Saban Dispatch - Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans text-right flex flex-col overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Nav */}
      <nav className="h-20 bg-[#0B2C63] text-white flex items-center justify-between px-6 shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">SABAN <span className="text-blue-400 font-black">MASTER</span></h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Dispatch Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LocalButton onClick={() => setIsBrainOpen(true)} className="bg-blue-500/20 border-blue-400/30 px-4 py-2 rounded-xl text-blue-300 text-xs">
            <Brain size={18} /> פקודות AI
          </LocalButton>
          <LocalButton onClick={() => { setEditingOrder(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl text-sm shadow-lg text-white">חדש +</LocalButton>
        </div>
      </nav>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            <LocalCard className="p-6 border-b-[10px]" style={{ borderBottomColor: driver.color }}>
              <div className="flex items-center gap-4 mb-6">
                <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" alt={driver.name} />
                <div>
                  <h2 className="text-2xl font-black italic leading-tight">{driver.name}</h2>
                  <LocalBadge className="bg-slate-50 text-slate-500 border-none">{driver.type}</LocalBadge>
                </div>
              </div>

              {/* Clickable Hours */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                  return (
                    <div key={time} onClick={() => { setForm({...form, driver_name: driver.name, scheduled_time: time}); setEditingOrder(null); setShowForm(true); }}
                         className="flex flex-col items-center gap-1 min-w-[50px] cursor-pointer group">
                      <div className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}>
                        {hasOrder ? <Truck size={18} className="text-white animate-pulse" /> : <Plus size={14} className="text-slate-300" />}
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </LocalCard>

            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <LocalCard key={order.id} className="p-6 relative group border-r-[12px]" style={{ borderRightColor: driver.color }}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-[#0B2C63] text-white px-3 py-1.5 rounded-xl text-[11px] font-black italic shadow-md">{order.scheduled_time}</span>
                    <LocalBadge className={order.status === 'אושר להפצה' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}>
                      {order.status}
                    </LocalBadge>
                  </div>
                  <h3 className="font-black text-2xl leading-none mb-1">{order.customer_name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all absolute top-6 left-6">
                       <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg border-none cursor-pointer"><Edit2 size={16}/></button>
                       <button onClick={() => { if(confirm('למחוק?')) supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData); }} className="p-2 bg-red-50 text-red-500 rounded-lg border-none cursor-pointer"><Trash2 size={16}/></button>
                  </div>
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

      {/* AI SIDEBAR */}
      <AnimatePresence>
        {isBrainOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBrainOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 left-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col">
              <div className="p-6 bg-[#0B2C63] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-xl"><Brain size={24}/></div>
                  <h2 className="font-black text-xl italic uppercase tracking-tighter">Saban AI Chat</h2>
                </div>
                <button onClick={() => setIsBrainOpen(false)} className="p-2 hover:bg-white/10 rounded-full border-none text-white cursor-pointer"><X size={28}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <Sparkles size={60} className="text-blue-600 mb-6 animate-pulse" />
                    <p className="font-black text-2xl uppercase italic leading-tight">בקרת סידור אונליין</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] font-black text-[15px] ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-blue-600 text-white rounded-tl-none shadow-lg'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-center font-black text-blue-500 text-[10px] uppercase animate-bounce mt-4">המוח מעבד...</div>}
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

      {/* Form Overlay */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0B2C63]/90 z-[120] flex items-center justify-center p-4 backdrop-blur-xl">
            <LocalCard className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 space-y-6 relative border-none">
              <button onClick={() => { setShowForm(false); setEditingOrder(null); }} className="absolute top-8 left-8 text-slate-300 hover:text-black border-none bg-transparent cursor-pointer"><X size={32}/></button>
              <h2 className="text-3xl font-black text-[#0B2C63] italic border-r-[10px] border-blue-600 pr-4 uppercase tracking-tighter text-right">הזנת נתונים</h2>
              <div className="space-y-4 text-right">
                <LocalInput placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
                <LocalInput placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} />
                <LocalButton onClick={saveOrder} className="w-full h-20 bg-blue-600 text-white rounded-[2rem] text-2xl shadow-2xl mt-4">שמור ושדרג ל-SQL 🚀</LocalButton>
              </div>
            </LocalCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
