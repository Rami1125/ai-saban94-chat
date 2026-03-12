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
  const [metrics, setMetrics] = useState({ active: 0, done: 0 });
  const supabase = getSupabase();

  const fetchDispatch = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });
    
    if (data) {
      setOrders(data);
      setMetrics({
        active: data.filter(o => o.status === 'unloading').length,
        done: data.filter(o => o.status === 'completed').length
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDispatch();
    const channel = supabase.channel('dispatch_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_orders' }, () => fetchDispatch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDispatch, supabase]);

  const sendDriverBrief = async (driverName: string) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch('/api/dispatch/driver-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverName, date: today })
    });
    if (res.ok) toast.success(`סידור נשלח ל-${driverName}`);
  };

  const getLiveTimer = (startTime: string) => {
    if (!startTime) return 0;
    return Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* שעוני בקרה עליונים */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-900 text-white p-4 text-center border-none shadow-xl">
          <div className="text-[10px] text-blue-400 font-bold uppercase">בפריקה חיה</div>
          <div className="text-3xl font-black">{metrics.active}</div>
        </Card>
        <Card className="bg-white p-4 text-center border-none shadow-md">
          <div className="text-[10px] text-slate-500 font-bold uppercase">הובלות שבוצעו</div>
          <div className="text-3xl font-black text-green-600">{metrics.done}</div>
        </Card>
        <Card className="bg-white p-4 text-center border-none shadow-md flex flex-col items-center justify-center">
          <Activity size={20} className="text-purple-500 animate-pulse mb-1" />
          <div className="text-[10px] text-purple-600 font-bold">ONLINE SYNC</div>
        </Card>
      </div>

      {/* רשימת הזמנות */}
      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className={`overflow-hidden border-none shadow-lg ${order.status === 'unloading' ? 'ring-2 ring-purple-500 bg-purple-50/20' : ''}`}>
                <div className={`h-1.5 ${order.status === 'unloading' ? 'bg-purple-500 animate-pulse' : order.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                        {order.customer_name}
                        {order.status === 'completed' && <CheckCircle2 size={18} className="text-green-500" />}
                      </h3>
                      <p className="text-slate-500 text-sm flex items-center gap-1"><MapPin size={14}/> {order.delivery_address}</p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-700 font-mono">{order.scheduled_time?.slice(0, 5)}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-1">זמן היסטורי</span>
                      <span className="font-bold text-slate-700">{order.estimated_duration_mins || 45} דק'</span>
                    </div>
                    <div className={`${order.status === 'unloading' ? 'bg-purple-100' : 'bg-slate-50'} p-3 rounded-xl border transition-colors`}>
                      <span className="text-[10px] text-purple-600 block mb-1">זמן נוכחי (LIVE)</span>
                      <span className={`font-bold ${order.status === 'unloading' ? 'text-purple-700' : 'text-slate-400'}`}>
                        {order.status === 'unloading' ? `${getLiveTimer(order.actual_pto_start)} דק'` : (order.actual_duration_mins ? `${order.actual_duration_mins} דק'` : '--')}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => sendDriverBrief(order.driver_name)}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold h-12 gap-2"
                  >
                    <Send size={18} /> שלח לו"ז ל{order.driver_name}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
