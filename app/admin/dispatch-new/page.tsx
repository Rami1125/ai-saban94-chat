"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Calendar, Clock, Warehouse, MapPin, Share2, Bot 
} from "lucide-react";
import { toast, Toaster } from "sonner";

// נתוני נהגים וסוגי הובלה
const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB' }
];

const deliveryTypes = [
  { id: 'is_truck_delivery', label: 'הובלת משאית' },
  { id: 'is_crane_delivery', label: 'הובלת מנוף' },
  { id: 'is_crane_15m', label: 'מנוף 15 מטר' },
  { id: 'is_self_pickup', label: 'משיכה עצמית' },
  { id: 'is_external_driver', label: 'מוביל חיצוני' },
  { id: 'is_waste_collection', label: 'איסוף בלות' },
  { id: 'is_site_access', label: 'גישה לאתר' },
  { id: 'is_crane_work', label: 'עבודת מנוף' },
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanProfessionalDispatch() {
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
    if (!newOrder.customer_name) return toast.error("שם לקוח חסר");
    const payload = { ...newOrder, ...newOrder.types };
    delete payload.types;
    
    const { error } = await supabase.from('saban_dispatch').insert([payload]);
    if (!error) {
      toast.success("הזמנה נוספה לסידור");
      setShowForm(false);
      setNewOrder({ ...newOrder, customer_name: '', address: '', types: {} });
      fetchOrders();
    }
  };

  const shareWhatsAppReport = () => {
    let report = `🏗️ *סידור עבודה - ח. סבן* 🏗️\n📅 תאריך: *${newOrder.scheduled_date}*\n\n`;
    
    drivers.forEach(d => {
      const dOrders = orders.filter(o => o.driver_name === d.name);
      report += `*--- נהג: ${d.name} ---*\n`;
      if (dOrders.length === 0) report += "_אין הזמנות_\n";
      dOrders.forEach(o => {
        report += `⏰ ${o.scheduled_time.slice(0,5)} | 👤 *${o.customer_name}*\n📍 ${o.address}\n`;
      });
      report += `\n`;
    });

    report += `🤖 *לעדכונים ובירורים מול המוח:* \n🔗 https://saban-os.vercel.app/ai-ask\n`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63]">SABAN OS טוען...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header המקצועי */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[3rem] shadow-2xl mb-8 border-b-4 border-blue-500/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">SABAN<span className="text-blue-400">OS</span></h1>
            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Logistic Control Center</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={shareWhatsAppReport} variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 rounded-xl gap-2 font-bold text-xs h-10">
              <Share2 size={16} /> דו"ח וואטסאפ
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-black shadow-lg h-10 px-4">
              <Plus size={18} /> הזמנה חדשה
            </Button>
          </div>
        </div>
      </div>

      {/* טופס יצירה (שחזור מלא) */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 space-y-5 shadow-2xl my-auto border-t-8 border-blue-600">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-[#0B2C63]">פרטי הזמנה חדשה</h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400">תאריך</label>
                <input type="date" value={newOrder.scheduled_date} onChange={e => setNewOrder({...newOrder, scheduled_date: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400">שעה</label>
                <input type="time" value={newOrder.scheduled_time} onChange={e => setNewOrder({...newOrder, scheduled_time: e.target.value})} className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold" />
              </div>
            </div>

            <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 font-bold text-lg focus:border-blue-500 outline-none transition-all" />
            <input placeholder="כתובת מלאה" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 font-bold focus:border-blue-500 outline-none transition-all" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {deliveryTypes.map(t => (
                <div key={t.id} onClick={() => setNewOrder({...newOrder, types: {...newOrder.types, [t.id]: !newOrder.types[t.id]}})} 
                     className={`cursor-pointer p-3 rounded-xl border-2 font-bold text-[11px] text-center transition-all ${newOrder.types[t.id] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  {t.label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <select value={newOrder.warehouse_source} onChange={e => setNewOrder({...newOrder, warehouse_source: e.target.value})} className="h-12 px-4 rounded-xl border-2 border-slate-100 font-bold bg-white">
                <option>התלמיד</option><option>החרש</option>
              </select>
              <select value={newOrder.driver_name} onChange={e => setNewOrder({...newOrder, driver_name: e.target.value})} className="h-12 px-4 rounded-xl border-2 border-slate-100 font-bold bg-white">
                <option>חכמת</option><option>עלי</option>
              </select>
            </div>

            <Button onClick={saveOrder} className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xl text-white shadow-xl transform active:scale-95 transition-all">
              שמור הזמנה 🔥
            </Button>
          </div>
        </div>
      )}

      {/* תצוגת לוח הנהגים */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 z-0" />
              <div className="flex items-center gap-5 mb-8 relative z-10">
                <img src={driver.img} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-xl border-4 border-white" />
                <div>
                  <h2 className="text-2xl font-black text-slate-800">{driver.name}</h2>
                  <Badge className="bg-blue-600 text-white font-bold">פעיל בסידור</Badge>
                </div>
              </div>

              {/* גרף זמן לחיץ */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar relative z-10">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(time.slice(0,4)));
                  return (
                    <div key={time} onClick={() => { setNewOrder({...newOrder, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }} 
                         className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className={`w-11 h-16 rounded-2xl border-2 flex items-center justify-center transition-all shadow-sm ${hasOrder ? 'bg-[#0B2C63] border-blue-400 scale-105' : 'bg-slate-50 border-slate-100 hover:border-blue-400 hover:bg-white'}`}>
                        {hasOrder ? <Truck size={18} className="text-white" /> : <Plus size={16} className="text-slate-300 group-hover:text-blue-500" />}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 tracking-tighter">{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* רשימת הזמנות */}
            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="border-none shadow-lg rounded-[1.5rem] bg-white overflow-hidden transition-all hover:translate-x-1">
                  <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-5 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#0B2C63] text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-md italic">{order.scheduled_time.slice(0, 5)}</div>
                      <span className="font-black text-slate-800 text-lg tracking-tight">{order.customer_name}</span>
                    </div>
                    <ChevronDown size={22} className={`text-slate-300 transition-transform duration-300 ${expandedId === order.id ? 'rotate-180 text-blue-600' : ''}`} />
                  </div>
                  
                  {expandedId === order.id && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-red-500"/> {order.address}</div>
                        <div className="flex items-center gap-2"><Warehouse size={14} className="text-blue-600"/> {order.warehouse_source}</div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                         <Button onClick={() => {if(confirm('למחוק?')) supabase.from('saban_dispatch').delete().eq('id', order.id).then(fetchOrders)}} variant="ghost" className="text-red-500 hover:bg-red-50 font-black text-xs gap-1">
                           <Trash2 size={16}/> מחק הזמנה
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

      {/* כפתור צף מהיר ל-AI */}
      <div className="fixed bottom-6 left-6 z-[90]">
        <Button onClick={() => window.location.href='/ai-ask'} className="w-16 h-16 rounded-full bg-blue-600 shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center p-0">
          <Bot size={32} className="text-white" />
        </Button>
      </div>
    </div>
  );
}
