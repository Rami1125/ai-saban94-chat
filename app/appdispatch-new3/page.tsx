"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Clock, Warehouse, MapPin, Share2, UserCheck, HardHat, Recycle, Bell, Play
} from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' },
  { name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', defaultType: 'מכולה ♻️' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const containerWarehouses = ['שארק (מחסן 30)', 'כראדי (מחסן 32)', 'שי שרון (מחסן 40)'];
const containerActions = ['הצבה', 'החלפה', 'הוצאה'];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanOSMasterDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
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
    delivery_type: 'מנוף 🏗️',
    container_action: 'הצבה'
  });

  const supabase = getSupabase();

  // שליחת Push בצורה אסינכרונית כדי לא לעצור את ה-WhatsApp
  const sendPush = async (title: string, msg: string) => {
    try {
      fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          app_id: "acc8a2bc-d54e-4261-b3d2-cc5c5f7b39d3",
          included_segments: ["All"],
          headings: { "he": title },
          contents: { "he": msg },
        })
      });
    } catch (err) { console.error("Push Error", err); }
  };

  const fetchData = useCallback(async () => {
    const { data: ords } = await supabase.from('saban_dispatch').select('*').order('scheduled_time', { ascending: true });
    const { data: reqs } = await supabase.from('itzik_requests').select('*').eq('status', 'pending');
    
    if (reqs && reqs.length > requests.length) {
      if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }
      toast.info("בקשה חדשה מאיציק זהבי 📢");
    }

    setOrders(ords || []);
    setRequests(reqs || []);
    setLoading(false);
  }, [supabase, requests.length]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('live').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  const saveOrder = async () => {
    if (!newOrder.customer_name || !newOrder.order_id_comax) {
        return toast.error("חסר שם לקוח או מספר מסמך");
    }

    try {
      const payload = { ...newOrder, start_process_time: new Date().toISOString() };
      const { error } = await supabase.from('saban_dispatch').insert([payload]);
      
      if (error) throw error;

      toast.success("נשמר בסידור");

      // שליחת ה-Push ברקע
      sendPush(
        newOrder.driver_name === 'פינוי פסולת' ? "♻️ מכולה חדשה" : "📦 הזמנה חדשה",
        `${newOrder.customer_name} | ${newOrder.driver_name}`
      );

      // בניית הודעת וואטסאפ
      const waMsg = `*📦 סדר יום SabanOS*\n👤 לקוח: ${newOrder.customer_name}\n🆔 מספר: ${newOrder.order_id_comax}\n🚚 נהג: ${newOrder.driver_name}\n⏰ שעה: ${newOrder.scheduled_time}`;
      
      // פתיחת וואטסאפ
      const waUrl = `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
      window.open(waUrl, '_blank');
      
      setShowForm(false);
      setNewOrder({ ...newOrder, customer_name: '', address: '', order_id_comax: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשמירה. וודא שביצעת SQL עדכון.");
    }
  };

  const approveRequest = async (req: any) => {
    await supabase.from('saban_dispatch').insert([{
      customer_name: req.customer_name || 'חנות',
      order_id_comax: req.doc_number,
      warehouse_source: req.from_branch || 'התלמיד',
      created_by: 'איציק זהבי',
      scheduled_time: req.delivery_time || '07:00',
      driver_name: 'חכמת'
    }]);
    await supabase.from('itzik_requests').update({ status: 'approved' }).eq('id', req.id);
    toast.success("בקשה אושרה!");
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63]">טוען SabanOS...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-6 border-b-4 border-blue-500/50 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">סידור <span className="text-blue-400"> ח.סבן</span></h1>
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Logistic Center</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-black shadow-lg border-none text-white h-12 px-6">
          <Plus size={20} /> הזמנה חדשה
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {requests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-[#0B2C63] flex items-center gap-2 px-1">
              <Bell className="text-orange-500 animate-bounce" size={20} /> בקשות ממתינות ({requests.length})
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {requests.map(req => (
                <Card key={req.id} className="min-w-[280px] p-5 bg-white border-r-8 border-orange-500 shadow-xl rounded-[2rem] border-none">
                  <div className="font-black text-slate-800 mb-1">{req.request_type} #{req.doc_number}</div>
                  <div className="text-[10px] text-slate-400 font-bold mb-3">{req.from_branch} ➡️ {req.to_branch || 'לקוח'}</div>
                  <Button onClick={() => approveRequest(req)} className="w-full h-10 bg-[#0B2C63] text-white font-black rounded-xl gap-2 border-none">
                    <Play size={14}/> אשר לסידור
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <div key={driver.name} className="space-y-4 text-right">
              <Card className="bg-white p-5 rounded-[2.2rem] shadow-xl border border-slate-100 relative overflow-hidden border-none">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                    {driver.name === 'פינוי פסולת' && <Recycle className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-md" size={20}/>}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">{driver.name}</h2>
                    <Badge className={`${driver.name === 'פינוי פסולת' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'} border-none font-bold text-[10px]`}>{driver.defaultType}</Badge>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {timeSlots.map(time => {
                    const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time?.startsWith(time.slice(0,4)));
                    return (
                      <div key={time} onClick={() => { 
                        setNewOrder({
                          ...newOrder, driver_name: driver.name, scheduled_time: time, delivery_type: driver.defaultType,
                          warehouse_source: driver.name === 'פינוי פסולת' ? 'שארק (מחסן 30)' : 'התלמיד'
                        }); 
                        setShowForm(true); 
                      }} className="flex flex-col items-center gap-1 cursor-pointer">
                        <div className={`w-10 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                          {hasOrder ? (driver.name === 'פינוי פסולת' ? <Recycle size={16} className="text-green-400"/> : <Truck size={16} className="text-white" />) : <Clock size={14} className="text-slate-300" />}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{time}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <div className="space-y-3">
                {orders.filter(o => o.driver_name === driver.name).map((order) => (
                  <Card key={order.id} className="border-none shadow-md rounded-2xl bg-white overflow-hidden hover:shadow-lg transition-all border-none">
                    <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-4 flex justify-between items-center cursor-pointer text-right" dir="rtl">
                      <div className="flex items-center gap-3">
                        <div className={`${driver.name === 'פינוי פסולת' ? 'bg-green-600' : 'bg-[#0B2C63]'} text-white font-black px-2 py-1 rounded-lg text-[10px]`}>{order.scheduled_time?.slice(0, 5)}</div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-sm">{order.customer_name}</span>
                          <span className="text-[10px] text-blue-600 font-bold">#{order.order_id_comax} {order.container_action ? `| ${order.container_action}` : ''}</span>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-slate-300 transition-transform ${expandedId === order.id ? 'rotate-180 text-blue-600' : ''}`} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 space-y-4 shadow-2xl border-t-[12px] border-blue-600 animate-in zoom-in-95 border-none">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black text-[#0B2C63] flex items-center gap-2">
                {newOrder.driver_name === 'פינוי פסולת' ? <Recycle className="text-green-600"/> : <HardHat className="text-blue-600"/>}
                הזמנה ל{newOrder.driver_name}
              </h2>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 p-2 rounded-full text-slate-400 border-none"><X size={20}/></button>
            </div>

            <div className="flex gap-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setNewOrder({...newOrder, created_by: m})}
                            className={`flex-1 py-3 rounded-2xl text-[11px] font-black border-none transition-all ${newOrder.created_by === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                        {m}
                    </button>
                ))}
            </div>

            {newOrder.driver_name === 'פינוי פסולת' && (
              <div className="grid grid-cols-3 gap-2 bg-green-50 p-2 rounded-2xl">
                {containerActions.map(act => (
                  <button key={act} onClick={() => setNewOrder({...newOrder, container_action: act})}
                          className={`py-2 rounded-xl text-[11px] font-black border-none transition-all ${newOrder.container_action === act ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600'}`}>
                    {act}
                  </button>
                ))}
              </div>
            )}

            <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500" />
            <input placeholder="מספר קומקס" value={newOrder.order_id_comax} onChange={e => setNewOrder({...newOrder, order_id_comax: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500" />
            
            <Button onClick={saveOrder} className="w-full h-16 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 border-none">
              שמור ושתף לווצאף 🚀
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
