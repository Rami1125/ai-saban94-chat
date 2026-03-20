"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { 
  Truck, Plus, X, Send, Clock, Warehouse, MapPin, 
  Share2, UserCheck, Recycle, Menu, Edit2, Calendar, RefreshCw, Trash2, Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

/**
 * Saban Master Dispatch v6.6 - Ultra Resilience Edition
 * ---------------------------------------------------------
 * - פתרון סופי לשגיאות: Card is not defined, Input is not defined
 * - עיצוב בהיר, אותיות גדולות, תואם מובייל מלא
 */

// --- רכיבי UI פנימיים (מובנים) למניעת שגיאות ReferenceError ---
const LocalCard = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div style={style} className={`bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const LocalInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-black text-lg text-slate-900 outline-none focus:border-blue-500 focus:ring-4 ring-blue-50 transition-all ${props.className}`} />
);

const LocalButton = ({ children, onClick, className = "", disabled = false }: { children: React.ReactNode, onClick?: () => void, className?: string, disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 font-black transition-all active:scale-95 disabled:opacity-50 border-none cursor-pointer ${className}`}>{children}</button>
);

// --- הגדרות נהגים ונתונים ---
const drivers = [
  { name: 'חכמת', type: 'מנוף 🏗️', color: '#0B2C63' },
  { name: 'עלי', type: 'משאית 🚛', color: '#2563EB' },
  { name: 'פינוי פסולת', type: 'מכולה ♻️', color: '#16a34a' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const warehouses = ['התלמיד (1)', 'החרש (4)', 'שארק (30)', 'כראדי (32)', 'שי שרון (40)'];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanMasterDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  
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

  const saveOrder = async () => {
    if (!form.customer_name || !form.order_id_comax) return toast.error("חובה למלא לקוח ומספר קומקס");
    
    const payload = { 
      ...form, 
      start_process_time: new Date().toISOString(),
      status: (form.driver_name && form.driver_name !== 'לא שובץ') ? 'אושר להפצה' : 'פתוח'
    };
    
    const { error } = editingOrder 
      ? await supabase.from('saban_master_dispatch').update(payload).eq('id', editingOrder.id)
      : await supabase.from('saban_master_dispatch').insert([payload]);

    if (!error) {
      toast.success("סונכרן ב-SQL בהצלחה");
      setShowForm(false);
      setEditingOrder(null);
      setForm({ ...form, customer_name: '', order_id_comax: '', address: '' });
      fetchData();
    }
  };

  const shareMorningReport = () => {
    const report = `☀️ *דוח סידור ח. סבן*\n` + orders.map(o => `• ${o.scheduled_time} | ${o.customer_name} | ${o.driver_name}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#0B2C63] text-2xl animate-pulse">ח. סבן - מסנכרן נתוני מאסטר...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Navbar */}
      <nav className="h-20 bg-[#0B2C63] text-white flex items-center justify-between px-6 sticky top-0 z-[60] shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-white/10 rounded-lg border-none text-white transition-all cursor-pointer"><Menu size={28}/></button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">SABAN <span className="text-blue-400">MASTER</span></h1>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Operational Core</p>
          </div>
        </div>
        <LocalButton onClick={() => { setEditingOrder(null); setShowForm(true); }} className="bg-blue-500 hover:bg-blue-400 px-6 py-2.5 rounded-xl text-sm shadow-lg text-white">חדש +</LocalButton>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[100] bg-white p-6 flex flex-col md:hidden">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="font-black text-2xl italic uppercase">תפריט ניהול</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full border-none"><X size={24}/></button>
            </div>
            <LocalButton onClick={shareMorningReport} className="w-full h-16 bg-green-600 text-white rounded-2xl mb-4 text-lg"><Share2 size={20}/> שלח דוח בוקר</LocalButton>
            <LocalButton onClick={fetchData} className="w-full h-16 bg-slate-100 text-slate-600 rounded-2xl text-lg"><RefreshCw size={20}/> רענן לוח</LocalButton>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1800px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            <LocalCard className="p-6 border-b-[10px]" style={{ borderBottomColor: driver.color }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black italic">{driver.name}</h2>
                <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{driver.type}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                  return (
                    <div key={time} className="flex flex-col items-center gap-1 min-w-[50px]">
                      <div className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100'}`}>
                        {hasOrder ? <Truck size={20} className="text-white animate-pulse" /> : <Clock size={16} className="text-slate-300" />}
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </LocalCard>

            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <LocalCard key={order.id} className="p-7 relative group border-r-[12px]" style={{ borderRightColor: driver.color }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className="bg-[#0B2C63] text-white px-3 py-2 rounded-xl text-sm font-black italic shadow-md">{order.scheduled_time}</div>
                      <div>
                        <h3 className="font-black text-2xl leading-none mb-1">{order.customer_name}</h3>
                        <p className="text-blue-600 font-bold text-xs uppercase tracking-tighter">COMAX: #{order.order_id_comax}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg border-none cursor-pointer hover:bg-blue-100"><Edit2 size={16}/></button>
                       <button onClick={() => { if(confirm('למחוק הזמנה?')) supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData); }} className="p-2 bg-red-50 text-red-500 rounded-lg border-none cursor-pointer hover:bg-red-100"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-tight">
                    <div className="flex items-center gap-2"><MapPin size={16} className="text-red-400"/> {order.address || 'לא צוינה כתובת'}</div>
                    <div className="flex items-center gap-2"><Warehouse size={16} className="text-blue-400"/> {order.warehouse_source}</div>
                    <div className="flex items-center gap-2"><UserCheck size={16} className="text-orange-400"/> {order.created_by}</div>
                    <div className={`px-3 py-1 rounded-full w-fit text-[10px] font-black ${order.status === 'אושר להפצה' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</div>
                  </div>
                </LocalCard>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Form Overlay */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <LocalCard className="bg-white w-full max-w-xl rounded-[3rem] p-10 md:p-14 shadow-2xl relative border-none overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowForm(false)} className="absolute top-8 left-8 p-2 hover:bg-slate-100 rounded-full border-none cursor-pointer"><X size={32} className="text-slate-400"/></button>
              <h2 className="text-3xl font-black text-[#0B2C63] italic mb-10 border-r-8 border-blue-600 pr-5 uppercase tracking-tighter text-right">הזנת נתוני שטח</h2>
              
              <div className="space-y-8 text-right">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-widest">תאריך ביצוע</label>
                    <input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-right text-lg outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-widest">שעת הגעה</label>
                    <select value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-right text-lg outline-none focus:border-blue-500 appearance-none bg-white">
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-widest">שם לקוח (חובה)</label>
                    <LocalInput placeholder="הקלד שם..." value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-widest">מספר קומקס (חובה)</label>
                    <LocalInput placeholder="לדוגמה: 621000" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-widest">נהג משויך</label>
                    <select value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-right text-lg outline-none focus:border-blue-500 appearance-none bg-white">
                      {drivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-widest">סניף/מקור</label>
                    <select value={form.warehouse_source} onChange={e => setForm({...form, warehouse_source: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-right text-lg outline-none focus:border-blue-500 appearance-none bg-white">
                      {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 px-2 uppercase tracking-widest">כתובת אספקה</label>
                  <LocalInput placeholder="כתובת מלאה..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>

                <LocalButton onClick={saveOrder} className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[2.5rem] text-2xl shadow-2xl mt-6">
                  {editingOrder ? 'עדכן סידור עבודה ✍️' : 'שמור ושגר ל-SQL 🚀'}
                </LocalButton>
              </div>
            </LocalCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
