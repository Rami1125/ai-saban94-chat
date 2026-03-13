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
import Link from 'next/link';

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

// יצירת ציר זמן מ-06:00 עד 16:00
const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanModernDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchOrders = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]; // לצורך הבדיקה נביא הכל
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

  const handleDelete = async (id: string) => {
    if (!confirm("בטוח שרוצה למחוק את ההזמנה?")) return;
    const { error } = await supabase.from('saban_dispatch').delete().eq('id', id);
    if (!error) {
      toast.success("ההזמנה נמחקה");
      fetchOrders();
    }
  };

  const shareSchedule = () => {
    const text = `*סידור עבודה ח. סבן*\n📲 להתקנת האפליקציה וצפייה ב-LIVE:\nhttps://saban-os.vercel.app/install`;
    navigator.clipboard.writeText(text);
    toast.success("לינק הקסם הועתק! המשתמשים יתבקשו להתקין את האפליקציה.");
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">טוען חמ"ל סבן...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header מודרני */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[40px] shadow-2xl mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">SABAN<span className="text-blue-400 font-light">OS</span></h1>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">מצב סידור און-ליין</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/dispatch-new">
              <Button className="bg-blue-500 hover:bg-blue-400 rounded-2xl gap-2 font-bold shadow-lg">
                <Plus size={18} /> חדש
              </Button>
            </Link>
            <Button onClick={shareSchedule} variant="outline" className="border-blue-400 text-white hover:bg-white/10 rounded-2xl gap-2">
              <Share2 size={18} /> שיתוף
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            {/* כותרת נהג וגרף זמן */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-blue-50" />
                <div>
                  <h2 className="text-xl font-black text-slate-800">{driver.name}</h2>
                  <div className="flex items-center gap-1 text-blue-600 font-bold text-xs uppercase">
                    <BarChart3 size={14} /> לו"ז חצי-שעתי
                  </div>
                </div>
              </div>

              {/* גרף ציר זמן */}
              <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(time.slice(0,4)));
                  return (
                    <div key={time} className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className={`w-8 h-12 rounded-lg transition-all ${hasOrder ? 'bg-blue-600 shadow-md scale-110' : 'bg-slate-100'}`} />
                      <span className="text-[10px] font-bold text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* רשימת הזמנות "המבורגר" */}
            <div className="space-y-3">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                  <div 
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="p-4 cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 text-blue-700 font-black px-3 py-1 rounded-xl text-sm italic">
                        {order.scheduled_time.slice(0, 5)}
                      </div>
                      <span className="font-black text-slate-800">{order.customer_name}</span>
                    </div>
                    <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {expandedId === order.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-50 bg-slate-50/50">
                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm font-bold text-slate-600">
                            <div className="flex items-center gap-2"><MapPin size={16} className="text-red-500" /> {order.address}</div>
                            <div className="flex items-center gap-2"><Warehouse size={16} className="text-blue-500" /> {order.warehouse_source}</div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                             {/* כאן יבואו התגיות של סוג ההובלה (בוסטאני) */}
                             <Badge variant="outline" className="border-blue-200 text-blue-700">הובלת מנוף</Badge>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <Button size="sm" variant="ghost" className="text-blue-600 font-bold gap-1 flex-1">
                              <Edit3 size={14} /> עריכה
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(order.id)} className="text-red-500 font-bold gap-1 flex-1">
                              <Trash2 size={14} /> מחיקה
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

      {/* כפתור לינק קסם להתקנה - מופיע רק בנייד */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto">
        <Button onClick={shareSchedule} className="bg-slate-900 text-white rounded-full px-8 h-14 shadow-2xl gap-2 font-black border-2 border-blue-500/30 active:scale-90 transition-all">
          <Smartphone size={20} className="text-blue-400" />
          שלח לינק להתקנת אפליקציה
        </Button>
      </div>
    </div>
  );
}
