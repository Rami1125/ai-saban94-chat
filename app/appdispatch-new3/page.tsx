"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Clock, Warehouse, MapPin, Share2, UserCheck, HardHat, Recycle, Menu, Edit2, Calendar, RefreshCw
} from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { id: 'hakmat', name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { id: 'ali', name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' },
  { id: 'waste', name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', defaultType: 'מכולה ♻️' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const containerActions = ['הצבה', 'החלפה', 'הוצאה'];
const wasteWarehouses = ['שארק (30)', 'כראדי (32)', 'שי שרון (40)'];
const standardWarehouses = ['התלמיד (1)', 'החרש (4)'];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanMasterDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  
  const [form, setForm] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    warehouse_source: 'התלמיד (1)',
    driver_name: 'חכמת',
    created_by: 'ראמי',
    order_id_comax: '',
    address: '',
    container_action: 'הצבה'
  });

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('saban_master_dispatch').select('*').order('scheduled_time', { ascending: true });
    setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('master_live').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  const generateWAMessage = (order: any) => {
    const isMobile = typeof navigator !== 'undefined' && /iPhone|Android/i.test(navigator.userAgent);
    const actionInfo = order.driver_name === 'פינוי פסולת' ? `\n♻️ *פעולה:* ${order.container_action}` : '';
    
    if (!isMobile) {
      return `סידור ח. סבן חומרי בניין\nעדכון הזמנה\nלקוח: ${order.customer_name}\nמספר: ${order.order_id_comax}\nנהג: ${order.driver_name}\nשעה: ${order.scheduled_time}\nמחסן: ${order.warehouse_source}\nנציג מעדכן: ${order.created_by}`;
    }

    const emoji = order.driver_name === 'פינוי פסולת' ? '♻️' : '📦';
    return `${emoji} *סידור ח. סבן חומרי בניין*\n---------------------------\n👤 *לקוח:* ${order.customer_name}\n🆔 *מספר:* ${order.order_id_comax}\n🚛 *נהג:* ${order.driver_name}${actionInfo}\n⏰ *שעה:* ${order.scheduled_time}\n🏭 *מחסן:* ${order.warehouse_source}\n---------------------------\n_נציג מעדכן: ${order.created_by}_`;
  };

  const saveOrder = async () => {
    if (!form.customer_name || !form.order_id_comax) return toast.error("חסר נתונים");

    const payload = { ...form, start_process_time: new Date().toISOString() };
    
    const { error } = editingOrder 
      ? await supabase.from('saban_master_dispatch').update(payload).eq('id', editingOrder.id)
      : await supabase.from('saban_master_dispatch').insert([payload]);

    if (!error) {
      toast.success(editingOrder ? "עודכן!" : "נשמר!");
      if (!editingOrder) window.open(`https://wa.me/?text=${encodeURIComponent(generateWAMessage(form))}`, '_blank');
      setShowForm(false);
      setEditingOrder(null);
      setForm({ ...form, customer_name: '', order_id_comax: '', address: '' });
      fetchData();
    }
  };

  const shareMorningReport = () => {
    const report = `☀️ *דוח סידור ח. סבן - ${new Date().toLocaleDateString('he-IL')}*\n` +
      orders.map(o => `• ${o.scheduled_time} | ${o.customer_name} | ${o.driver_name}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63] italic text-2xl">ח. סבן - טוען סידור...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-8 flex justify-between items-center relative z-50">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-white/10 rounded-xl border-none text-white transition-all active:scale-90">
          {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
        </button>
        <div className="text-center">
            <h1 className="text-xl font-black italic tracking-tighter leading-tight text-white uppercase">ח.סבן</h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">חומרי בניין</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 rounded-xl font-black h-10 px-4 border-none shadow-lg text-white">חדש +</Button>
        
        {isMenuOpen && (
          <div className="absolute top-24 right-6 left-6 bg-white rounded-[2rem] shadow-2xl p-4 border border-slate-100 animate-in slide-in-from-top-4">
             <button onClick={shareMorningReport} className="w-full flex items-center gap-3 p-5 hover:bg-slate-50 rounded-2xl text-[#0B2C63] font-black border-none text-right transition-colors">
                <Share2 size={22} className="text-blue-600"/> שלח דוח בוקר לוואטסאפ
             </button>
             <button className="w-full flex items-center gap-3 p-5 hover:bg-slate-50 rounded-2xl text-[#0B2C63] font-black border-none text-right opacity-50">
                <History size={22} className="text-orange-500"/> היסטוריית פעולות (מלשינון)
             </button>
          </div>
        )}
      </div>

      <div className="max-w-[1800px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {drivers.map((driver) => (
          <div key={driver.id} className="space-y-6">
            {/* כרטיס נהג עם פס שעות אופקי */}
            <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-none relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 leading-tight">{driver.name}</h2>
                    <Badge className="bg-slate-50 text-slate-500 border-none font-bold text-[10px] uppercase">{driver.defaultType}</Badge>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {timeSlots.map(time => {
                    const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                    return (
                      <div key={time} onClick={() => { setForm({...form, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }}
                           className="flex flex-col items-center gap-2 cursor-pointer group">
                        <div className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}>
                          {hasOrder ? <Truck size={20} className="text-white animate-pulse" /> : <Clock size={16} className="text-slate-300" />}
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{time}</span>
                      </div>
                    );
                  })}
                </div>
            </Card>

            {/* רשימת הזמנות בעיצוב UI עשיר */}
            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="p-6 rounded-[2rem] bg-white shadow-lg border-none relative group overflow-hidden border-r-8 border-r-[#0B2C63]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#0B2C63] text-white px-3 py-2 rounded-xl text-xs font-black italic shadow-inner">{order.scheduled_time}</div>
                            <div className="text-right">
                                <div className="font-black text-slate-800 text-xl leading-tight">{order.customer_name}</div>
                                <div className="text-blue-600 font-bold text-xs uppercase tracking-tighter">קומקס: #{order.order_id_comax}</div>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generateWAMessage(order))}`, '_blank')} className="p-2 bg-green-50 text-green-600 rounded-lg border-none"><RefreshCw size={16}/></button>
                             <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg border-none"><Edit2 size={16}/></button>
                             <button onClick={() => { if(confirm('למחוק הזמנה?')) supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData); }} className="p-2 bg-red-50 text-red-500 rounded-lg border-none"><Trash2 size={16}/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-50 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-red-400"/> {order.address || 'לא צוינה כתובת'}</div>
                        <div className="flex items-center gap-2"><Warehouse size={14} className="text-blue-400"/> {order.warehouse_source}</div>
                        <div className="flex items-center gap-2"><UserCheck size={14} className="text-orange-400"/> רושם: {order.created_by}</div>
                        {order.driver_name === 'פינוי פסולת' && <div className="flex items-center gap-2"><Recycle size={14} className="text-green-500"/> פעולה: {order.container_action}</div>}
                    </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* טופס יצירה/עריכה חכם */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[3rem] p-10 space-y-6 shadow-2xl border-t-[12px] border-blue-600 animate-in zoom-in-95 border-none text-right">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-[#0B2C63]">{editingOrder ? 'עריכת הזמנה' : 'הזמנה חדשה - ח. סבן'}</h2>
              <button onClick={() => { setShowForm(false); setEditingOrder(null); }} className="bg-slate-100 p-2 rounded-full border-none text-slate-400 hover:text-black transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex gap-2 mb-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setForm({...form, created_by: m})}
                            className={`flex-1 py-4 rounded-2xl text-[11px] font-black border-none transition-all ${form.created_by === m ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>
                        {m}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase"><Calendar size={10}/> תאריך</label>
                    <input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 text-right" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2 flex items-center gap-1 uppercase"><Clock size={10}/> שעת הגעה</label>
                    <select value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 font-bold bg-white outline-none focus:border-blue-500 text-right">
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <input placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500 transition-all focus:bg-blue-50/30" />
            <input placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500 transition-all focus:bg-blue-50/30" />
            
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic tracking-widest">מחסן מטפל</label>
                <select 
                    value={form.warehouse_source} 
                    onChange={e => setForm({...form, warehouse_source: e.target.value})} 
                    className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-right outline-none focus:border-blue-500 bg-white"
                >
                    {form.driver_name === 'פינוי פסולת' 
                      ? wasteWarehouses.map(w => <option key={w} value={w}>{w}</option>) 
                      : standardWarehouses.map(w => <option key={w} value={w}>{w}</option>)
                    }
                </select>
            </div>

            {form.driver_name === 'פינוי פסולת' && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-green-600 mr-2 uppercase italic tracking-widest">סוג פעולה (מכולה)</label>
                    <select value={form.container_action} onChange={e => setForm({...form, container_action: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-green-200 font-bold text-right outline-none focus:border-green-500 bg-white">
                        {containerActions.map(act => <option key={act} value={act}>{act}</option>)}
                    </select>
                </div>
            )}

            <Button onClick={saveOrder} className="w-full h-18 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-xl shadow-xl transition-all border-none active:scale-95 shadow-green-200">
              {editingOrder ? 'עדכן סידור עבודה ✍️' : 'שמור ושגר לוואטסאפ 🚀'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
