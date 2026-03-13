"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Clock, MapPin, Warehouse, Plus, 
  Share2, Edit3, Trash2, ChevronDown, 
  Smartphone, BarChart3, Bot, X, Send 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { useRouter } from 'next/navigation';

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabase();

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('saban_dispatch')
      .select('*')
      .order('scheduled_time', { ascending: true });
    if (!error) setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // לחיצה על משבצת זמן - פותחת טופס עם נתונים מוזנים
  const openNewOrder = (driver: string, time: string) => {
    router.push(`/admin/dispatch-new?driver=${driver}&time=${time}`);
  };

  // שיתוף דוח יומי לקבוצה
  const shareDailyReport = () => {
    let report = `*📊 דוח סידור עבודה - ח. סבן*\n`;
    report += `------------------------------\n`;
    
    drivers.forEach(d => {
      report += `\n*🚛 ${d.name}:*\n`;
      const driverOrders = orders.filter(o => o.driver_name === d.name);
      if (driverOrders.length === 0) report += `_אין הזמנות משובצות_\n`;
      driverOrders.forEach(o => {
        report += `⏰ ${o.scheduled_time.slice(0,5)} | 👤 ${o.customer_name} | 📍 ${o.address}\n`;
      });
    });

    report += `\n------------------------------\n`;
    report += `🤖 *לינק לצ'אט AI ושאלות סידור:* \n`;
    report += `https://saban-os.vercel.app/ai-ask\n`;

    const encodedReport = encodeURIComponent(report);
    window.open(`https://wa.me/?text=${encodedReport}`, '_blank');
    toast.success("דוח סידור נשלח לווטסאפ!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק הזמנה זו מהסידור?")) return;
    const { error } = await supabase.from('saban_dispatch').delete().eq('id', id);
    if (!error) {
      toast.success("הזמנה נמחקה");
      fetchOrders();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-bounce text-[#0B2C63]">מתחבר לחמ"ל סבן...</div>;

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header יוקרתי */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[3rem] shadow-2xl mb-8 border-b-4 border-blue-500/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div onClick={() => router.push('/')} className="cursor-pointer">
            <h1 className="text-3xl font-black italic tracking-tighter">SABAN<span className="text-blue-400">OS</span></h1>
            <Badge variant="outline" className="text-blue-200 border-blue-400/30 text-[10px]">CONTROL PANEL</Badge>
          </div>
          <div className="flex gap-3">
             <Button onClick={shareDailyReport} className="bg-green-600 hover:bg-green-700 rounded-2xl gap-2 font-bold shadow-lg h-12">
              <Share2 size={18} /> שדר לקבוצה
            </Button>
            <Button onClick={() => router.push('/admin/dispatch-new')} className="bg-blue-600 hover:bg-blue-500 rounded-2xl gap-2 font-bold shadow-lg h-12 px-6">
              <Plus size={20} /> חדש
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            {/* כותרת נהג + גרף זמן לחיץ */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-200/50 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <img src={driver.img} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-2xl border-2 border-white" />
                <div>
                  <h2 className="text-2xl font-black text-slate-800 leading-none">{driver.name}</h2>
                  <p className="text-blue-600 font-bold text-xs mt-1 uppercase tracking-widest">לחץ על משבצת להוספה</p>
                </div>
              </div>

              {/* גרף ציר זמן אינטראקטיבי */}
              <div className="flex gap-1.5 overflow-x-auto pb-4 no-scrollbar relative z-10">
                {timeSlots.map(time => {
                  const order = orders.find(o => o.driver_name === driver.name && o.scheduled_time.startsWith(time.slice(0,4)));
                  return (
                    <motion.div 
                      key={time} 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => order ? setExpandedId(order.id) : openNewOrder(driver.name, time)}
                      className={`flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group`}
                    >
                      <div className={`w-10 h-16 rounded-2xl transition-all flex items-center justify-center ${order ? 'bg-[#0B2C63] shadow-lg border-2 border-blue-400' : 'bg-slate-100 border border-slate-200 hover:bg-blue-50'}`}>
                        {order ? <Truck size={16} className="text-white" /> : <Plus size={14} className="text-slate-300 group-hover:text-blue-400" />}
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{time}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* רשימת המבורגר נפתחת */}
            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="border-none shadow-lg rounded-[1.5rem] overflow-hidden bg-white hover:ring-2 ring-blue-500/20 transition-all">
                  <div 
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="p-5 cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 text-blue-700 font-black px-4 py-2 rounded-xl text-sm italic shadow-inner">
                        {order.scheduled_time.slice(0, 5)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-lg leading-none">{order.customer_name}</span>
                        <span className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1"><MapPin size={10}/> {order.address.split(',')[0]}</span>
                      </div>
                    </div>
                    <ChevronDown size={24} className={`text-slate-300 transition-transform duration-500 ${expandedId === order.id ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {expandedId === order.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50">
                        <div className="p-6 space-y-5 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase">כתובת מלאה</p>
                              <p className="text-sm font-bold text-slate-700">{order.address}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase">מחסן מקור</p>
                              <p className="text-sm font-bold text-blue-600">{order.warehouse_source}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-4 border-t border-slate-200/50">
                            <Button variant="outline" className="flex-1 rounded-xl font-bold text-slate-600 border-slate-200">
                              <Edit3 size={16} className="ml-2" /> ערוך
                            </Button>
                            <Button onClick={() => handleDelete(order.id)} variant="outline" className="flex-1 rounded-xl font-bold text-red-500 border-red-100 hover:bg-red-50">
                              <Trash2 size={16} className="ml-2" /> מחק
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* כפתור ה-AI הצף */}
      <button 
        onClick={() => router.push('/ai-ask')}
        className="fixed bottom-8 right-8 w-20 h-20 bg-[#0B2C63] text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group border-4 border-blue-400/20"
      >
        <Bot size={40} className="group-hover:animate-bounce" />
        <span className="absolute -top-2 -left-2 bg-red-500 text-[10px] font-black px-2 py-1 rounded-full border-2 border-white">LIVE AI</span>
      </button>
    </div>
  );
}
