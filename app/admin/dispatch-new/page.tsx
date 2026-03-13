"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Plus, ChevronDown, Trash2, X, Send, Calendar, Clock, Warehouse, User } from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const deliveryTypes = [
  { id: 'is_truck_delivery', label: 'הובלת משאית' },
  { id: 'is_crane_delivery', label: 'הובלת מנוף' },
  { id: 'is_crane_15m', label: 'מנוף 15 מטר' },
  { id: 'is_self_pickup', label: 'משיכה עצמית' },
  { id: 'is_external_driver', label: 'מוביל חיצוני' },
  { id: 'is_waste_collection', label: 'איסוף בלות פסולת' },
  { id: 'is_site_access_crane', label: 'גישה לאתר+מנוף' },
  { id: 'is_crane_work_only', label: 'עבודת מנוף' },
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanUltimateDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [newOrder, setNewOrder] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    address: '',
    warehouse_source: 'התלמיד',
    driver_name: 'חכמת',
    types: {} as Record<string, boolean>
  });

  const supabase = getSupabase();

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('saban_dispatch').select('*').order('scheduled_time', { ascending: true });
    setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const saveOrder = async () => {
    if (!newOrder.customer_name) return toast.error("חובה להזין שם לקוח");
    
    const payload = {
      scheduled_date: newOrder.scheduled_date,
      scheduled_time: newOrder.scheduled_time,
      customer_name: newOrder.customer_name,
      address: newOrder.address,
      warehouse_source: newOrder.warehouse_source,
      driver_name: newOrder.driver_name,
      ...newOrder.types
    };

    const { error } = await supabase.from('saban_dispatch').insert([payload]);

    if (!error) {
      toast.success("✅ הזמנה שובצה בסידור!");
      setShowForm(false);
      setNewOrder({ ...newOrder, customer_name: '', address: '', types: {} });
      fetchOrders();
    } else {
      toast.error("שגיאה בשמירה");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black italic">SABAN-OS בטעינה...</div>;

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-xl mb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black italic tracking-tighter">SABAN<span className="text-blue-400">OS</span></h1>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 rounded-2xl gap-2 font-black shadow-lg px-6 h-12 transition-transform active:scale-90">
            <Plus size={20} /> הזמנה חדשה
          </Button>
        </div>
      </div>

      {/* הטופס המלא המשוחזר (Modal Custom) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-[#0B2C63]">הזנה חדשה לסידור</h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar size={12}/> תאריך</label>
                <input type="date" value={newOrder.scheduled_date} onChange={e => setNewOrder({...newOrder, scheduled_date: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> שעה</label>
                <input type="time" value={newOrder.scheduled_time} onChange={e => setNewOrder({...newOrder, scheduled_time: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-sm" />
              </div>
            </div>

            <div className="space-y-3">
              <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold shadow-sm" />
              <input placeholder="כתובת למסירה" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold shadow-sm" />
            </div>

            {/* סוגי פריקה - צ'קבוקסים */}
            <div className="grid grid-cols-2 gap-2 py-2">
              {deliveryTypes.map(type => (
                <div key={type.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <input 
                    type="checkbox" 
                    id={type.id} 
                    checked={newOrder.types[type.id] || false}
                    onChange={(e) => setNewOrder({
                      ...newOrder, 
                      types: { ...newOrder.types, [type.id]: e.target.checked }
                    })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label htmlFor={type.id} className="text-xs font-bold text-slate-700">{type.label}</label>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">מחסן</label>
                <select value={newOrder.warehouse_source} onChange={e => setNewOrder({...newOrder, warehouse_source: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold bg-white text-sm">
                  <option>התלמיד</option><option>החרש</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">נהג</label>
                <select value={newOrder.driver_name} onChange={e => setNewOrder({...newOrder, driver_name: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold bg-white text-sm">
                  <option>חכמת</option><option>עלי</option>
                </select>
              </div>
            </div>

            <Button onClick={saveOrder} className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg text-white shadow-xl gap-2">
              <Send size={20} /> שמור בסידור עבודה
            </Button>
          </div>
        </div>
      )}

      {/* לוח הנהגים */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <img src={driver.img} className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white" />
                <h2 className="text-2xl font-black text-slate-800 italic">{driver.name}</h2>
              </div>

              {/* גרף לחיץ */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(time.slice(0,4)));
                  return (
                    <div key={time} onClick={() => { setNewOrder({...newOrder, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className={`w-10 h-16 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100 hover:border-blue-400'}`}>
                        {hasOrder ? <Truck size={16} className="text-white" /> : <Plus size={14} className="text-slate-300 group-hover:text-blue-500" />}
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="border-none shadow-md rounded-[1.5rem] bg-white overflow-hidden transition-all hover:shadow-xl">
                  <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-5 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-blue-50 text-blue-700 font-black px-3 py-2 rounded-xl text-sm italic shadow-inner">{order.scheduled_time.slice(0, 5)}</Badge>
                      <span className="font-black text-slate-800 text-lg leading-tight">{order.customer_name}</span>
                    </div>
                    <ChevronDown size={24} className={`text-slate-300 transition-transform duration-300 ${expandedId === order.id ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>
                  {expandedId === order.id && (
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 font-bold text-slate-600 text-sm space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <p className="flex items-center gap-2"><MapPin size={14} className="text-red-500"/> {order.address}</p>
                        <p className="flex items-center gap-2"><Warehouse size={14} className="text-blue-500"/> {order.warehouse_source}</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                         <Button onClick={() => {if(confirm('למחוק?')) supabase.from('saban_dispatch').delete().eq('id', order.id).then(fetchOrders)}} variant="ghost" className="text-red-500 hover:bg-red-50 font-black text-xs gap-1">
                           <Trash2 size={14}/> מחק הזמנה
                         </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
