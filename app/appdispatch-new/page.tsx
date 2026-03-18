"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Calendar, Clock, Warehouse, MapPin, Share2, Bot, UserCheck, HardHat
} from "lucide-react";
import { toast, Toaster } from "sonner";

// נתוני נהגים לפי הקובץ הקיים
const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanOSVipDispatch() {
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
    created_by: 'ראמי',
    order_id_comax: '',
    delivery_type: 'מנוף 🏗️'
  });

  const supabase = getSupabase();

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('saban_dispatch').select('*').order('scheduled_time', { ascending: true });
    setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const saveOrderAndShare = async () => {
    if (!newOrder.customer_name || !newOrder.order_id_comax) {
        return toast.error("חובה להזין שם לקוח ומספר הזמנה מקומקס");
    }

    const startTime = new Date().toISOString();
    const payload = { ...newOrder, start_process_time: startTime };
    
    // שמירה ל-Supabase לטובת המלשינון והיסטוריה
    const { error } = await supabase.from('saban_dispatch').insert([payload]);
    
    if (!error) {
      toast.success("הזמנה נשמרה בסידור");
      
      // יצירת תבנית וואטסאפ מעוצבת
      const message = `*📦 הזמנה חדשה בסידור - SabanOS*\n` +
                      `---------------------------\n` +
                      `👤 *לקוח:* ${newOrder.customer_name}\n` +
                      `🆔 *מספר קומקס:* ${newOrder.order_id_comax}\n` +
                      `🏗️ *סוג הובלה:* ${newOrder.delivery_type}\n` +
                      `🚛 *נהג:* ${newOrder.driver_name}\n` +
                      `🏭 *מחסן:* ${newOrder.warehouse_source}\n` +
                      `⏰ *שעת הגעה:* ${newOrder.scheduled_time}\n` +
                      `✍️ *נרשם ע"י:* ${newOrder.created_by}\n` +
                      `---------------------------\n` +
                      `_הזמנה חיה בערוץ עד להפקה תעודת משלוח_`;

      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      
      setShowForm(false);
      setNewOrder({ ...newOrder, customer_name: '', address: '', order_id_comax: '' });
      fetchOrders();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63]">SABAN OS טוען מערכת...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header - בקו העיצוב הקיים */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-6 border-b-4 border-blue-500/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white">SABAN<span className="text-blue-400">OS</span></h1>
            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Logistic Control Center</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-black shadow-lg h-12 px-6">
            <Plus size={20} /> הזמנה חדשה
          </Button>
        </div>
      </div>

      {/* לוח נהגים דינמי */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-4">
            <Card className="bg-white p-5 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                <div>
                  <h2 className="text-xl font-black text-slate-800">{driver.name}</h2>
                  <Badge className="bg-blue-50 text-blue-700 border-none font-bold text-[10px]">{driver.defaultType}</Badge>
                </div>
              </div>

              {/* שעון דינמי לחיץ מתחת לנהג */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(time.slice(0,4)));
                  return (
                    <div key={time} onClick={() => { setNewOrder({...newOrder, driver_name: driver.name, scheduled_time: time, delivery_type: driver.defaultType}); setShowForm(true); }} 
                         className="flex flex-col items-center gap-1 cursor-pointer group">
                      <div className={`w-10 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100'}`}>
                        {hasOrder ? <Truck size={16} className="text-white" /> : <Clock size={14} className="text-slate-300" />}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* רשימת ההזמנות לנהג */}
            <div className="space-y-3">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="border-none shadow-md rounded-2xl bg-white overflow-hidden hover:shadow-lg transition-shadow">
                  <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-4 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#0B2C63] text-white font-black px-2 py-1 rounded-lg text-[10px] italic">{order.scheduled_time.slice(0, 5)}</div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-md leading-tight">{order.customer_name}</span>
                        <span className="text-[10px] text-blue-600 font-bold">#${order.order_id_comax}</span>
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-slate-300 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {expandedId === order.id && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-1"><MapPin size={12}/> {order.address || 'לא צוינה כתובת'}</div>
                        <div className="flex items-center gap-1"><Warehouse size={12}/> {order.warehouse_source}</div>
                        <div className="flex items-center gap-1"><UserCheck size={12}/> רשם: {order.created_by}</div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                         <Button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('עדכון על הזמנה ' + order.order_id_comax)}`, '_blank')} variant="ghost" className="text-blue-600 h-8 text-[10px] font-black">
                           <Share2 size={14} className="ml-1"/> שתף שוב
                         </Button>
                         <Button onClick={() => {if(confirm('למחוק הזמנה?')) supabase.from('saban_dispatch').delete().eq('id', order.id).then(fetchOrders)}} variant="ghost" className="text-red-500 h-8 text-[10px] font-black">
                           <Trash2 size={14} className="ml-1"/> מחק
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

      {/* טופס יצירה מהיר - Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[2rem] p-6 space-y-4 shadow-2xl border-t-8 border-blue-600">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-[#0B2C63]">הזמנה חדשה לסידור</h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><X size={20}/></button>
            </div>

            {/* בחירת משתמש (ראמי/יואב/איציק) */}
            <div className="flex gap-2 mb-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setNewOrder({...newOrder, created_by: m})}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${newOrder.created_by === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {m}
                    </button>
                ))}
            </div>

            <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} 
                   className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 font-bold focus:border-blue-500 outline-none" />
            
            <div className="grid grid-cols-2 gap-3">
                <input placeholder="מספר קומקס" value={newOrder.order_id_comax} onChange={e => setNewOrder({...newOrder, order_id_comax: e.target.value})} 
                       className="h-12 px-4 rounded-xl border-2 border-slate-100 font-bold focus:border-blue-500 outline-none" />
                <select value={newOrder.warehouse_source} onChange={e => setNewOrder({...newOrder, warehouse_source: e.target.value})} 
                        className="h-12 px-4 rounded-xl border-2 border-slate-100 font-bold bg-white focus:border-blue-500 outline-none">
                    <option>התלמיד</option><option>החרש</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div onClick={() => setNewOrder({...newOrder, delivery_type: 'מנוף 🏗️'})} 
                     className={`cursor-pointer p-3 rounded-xl border-2 font-black text-center text-xs flex items-center justify-center gap-2 ${newOrder.delivery_type.includes('מנוף') ? 'bg-orange-500 border-orange-500 text-white' : 'bg-slate-50 border-slate-100'}`}>
                    <HardHat size={16}/> מנוף
                </div>
                <div onClick={() => setNewOrder({...newOrder, delivery_type: 'משאית 🚛'})} 
                     className={`cursor-pointer p-3 rounded-xl border-2 font-black text-center text-xs flex items-center justify-center gap-2 ${newOrder.delivery_type.includes('משאית') ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100'}`}>
                    <Truck size={16}/> משאית
                </div>
            </div>

            <Button onClick={saveOrderAndShare} className="w-full h-14 bg-green-600 hover:bg-green-500 rounded-xl font-black text-lg text-white shadow-xl">
              שמור ושתף לערוץ ✨
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
