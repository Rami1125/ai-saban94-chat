"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Clock, Warehouse, MapPin, Recycle, Edit2
} from "lucide-react";
import { toast, Toaster } from "sonner";

// נתוני נהגים ממותגים ח. סבן
const drivers = [
  { id: 'waste', name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', type: 'מכולה ♻️' },
  { id: 'ali', name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', type: 'משאית 🚛' },
  { id: 'hakmat', name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', type: 'מנוף 🏗️' }
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanMasterDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  
  const [newOrder, setNewOrder] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    address: '',
    warehouse_source: 'התלמיד (1)',
    driver_name: 'חכמת',
    order_id_comax: '',
    container_action: 'הצבה'
  });

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase.from('saban_master_dispatch').select('*').order('scheduled_time', { ascending: true });
    if (error) {
        console.error("Fetch Error:", error);
        toast.error("שגיאה בטעינת נתונים - בדוק SQL");
    } else {
        setOrders(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('master_live').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  const handleSave = async () => {
    if (!newOrder.customer_name || !newOrder.order_id_comax) return toast.error("חסר שם לקוח או מספר קומקס");
    
    const { error } = await supabase.from('saban_master_dispatch').upsert([
      { ...newOrder, id: editingOrder?.id, start_process_time: new Date().toISOString() }
    ]);

    if (!error) {
      toast.success(editingOrder ? "הזמנה עודכנה" : "הזמנה נשמרה");
      setShowForm(false);
      setEditingOrder(null);
      setNewOrder({ ...newOrder, customer_name: '', order_id_comax: '' });
      fetchData();
    } else {
        toast.error("שגיאה בשמירה - וודא הרצת SQL");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#0B2C63] animate-pulse">ח. סבן - טוען סידור...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2rem] shadow-2xl mb-8 flex justify-between items-center border-b-4 border-blue-500/50">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white">ח. סבן <span className="text-blue-400">סידור</span></h1>
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest text-right">לוח בקרה לוגיסטי</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 rounded-xl font-black h-12 shadow-lg border-none text-white px-6">
          <Plus size={20} className="ml-2" /> הזמנה חדשה
        </Button>
      </div>

      {/* לוח נהגים */}
      <div className="max-w-[1600px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <div key={driver.id} className="space-y-4">
            <Card className="bg-white p-5 rounded-[2.5rem] shadow-xl border-none relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                  <div className="text-right">
                    <h2 className="text-xl font-black text-slate-800">{driver.name}</h2>
                    <Badge className="bg-slate-100 text-slate-600 border-none text-[10px]">{driver.type}</Badge>
                  </div>
                </div>
                {driver.id === 'waste' && <Recycle className="text-green-500" size={32} />}
              </div>

              {/* פס שעות לחיץ */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                  return (
                    <div key={time} onClick={() => { setNewOrder({...newOrder, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }} className="flex flex-col items-center gap-1 cursor-pointer">
                      <div className={`w-10 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100'}`}>
                        {hasOrder ? <Truck size={16} className="text-white" /> : <Clock size={14} className="text-slate-300" />}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* רשימת הזמנות */}
            <div className="space-y-3">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="p-5 rounded-2xl bg-white shadow-md border-none relative group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#0B2C63] text-white font-black px-2 py-1 rounded-lg text-xs">{order.scheduled_time}</div>
                      <div className="text-right">
                        <div className="font-black text-slate-800 text-lg leading-tight">{order.customer_name}</div>
                        <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Doc #{order.order_id_comax}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => { setEditingOrder(order); setNewOrder(order); setShowForm(true); }} variant="ghost" className="h-8 w-8 p-0 text-slate-400 border-none"><Edit2 size={16}/></Button>
                      <Button onClick={() => supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData)} variant="ghost" className="h-8 w-8 p-0 text-red-400 border-none"><Trash2 size={16}/></Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 text-[11px] font-bold text-slate-500 text-right">
                    <div className="flex items-center gap-2 justify-end">{order.address || 'לא צוינה כתובת'} <MapPin size={12} className="text-red-500"/></div>
                    <div className="flex items-center gap-2 justify-end">{order.warehouse_source} <Warehouse size={12} className="text-blue-500"/></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* טופס יצירה */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 space-y-4 shadow-2xl border-t-[12px] border-blue-600 animate-in zoom-in-95 border-none text-right">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-[#0B2C63]">{editingOrder ? 'עריכת סידור' : 'הזמנה חדשה - ח. סבן'}</h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 border-none"><X size={20}/></button>
            </div>
            <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500" />
            <input placeholder="מספר קומקס" value={newOrder.order_id_comax} onChange={e => setNewOrder({...newOrder, order_id_comax: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500" />
            <Button onClick={handleSave} className="w-full h-16 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-xl shadow-xl transition-all border-none active:scale-95">שמור ושלח לסידור 🚀</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
