"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Clock, Warehouse, MapPin, Share2, UserCheck, HardHat, Recycle, Menu, History, Calendar
} from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' },
  { name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', defaultType: 'מכולה ♻️' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const containerActions = ['הצבה', 'החלפה', 'הוצאה'];
const warehouses = [
  { id: '1', name: 'התלמיד (מחסן 1)' },
  { id: '4', name: 'החרש (מחסן 4)' }
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanOSMaster() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [newOrder, setNewOrder] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    warehouse_source: 'התלמיד (מחסן 1)',
    driver_name: 'חכמת',
    created_by: 'ראמי',
    order_id_comax: '',
    delivery_type: 'מנוף',
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

  const sendPushNotification = async (order: any) => {
    try {
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          app_id: "acc8a2bc-d54e-4261-b3d2-cc5c5f7b39d3",
          included_segments: ["All"],
          headings: { "he": order.driver_name === 'פינוי פסולת' ? "♻️ בקשת מכולה חדשה" : "📦 הזמנה חדשה בסידור" },
          contents: { "he": `${order.customer_name} | ${order.driver_name} | ${order.scheduled_time}` }
        })
      });
    } catch (e) { console.error("Push failed"); }
  };

  const saveOrder = async () => {
    if (!newOrder.customer_name || !newOrder.order_id_comax) return toast.error("חסר שם לקוח או מספר הזמנה");

    const { error } = await supabase.from('saban_master_dispatch').insert([{
      ...newOrder,
      start_process_time: new Date().toISOString()
    }]);

    if (!error) {
      toast.success("נשמר בהצלחה!");
      
      // שליחת התראה Push
      sendPushNotification(newOrder);

      // יצירת הודעת וואטסאפ מותאמת
      let msg = "";
      if (newOrder.driver_name === 'פינוי פסולת') {
        msg = `*♻️ פינוי פסולת - SabanOS*\n---------------------------\n🔹 *פעולה:* ${newOrder.container_action}\n👤 *לקוח:* ${newOrder.customer_name}\n🆔 *מספר:* ${newOrder.order_id_comax}\n📅 *תאריך:* ${newOrder.scheduled_date}\n⏰ *שעה:* ${newOrder.scheduled_time}\n✍️ *רשם:* ${newOrder.created_by}`;
      } else {
        msg = `*📦 הזמנה חדשה - SabanOS*\n---------------------------\n👤 *לקוח:* ${newOrder.customer_name}\n🆔 *מספר:* ${newOrder.order_id_comax}\n🚛 *נהג:* ${newOrder.driver_name}\n🏭 *מחסן:* ${newOrder.warehouse_source}\n📅 *תאריך:* ${newOrder.scheduled_date}\n⏰ *שעה:* ${newOrder.scheduled_time}\n✍️ *רשם:* ${newOrder.created_by}`;
      }

      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      setShowForm(false);
      setNewOrder({ ...newOrder, customer_name: '', order_id_comax: '' });
      fetchData();
    } else {
      toast.error("שגיאה בשמירה לטבלה");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63]">SABAN OS...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2rem] shadow-2xl mb-6 flex justify-between items-center relative z-50">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-colors border-none text-white">
          {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
        </button>
        <h1 className="text-2xl font-black italic">סידור<span className="text-blue-400">J.ח.סבן</span></h1>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 rounded-xl font-black h-10 px-4 text-white border-none shadow-lg">חדש +</Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-4">
            <Card className="bg-white p-5 rounded-[2rem] shadow-xl border-none relative overflow-hidden">
                <div className="flex items-center gap-4 mb-4">
                  <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                  <div>
                    <h2 className="text-xl font-black text-slate-800">{driver.name}</h2>
                    <Badge className="bg-blue-50 text-blue-700 border-none font-bold text-[10px] uppercase">{driver.defaultType}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {timeSlots.slice(0, 10).map(time => (
                    <div key={time} onClick={() => { setNewOrder({...newOrder, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }}
                         className="flex flex-col items-center gap-1 cursor-pointer">
                      <div className="w-10 h-14 rounded-xl border-2 flex items-center justify-center bg-slate-50 border-slate-100 hover:border-blue-300">
                        <Clock size={14} className="text-slate-300" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{time}</span>
                    </div>
                  ))}
                </div>
            </Card>

            <div className="space-y-3">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="p-4 rounded-2xl bg-white shadow-md border-none flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#0B2C63] text-white px-2 py-1 rounded-lg text-[10px] font-black">{order.scheduled_time}</div>
                        <div className="font-black text-slate-800 text-sm">{order.customer_name}</div>
                    </div>
                    <Button onClick={() => supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData)} variant="ghost" className="text-red-400 h-8 w-8 p-0 border-none">
                      <Trash2 size={16}/>
                    </Button>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 space-y-4 shadow-2xl border-t-[12px] border-blue-600 animate-in zoom-in-95 border-none">
            <div className="flex justify-between items-center mb-2 text-[#0B2C63]">
              <h2 className="text-xl font-black flex items-center gap-2">
                {newOrder.driver_name === 'פינוי פסולת' ? <Recycle size={20}/> : <Truck size={20}/>}
                הזמנה ל{newOrder.driver_name}
              </h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 p-2 rounded-full border-none text-slate-400 hover:text-black"><X size={20}/></button>
            </div>
            
            <div className="flex gap-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setNewOrder({...newOrder, created_by: m})}
                            className={`flex-1 py-3 rounded-2xl text-[11px] font-black border-none transition-all ${newOrder.created_by === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                        {m}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-1 uppercase italic flex items-center gap-1"><Calendar size={10}/> תאריך</label>
                <input type="date" value={newOrder.scheduled_date} onChange={e => setNewOrder({...newOrder, scheduled_date: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-1 uppercase italic flex items-center gap-1"><Clock size={10}/> שעה</label>
                <select value={newOrder.scheduled_time} onChange={e => setNewOrder({...newOrder, scheduled_time: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 font-bold text-sm bg-white outline-none focus:border-blue-500">
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500" />
            <input placeholder="מספר קומקס" value={newOrder.order_id_comax} onChange={e => setNewOrder({...newOrder, order_id_comax: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500" />
            
            {newOrder.driver_name === 'פינוי פסולת' ? (
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-green-600 mr-1 uppercase">סוג פעולה (מכולה)</label>
                 <select value={newOrder.container_action} onChange={e => setNewOrder({...newOrder, container_action: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-green-200 font-bold text-right outline-none focus:border-green-500 bg-white">
                    {containerActions.map(act => <option key={act} value={act}>{act}</option>)}
                 </select>
               </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 mr-1 uppercase">מחסן מקור</label>
                <select value={newOrder.warehouse_source} onChange={e => setNewOrder({...newOrder, warehouse_source: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-blue-200 font-bold text-right outline-none focus:border-blue-500 bg-white">
                  {warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
              </div>
            )}

            <Button onClick={saveOrder} className="w-full h-16 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-xl shadow-xl transition-all border-none active:scale-95">
              שמור ושתף לסידור 🚀
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
