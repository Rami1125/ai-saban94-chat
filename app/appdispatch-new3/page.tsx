"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Clock, Warehouse, MapPin, Share2, UserCheck, HardHat, Recycle, Menu, History
} from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' },
  { name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', defaultType: 'מכולה ♻️' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const containerWarehouses = ['שארק (30)', 'כראדי (32)', 'שי שרון (40)'];

export default function SabanOSMaster() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [newOrder, setNewOrder] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    warehouse_source: 'התלמיד',
    driver_name: 'חכמת',
    created_by: 'ראמי',
    order_id_comax: '',
    delivery_type: 'מנוף',
    container_action: 'הצבה'
  });

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saban_master_dispatch')
        .select('*')
        .order('scheduled_time', { ascending: true });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('master_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  const generateWAMessage = (order: any) => {
    const isMobile = typeof navigator !== 'undefined' && /iPhone|Android/i.test(navigator.userAgent);
    
    if (!isMobile) {
      return `סידור ח.סבן - הזמנה חדשה\nלקוח: ${order.customer_name}\nמספר: ${order.order_id_comax}\nנהג: ${order.driver_name}\nשעה: ${order.scheduled_time}\nמחסן: ${order.warehouse_source}`;
    }

    const emoji = order.driver_name === 'פינוי פסולת' ? '♻️' : '📦';
    return `${emoji} *הזמנה חדשה - ח.סבן*\n---------------------------\n👤 *לקוח:* ${order.customer_name}\n🆔 *מספר:* ${order.order_id_comax}\n🚛 *נהג:* ${order.driver_name}\n⏰ *שעה:* ${order.scheduled_time}\n🏭 *מחסן:* ${order.warehouse_source}\n---------------------------\n_נשלח מהמערכת_`;
  };

  const saveOrder = async () => {
    if (!newOrder.customer_name || !newOrder.order_id_comax) return toast.error("חובה למלא שם לקוח ומספר קומקס");

    try {
      const { error } = await supabase.from('saban_master_dispatch').insert([{
        ...newOrder,
        start_process_time: new Date().toISOString()
      }]);
      
      if (error) throw error;

      toast.success("נשמר בסידור בהצלחה!");
      window.open(`https://wa.me/?text=${encodeURIComponent(generateWAMessage(newOrder))}`, '_blank');
      setShowForm(false);
      setNewOrder({ ...newOrder, customer_name: '', order_id_comax: '' });
      fetchData();
    } catch (err) {
      toast.error("שגיאה בשמירה. וודא שהטבלה קיימת ב-DB");
    }
  };

  const shareMorningReport = () => {
    const report = `☀️ *דוח בוקר ח.סבן - ${new Date().toLocaleDateString('he-IL')}*\n` +
      orders.map(o => `• ${o.scheduled_time} | ${o.customer_name} | ${o.driver_name}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-[#0B2C63]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2C63]"></div>
      <div className="font-black animate-pulse">ח. סבן - טוען סידור...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-8 flex justify-between items-center relative z-50">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="p-2 hover:bg-white/10 rounded-xl transition-all border-none text-white"
        >
          {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
        </button>
        <h1 className="text-2xl font-black italic tracking-tighter">ח.סבן <span className="text-blue-400 text-3xl">סידור</span></h1>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 rounded-xl font-black h-12 px-6 border-none text-white shadow-lg active:scale-95 transition-all">
          חדש +
        </Button>
        
        {isMenuOpen && (
          <div className="absolute top-24 right-6 left-6 bg-white rounded-[2rem] shadow-2xl p-4 border border-slate-100 animate-in slide-in-from-top-4">
             <button onClick={shareMorningReport} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl text-[#0B2C63] font-black border-none text-right">
                <Share2 size={20} className="text-blue-600"/> שלח דוח בוקר לוואטסאפ
             </button>
             <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl text-[#0B2C63] font-black border-none text-right opacity-50">
                <History size={20} className="text-orange-500"/> היסטוריית פעולות (בקרוב)
             </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-4">
            <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-none relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                  <div>
                    <h2 className="text-xl font-black text-slate-800 leading-tight">{driver.name}</h2>
                    <Badge className="bg-blue-50 text-blue-700 border-none font-bold text-[10px] uppercase tracking-widest">{driver.defaultType}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00'].map(time => (
                    <div key={time} onClick={() => { setNewOrder({...newOrder, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }}
                         className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className="w-12 h-16 rounded-2xl border-2 flex items-center justify-center bg-slate-50 border-slate-100 group-hover:border-blue-300 group-hover:bg-blue-50 transition-all">
                        <Clock size={16} className="text-slate-300 group-hover:text-blue-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{time}</span>
                    </div>
                  ))}
                </div>
            </Card>

            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="p-5 rounded-3xl bg-white shadow-lg border-none flex justify-between items-center hover:translate-y-[-2px] transition-transform group">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#0B2C63] text-white px-3 py-1.5 rounded-xl text-xs font-black italic shadow-inner">{order.scheduled_time}</div>
                        <div className="text-right">
                            <div className="font-black text-slate-800 text-lg leading-tight">{order.customer_name}</div>
                            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">#{order.order_id_comax}</div>
                        </div>
                    </div>
                    <Button 
                      onClick={() => {
                        if(confirm("למחוק את ההזמנה?")) {
                          supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData);
                        }
                      }} 
                      variant="ghost" 
                      className="text-red-400 hover:bg-red-50 h-10 w-10 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border-none"
                    >
                      <Trash2 size={20}/>
                    </Button>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[3rem] p-10 space-y-6 shadow-2xl border-t-[12px] border-blue-600 animate-in zoom-in-95 border-none">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-[#0B2C63] italic">
                {newOrder.driver_name === 'פינוי פסולת' ? 'פינוי מכולה ♻️' : 'הזמנה חדשה 📦'}
              </h2>
              <button 
                onClick={() => setShowForm(false)} 
                className="bg-slate-100 p-2 rounded-full border-none text-slate-400 hover:text-slate-600"
              >
                <X size={24}/>
              </button>
            </div>
            
            <div className="flex gap-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setNewOrder({...newOrder, created_by: m})}
                            className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all border-none ${newOrder.created_by === m ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>
                        {m}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
              <input 
                placeholder="שם הלקוח" 
                value={newOrder.customer_name} 
                onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} 
                className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500 transition-all focus:bg-blue-50/30" 
              />
              <input 
                placeholder="מספר קומקס" 
                value={newOrder.order_id_comax} 
                onChange={e => setNewOrder({...newOrder, order_id_comax: e.target.value})} 
                className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-lg text-right outline-none focus:border-blue-500 transition-all focus:bg-blue-50/30" 
              />
              
              {newOrder.driver_name === 'פינוי פסולת' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic tracking-widest">מחסן מטפל</label>
                  <select 
                    value={newOrder.warehouse_source} 
                    onChange={e => setNewOrder({...newOrder, warehouse_source: e.target.value})} 
                    className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-right outline-none focus:border-blue-500 bg-white"
                  >
                    {containerWarehouses.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              )}
            </div>

            <Button 
              onClick={saveOrder} 
              className="w-full h-18 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-xl shadow-xl transition-all border-none active:scale-95 shadow-green-200"
            >
              שמור ושלח לוואטסאפ 🚀
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
