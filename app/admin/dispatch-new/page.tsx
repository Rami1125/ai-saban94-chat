"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Plus, ChevronDown, Trash2, X, Send } from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanFixedDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [newOrder, setNewOrder] = useState({
    customer_name: '', address: '', scheduled_time: '07:00', 
    driver_name: 'חכמת', warehouse_source: 'התלמיד'
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
    
    const { error } = await supabase.from('saban_dispatch').insert([{
      ...newOrder,
      scheduled_date: new Date().toISOString().split('T')[0]
    }]);

    if (!error) {
      toast.success("✅ נשמר בסידור!");
      setShowForm(false);
      setNewOrder({ customer_name: '', address: '', scheduled_time: '07:00', driver_name: 'חכמת', warehouse_source: 'התלמיד' });
      fetchOrders();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black">טוען סידור סבן...</div>;

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-xl mb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black italic">SABAN<span className="text-blue-400">OS</span></h1>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 rounded-2xl gap-2 font-black shadow-lg">
            <Plus size={20} /> הזמנה חדשה
          </Button>
        </div>
      </div>

      {/* טופס צף פשוט (שלא תלוי בספריות חיצוניות) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-4 shadow-2xl relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 left-4 text-slate-400"><X /></button>
            <h2 className="text-2xl font-black text-[#0B2C63] mb-4">הזנה לסידור</h2>
            <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold" />
            <input placeholder="כתובת" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold" />
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={newOrder.scheduled_time} onChange={e => setNewOrder({...newOrder, scheduled_time: e.target.value})} className="h-12 px-4 rounded-xl border border-slate-200 font-bold" />
              <select value={newOrder.driver_name} onChange={e => setNewOrder({...newOrder, driver_name: e.target.value})} className="h-12 px-4 rounded-xl border border-slate-200 font-bold bg-white">
                <option>חכמת</option><option>עלי</option>
              </select>
            </div>
            <Button onClick={saveOrder} className="w-full h-14 bg-blue-600 rounded-2xl font-black text-lg text-white">שמור סידור 🔥</Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                <h2 className="text-xl font-black">{driver.name}</h2>
              </div>

              {/* גרף לחיץ - פותח את הטופס שייצרנו למעלה */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(time.slice(0,4)));
                  return (
                    <div key={time} onClick={() => { setNewOrder({...newOrder, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }} className="flex flex-col items-center gap-2 cursor-pointer">
                      <div className={`w-10 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100'}`}>
                        {hasOrder ? <Truck size={16} className="text-white" /> : <Plus size={14} className="text-slate-300" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* רשימה נפתחת */}
            <div className="space-y-3">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
                  <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-4 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-50 text-blue-700 font-bold px-2 py-1">{order.scheduled_time.slice(0, 5)}</Badge>
                      <span className="font-black text-slate-800">{order.customer_name}</span>
                    </div>
                    <ChevronDown size={20} className={`text-slate-300 transition-transform ${expandedId === order.id ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
