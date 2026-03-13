"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, MapPin, Send, Timer, Activity, 
  CheckCircle2, History, Info, MessageCircle, 
  ChevronDown, Bell, ShieldCheck, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner"; // המלשינון של המערכת

export default function DispatchStudio() {
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchDispatch = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });
    
    if (!error) setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDispatch();
    const channel = supabase.channel('realtime_saban')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_orders' }, (payload) => {
        toast.info(`עדכון מערכת: סטטוס שונה ל-${payload.new.status}`);
        fetchDispatch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDispatch, supabase]);

  const sendToPipe = async (type: 'driver' | 'customer', order: any) => {
    const endpoint = type === 'driver' ? '/api/dispatch/driver-brief' : '/api/dispatch/customer-notify';
    const targetName = type === 'driver' ? order.driver_name : order.customer_name;
    
    toast.promise(
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, driverName: order.driver_name, date: order.scheduled_date })
      }),
      {
        loading: `מזריק נתונים לצינור עבור ${targetName}...`,
        success: () => {
          window.playSuccessSound?.(); // הצליל ששמנו ב-HTML
          return `הצינור פתוח! הודעה נשלחה ל-${targetName}`;
        },
        error: (err) => `תקלה בצינור: ${err.message}`
      }
    );
  };

  const getLiveTimer = (startTime: string) => {
    if (!startTime) return 0;
    return Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-black animate-bounce text-blue-600">מתחבר לסינכרון LIVE...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20" dir="rtl">
      
      {/* לוח מחוונים עליון (Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-all" />
          <CardContent className="p-6 flex justify-between items-center relative z-10">
            <div>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">מנופים בפריקה</p>
              <h2 className="text-4xl font-black text-white leading-none mt-1">
                {orders.filter(o => o.status === 'unloading').length}
              </h2>
            </div>
            <Activity className="text-blue-500 animate-pulse" size={32} />
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-lg">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">הזמנות להיום</p>
              <h2 className="text-4xl font-black text-slate-800 leading-none mt-1">{orders.length}</h2>
            </div>
            <ShieldCheck className="text-green-500" size={32} />
          </CardContent>
        </Card>

        <Card className="bg-blue-600 border-none shadow-lg">
          <CardContent className="p-6 flex justify-between items-center text-white">
            <div>
              <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest text-center">צינור JONI</p>
              <h2 className="text-xl font-black leading-none mt-1 tracking-tighter text-center">LIVE SYNC</h2>
            </div>
            <Zap className="text-yellow-300 fill-yellow-300" size={32} />
          </CardContent>
        </Card>
      </div>

      {/* רשימת הזמנות */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-800 flex items-center gap-2 mr-2">
          <Bell size={18} className="text-blue-600" /> סידור עבודה חי
        </h3>
        
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div key={order.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`overflow-hidden border-none shadow-xl transition-all ${order.status === 'unloading' ? 'ring-2 ring-blue-600' : ''}`}>
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-xl text-slate-900 leading-none">{order.customer_name}</h4>
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-2">
                          <MapPin size={12} className="text-blue-600" /> {order.delivery_address}
                        </div>
                      </div>
                      <Badge className="bg-slate-100 text-slate-700 font-mono text-sm">{order.scheduled_time?.slice(0, 5)}</Badge>
                    </div>

                    {/* נתוני זמן ונהג */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 leading-none">נהג משויך</p>
                        <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                          <Truck size={14} className="text-blue-600" /> {order.driver_name}
                        </p>
                      </div>
                      <div className={`p-3 rounded-2xl border transition-all ${order.status === 'unloading' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                        <p className={`text-[9px] font-black uppercase mb-1 leading-none ${order.status === 'unloading' ? 'text-blue-200' : 'text-slate-400'}`}>
                          {order.status === 'unloading' ? 'זמן פריקה LIVE' : 'צפי פריקה'}
                        </p>
                        <p className="text-sm font-black flex items-center gap-2">
                          <Timer size={14} className={order.status === 'unloading' ? 'animate-spin' : ''} /> 
                          {order.status === 'unloading' ? `${getLiveTimer(order.actual_pto_start)} דקות` : `${order.estimated_duration_mins || 45} דק'`}
                        </p>
                      </div>
                    </div>

                    {/* כפתורי הצינור - אחד ליד השני */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => sendToPipe('driver', order)}
                        className="flex-1 h-12 rounded-xl font-bold bg-slate-900 hover:bg-black text-white shadow-lg gap-2"
                      >
                        <Send size={18} /> שלח לו"ז לנהג
                      </Button>
                      
                      <Button 
                        onClick={() => sendToPipe('customer', order)}
                        className="flex-1 h-12 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg gap-2 border-b-4 border-green-700 active:border-b-0 transition-all"
                      >
                        <MessageCircle size={18} /> עדכן לקוח (WA)
                      </Button>
                    </div>
                  </div>

                  {/* טבלת המבורגר להיסטוריה */}
                  <div className="border-t border-slate-100">
                    <button 
                      onClick={() => setHistoryOpen(historyOpen === order.id ? null : order.id)}
                      className="w-full p-3 flex justify-between items-center text-[10px] font-black text-slate-400 hover:bg-slate-50 transition-all"
                    >
                      <span className="flex items-center gap-1"><History size={12} /> היסטוריית פריקות בכתובת זו</span>
                      <ChevronDown size={14} className={`transition-transform ${historyOpen === order.id ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {historyOpen === order.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-200">
                                <th className="p-3 font-bold">תאריך</th>
                                <th className="p-3 font-bold">נהג</th>
                                <th className="p-3 font-bold">זמן פריקה</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-100">
                                <td className="p-3">12/03/2026</td>
                                <td className="p-3">חכמת</td>
                                <td className="p-3 font-black text-blue-600">42 דק'</td>
                              </tr>
                              <tr>
                                <td className="p-3 text-slate-400" colSpan={3}>אין נתונים נוספים להצגה</td>
                              </tr>
                            </tbody>
                          </table>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
