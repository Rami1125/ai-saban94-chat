"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Clock, MapPin, Send, History, 
  AlertCircle, RefreshCw, MessageSquare, 
  CheckCircle2, Timer, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function DispatchStudio() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState({ sentCount: 0, activeCranes: 0 });
  const supabase = getSupabase();

  // שליפת נתונים וחישוב מטרקיקות בזמן אמת
  const fetchDispatch = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });
    
    if (data) {
      setOrders(data);
      const active = data.filter(o => o.status === 'unloading').length;
      const completed = data.filter(o => o.status === 'completed').length;
      setLiveMetrics({ activeCranes: active, sentCount: completed });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDispatch();
    // Realtime Listener - עדכון אוטומטי כשהאיתורן מעדכן את ה-DB
    const channel = supabase.channel('dispatch_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_orders' }, () => fetchDispatch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDispatch, supabase]);

  // שליחת סידור בוקר לנהג
  const sendDriverBrief = async (driverName: string) => {
    toast.loading(`מג'נרט סידור עבודה ל${driverName}...`);
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch('/api/dispatch/driver-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverName, date: today })
      });
      if (res.ok) toast.success(`הסידור נשלח ל-${driverName} בווטסאפ!`);
    } catch (e) {
      toast.error("שגיאה בשליחה");
    }
  };

  // פונקציית עזר לחישוב טיימר פריקה חי
  const getLiveTimer = (startTime: string) => {
    if (!startTime) return null;
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000);
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans pb-32 text-right" dir="rtl">
      {/* Dashboard Header - לוח מחוונים */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-slate-900 text-white border-none shadow-lg">
          <CardContent className="p-3 flex flex-col items-center">
            <Activity size={18} className="text-blue-400 mb-1" />
            <span className="text-[10px] opacity-70">מנופים פעילים</span>
            <span className="text-xl font-black">{liveMetrics.activeCranes}</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-3 flex flex-col items-center text-slate-900">
            <MessageSquare size={18} className="text-green-500 mb-1" />
            <span className="text-[10px] text-slate-500">הודעות שנשלחו</span>
            <span className="text-xl font-black">{liveMetrics.sentCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-3 flex flex-col items-center text-slate-900">
            <Timer size={18} className="text-purple-500 mb-1" />
            <span className="text-[10px] text-slate-500">סטטוס סידור</span>
            <span className="text-xs font-black text-purple-600">LIVE</span>
          </CardContent>
        </Card>
      </div>

      <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-900">סידור חכם - ח. סבן</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Real-Time Logistics Engine</p>
        </div>
        <Button onClick={fetchDispatch} variant="ghost" size="icon" className="rounded-full">
          <RefreshCw size={20} className={loading ? "animate-spin text-blue-500" : "text-slate-400"} />
        </Button>
      </header>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`border-none shadow-md overflow-hidden transition-all ${
                order.status === 'unloading' ? 'ring-2 ring-purple-500 bg-purple-50/30' : ''
              }`}>
                <div className={`h-1.5 ${
                  order.status === 'unloading' ? 'bg-purple-500 animate-pulse' : 
                  order.status === 'completed' ? 'bg-green-500' : 
                  order.status === 'in_transit' ? 'bg-blue-500' : 'bg-slate-200'
                }`} />
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                        {order.customer_name}
                        {order.status === 'completed' && <CheckCircle2 size={16} className="text-green-500" />}
                      </h3>
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <MapPin size={12} />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-slate-200 font-mono">{order.scheduled_time?.slice(0, 5)}</Badge>
                  </div>

                  {/* טיימר פריקה חי + היסטוריה */}
                  <div className="grid grid-cols-2 gap-2 my-4">
                    <div className="bg-slate-100/50 p-2 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-1 uppercase font-bold">
                        <History size={10} /> היסטוריית פריקה
                      </div>
                      <div className="text-sm font-black text-slate-700">
                        {order.estimated_duration_mins || '--'} דקות
                      </div>
                    </div>
                    
                    <div className={`${order.status === 'unloading' ? 'bg-purple-100 border-purple-200' : 'bg-slate-50 border-slate-100'} p-2 rounded-xl border transition-colors`}>
                      <div className="flex items-center gap-1 text-[9px] text-purple-600 mb-1 uppercase font-bold">
                        <Timer size={10} /> זמן נוכחי (LIVE)
                      </div>
                      <div className={`text-sm font-black ${order.status === 'unloading' ? 'text-purple-700' : 'text-slate-400'}`}>
                        {order.status === 'unloading' ? `${getLiveTimer(order.actual_pto_start)} דק'` : (order.actual_duration_mins ? `${order.actual_duration_mins} דק'` : '--')}
                      </div>
                    </div>
                  </div>

                  {/* AI Advisor - תובנות מהאיתורן */}
                  {order.ai_recommendations && (
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-2 items-start mb-4">
                      <AlertCircle size={14} className="text-blue-600 mt-0.5" />
                      <p className="text-[11px] text-blue-900 leading-tight font-bold italic">{order.ai_recommendations}</p>
                    </div>
                  )}

                  {/* כפתורי פעולה */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => sendDriverBrief(order.driver_name)}
                      className="flex-1 bg-slate-900 hover:bg-black h-10 text-xs font-bold gap-2 rounded-xl shadow-lg shadow-slate-200"
                    >
                      <Send size={14} /> שלח לו"ז ל{order.driver_name}
                    </Button>
                    <Button variant="outline" className="h-10 text-xs font-bold px-3 rounded-xl border-slate-200 text-slate-600">
                      פרטים
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Global Action */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl shadow-2xl font-black text-white flex gap-3 transform active:scale-95 transition-transform">
          <MessageSquare size={20} />
          פרסם סידור מלא לערוץ JONI
        </Button>
      </div>
    </div>
  );
}
