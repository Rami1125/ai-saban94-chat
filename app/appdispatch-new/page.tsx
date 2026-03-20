"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, X, Send, Clock, Warehouse, MapPin, 
  Share2, UserCheck, Recycle, Menu, Edit2, Calendar, RefreshCw, Trash2
} from "lucide-react";
import { toast, Toaster } from "sonner";

// הגדרות קבועות לפי המבנה העסקי של ח. סבן
const drivers = [
  { name: 'חכמת', type: 'מנוף 🏗️', color: '#0B2C63' },
  { name: 'עלי', type: 'משאית 🚛', color: '#2563EB' },
  { name: 'פינוי פסולת', type: 'מכולה ♻️', color: '#16a34a' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const containerActions = ['הצבה', 'החלפה', 'הוצאה', 'הובלה'];
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  // משיכת נתונים מדויקת לפי המבנה החדש
  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saban_master_dispatch')
        .select('*')
        .order('scheduled_time', { ascending: true });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error("שגיאת סנכרון: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    // האזנה בזמן אמת לשינויים בטבלת המאסטר
    const sub = supabase.channel('master_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  const saveOrder = async () => {
    // וידוא שדות חובה לפי הגדרות ה-SQL (is_nullable: NO)
    if (!form.customer_name || !form.order_id_comax || !form.driver_name) {
      return toast.error("חובה למלא לקוח, מספר קומקס ונהג");
    }

    const payload = { 
      ...form, 
      start_process_time: new Date().toISOString(),
      // עדכון סטטוס אוטומטי אם יש נהג
      status: (form.driver_name && form.driver_name !== 'לא שובץ') ? 'אושר להפצה' : 'פתוח'
    };
    
    const { error } = editingOrder 
      ? await supabase.from('saban_master_dispatch').update(payload).eq('id', editingOrder.id)
      : await supabase.from('saban_master_dispatch').insert([payload]);

    if (!error) {
      toast.success(editingOrder ? "הזמנה עודכנה" : "הזמנה חדשה נרשמה ב-SQL");
      setShowForm(false);
      setEditingOrder(null);
      // איפוס חלקי של הטופס
      setForm({ ...form, customer_name: '', order_id_comax: '', address: '' });
      fetchData();
    } else {
      toast.error("שגיאת כתיבה לטבלה: " + error.message);
    }
  };

  const shareMorningReport = () => {
    const today = new Date().toLocaleDateString('he-IL');
    const report = `☀️ *דוח סידור ח. סבן - ${today}*\n\n` +
      orders.map(o => `⏰ ${o.scheduled_time} | 👤 ${o.customer_name} | 🚛 ${o.driver_name}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-black italic text-slate-800 uppercase tracking-tighter">Saban OS: Syncing Master Table...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Modern Header */}
      <nav className="bg-[#0B2C63] text-white p-6 shadow-xl sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:bg-white/10">
            <Menu size={28}/>
          </Button>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">Master <span className="text-blue-400">Dispatch</span></h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.2em] mt-1">ח. סבן חומרי בניין</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={shareMorningReport} variant="outline" className="border-white/20 bg-white/5 text-white hidden md:flex gap-2">
            <Share2 size={18}/> דוח בוקר
          </Button>
          <Button onClick={() => { setEditingOrder(null); setShowForm(true); }} className="bg-blue-500 hover:bg-blue-400 font-black px-6 rounded-xl shadow-lg">
            הזמנה חדשה +
          </Button>
        </div>
      </nav>

      {/* Grid Layout */}
      <div className="max-w-[1900px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-b-4" style={{ borderColor: driver.color }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-slate-800 italic uppercase">{driver.name}</h2>
                <Badge className="bg-slate-100 text-slate-500 font-black text-[10px]">{driver.type}</Badge>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                  return (
                    <div key={time} className="flex flex-col items-center gap-1 min-w-[50px]">
                      <div className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                        {hasOrder ? <Truck size={18} className="text-white animate-pulse" /> : <Clock size={14} className="text-slate-300" />}
                      </div>
                      <span className="text-[9px] font-black text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orders List for Driver */}
            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="p-6 rounded-[2rem] bg-white shadow-md border-none hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="bg-[#0B2C63] text-white px-3 py-2 rounded-xl text-sm font-black italic h-fit">{order.scheduled_time}</div>
                      <div>
                        <h3 className="font-black text-xl text-slate-900 leading-tight">{order.customer_name}</h3>
                        <p className="text-blue-600 font-bold text-[10px] uppercase">COMAX: #{order.order_id_comax}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors border-none"><Edit2 size={16}/></button>
                      <button onClick={async () => { if(confirm('למחוק?')) { await supabase.from('saban_master_dispatch').delete().eq('id', order.id); fetchData(); } }} className="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors border-none"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-y-3 gap-x-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><MapPin size={14} className="text-red-400"/> {order.address || 'ללא כתובת'}</div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><Warehouse size={14} className="text-blue-400"/> {order.warehouse_source}</div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><UserCheck size={14} className="text-orange-400"/> {order.created_by}</div>
                    <Badge className={`w-fit text-[9px] font-black ${order.status === 'אושר להפצה' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {order.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Order Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <Card className="bg-white w-full max-w-xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
            <button onClick={() => setShowForm(false)} className="absolute top-8 left-8 p-2 hover:bg-slate-100 rounded-full border-none transition-colors"><X size={28}/></button>
            <h2 className="text-3xl font-black text-[#0B2C63] italic mb-8 border-r-4 border-blue-600 pr-4 uppercase">פרטי הזמנה</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 px-2 uppercase">תאריך</label>
                  <input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-black text-right" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 px-2 uppercase">שעה</label>
                  <select value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-black text-right">
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 px-2 uppercase italic">לקוח ומסמך קומקס</label>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="h-14 rounded-2xl border-2 font-black text-lg" />
                  <Input placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} className="h-14 rounded-2xl border-2 font-black text-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 px-2 uppercase">נהג משבץ</label>
                  <select value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-black text-right">
                    {drivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 px-2 uppercase">מקור המלאי</label>
                  <select value={form.warehouse_source} onChange={e => setForm({...form, warehouse_source: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-black text-right">
                    {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 px-2 uppercase">כתובת למשלוח</label>
                <Input placeholder="כתובת מלאה..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="h-14 rounded-2xl border-2 font-black" />
              </div>

              <Button onClick={saveOrder} className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-2xl shadow-2xl transition-all active:scale-95 mt-4">
                {editingOrder ? 'עדכן סידור ✍️' : 'שמור ושדרג ל-SQL 🚀'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
