"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Calendar, Clock, Warehouse, MapPin, Share2, Bot, UserCheck, HardHat, Play, ShoppingCart, ArrowLeftRight
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

export default function SabanOSFullDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); // בקשות מאיציק
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

  // טעינת נתונים והאזנה ל-Realtime
  const fetchData = useCallback(async () => {
    const { data: dispatchData } = await supabase.from('saban_dispatch').select('*').order('scheduled_time', { ascending: true });
    const { data: requestData } = await supabase.from('itzik_requests').select('*').eq('status', 'ממתין לסידור');
    
    setOrders(dispatchData || []);
    setRequests(requestData || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();

    // מאזין לשינויים בסידור ובבקשות
    const dispatchChannel = supabase.channel('dispatch_updates').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_dispatch' }, fetchData).subscribe();
    const requestChannel = supabase.channel('request_updates').on('postgres_changes', { event: '*', schema: 'public', table: 'itzik_requests' }, fetchData).subscribe();

    return () => {
      supabase.removeChannel(dispatchChannel);
      supabase.removeChannel(requestChannel);
    };
  }, [fetchData, supabase]);

  // פונקציית משיכת בקשה של איציק לסידור הראשי
  const approveItzikRequest = async (req: any) => {
    try {
      // 1. הוספה לסידור הראשי
      const { error: insertError } = await supabase.from('saban_dispatch').insert([{
        customer_name: req.request_type === 'העברה' ? req.from_branch + ' > ' + req.to_branch : 'הזמנת חנות',
        order_id_comax: req.doc_number,
        warehouse_source: req.from_branch || 'התלמיד',
        created_by: 'איציק זהבי',
        scheduled_time: req.delivery_time || '07:00',
        delivery_type: req.request_type === 'העברה' ? 'העברה בין סניפים' : 'הזמנה חדשה',
        driver_name: 'חכמת' // ברירת מחדל, ניתן לשנות בלוח
      }]);

      if (insertError) throw insertError;

      // 2. עדכון סטטוס בטבלת הבקשות
      await supabase.from('itzik_requests').update({ status: 'אושר' }).eq('id', req.id);
      
      toast.success("בקשת איציק הועברה לסידור!");
      fetchData();
    } catch (err) {
      toast.error("שגיאה בהעברת הבקשה");
    }
  };

  const saveOrderAndShare = async () => {
    if (!newOrder.customer_name || !newOrder.order_id_comax) {
        return toast.error("חובה להזין שם לקוח ומספר הזמנה מקומקס");
    }

    const { error } = await supabase.from('saban_dispatch').insert([newOrder]);
    
    if (!error) {
      toast.success("הזמנה נשמרה בסידור");
      const message = `*📦 הזמנה חדשה - SabanOS*\n👤 *לקוח:* ${newOrder.customer_name}\n🆔 *קומקס:* ${newOrder.order_id_comax}\n🏗️ *הובלה:* ${newOrder.delivery_type}\n⏰ *שעה:* ${newOrder.scheduled_time}\n✍️ *רשם:* ${newOrder.created_by}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      setShowForm(false);
      setNewOrder({ ...newOrder, customer_name: '', address: '', order_id_comax: '' });
      fetchData();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63]">SABAN OS טוען...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-6 border-b-4 border-blue-500/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic text-white">SABAN<span className="text-blue-400">OS</span></h1>
            <p className="text-[10px] text-blue-200 font-bold uppercase">Control Board</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 rounded-xl gap-2 font-black shadow-lg">
            <Plus size={20} /> הזמנה חדשה
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* לוח בקשות איציק - חדש */}
        {requests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-[#0B2C63] flex items-center gap-2">📢 בקשות חדשות מהחנות ({requests.length})</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {requests.map(req => (
                <Card key={req.id} className="min-w-[280px] p-4 bg-white border-r-4 border-orange-500 shadow-md rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                       {req.request_type === 'העברה' ? <ArrowLeftRight size={16} className="text-orange-500"/> : <ShoppingCart size={16} className="text-blue-600"/>}
                       <span className="font-black text-sm">{req.request_type} #{req.doc_number}</span>
                    </div>
                    <Badge className="bg-orange-50 text-orange-600 text-[9px]">איציק</Badge>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-3 font-bold">
                    {req.from_branch} ➡️ {req.to_branch || 'לקוח'} | שעה: {req.delivery_time}
                  </div>
                  <Button onClick={() => approveItzikRequest(req)} className="w-full h-8 bg-[#0B2C63] text-white text-[10px] font-black rounded-lg gap-1">
                    <Play size={12}/> משוך לסידור
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* לוח נהגים - לוגיקה מקורית */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {timeSlots.map(time => {
                    const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time?.startsWith(time.slice(0,4)));
                    return (
                      <div key={time} onClick={() => { setNewOrder({...newOrder, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }} 
                           className="flex flex-col items-center gap-1 cursor-pointer">
                        <div className={`w-10 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100'}`}>
                          {hasOrder ? <Truck size={16} className="text-white" /> : <Clock size={14} className="text-slate-300" />}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{time}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <div className="space-y-3">
                {orders.filter(o => o.driver_name === driver.name).map((order) => (
                  <Card key={order.id} className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
                    <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-4 flex justify-between items-center cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#0B2C63] text-white font-black px-2 py-1 rounded-lg text-[10px]">{order.scheduled_time?.slice(0, 5)}</div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-sm">{order.customer_name}</span>
                          <span className="text-[9px] text-blue-600 font-bold">#{order.order_id_comax}</span>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-slate-300 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                    </div>
                    {expandedId === order.id && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                          <div className="flex items-center gap-1"><MapPin size={12}/> {order.address || 'לא צוינה כתובת'}</div>
                          <div className="flex items-center gap-1"><Warehouse size={12}/> {order.warehouse_source}</div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t">
                           <Button onClick={() => supabase.from('saban_dispatch').delete().eq('id', order.id).then(fetchData)} variant="ghost" className="text-red-500 h-8 text-[10px] font-black">מחק הזמנה</Button>
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

      {/* טופס יצירה - לוגיקה מקורית */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[2rem] p-6 space-y-4 border-t-8 border-blue-600">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black">הזמנה חדשה</h2>
              <button onClick={() => setShowForm(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex gap-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setNewOrder({...newOrder, created_by: m})}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${newOrder.created_by === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {m}
                    </button>
                ))}
            </div>
            <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 font-bold" />
            <input placeholder="מספר קומקס" value={newOrder.order_id_comax} onChange={e => setNewOrder({...newOrder, order_id_comax: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 font-bold" />
            <Button onClick={saveOrderAndShare} className="w-full h-14 bg-green-600 text-white rounded-xl font-black">שמור ושתף לערוץ ✨</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
