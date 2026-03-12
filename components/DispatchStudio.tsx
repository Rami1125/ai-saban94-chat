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
      setLiveMetrics({
        activeCranes: data.filter(o => o.status === 'unloading').length,
        sentCount: data.filter(o => o.status === 'completed').length
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
    toast.loading(`שולח סידור ל${driverName}...`);
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch('/api/dispatch/driver-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverName, date: today })
      });
      if (res.ok) toast.success(`הסידור נשלח ל-${driverName}`);
    } catch (e) {
      toast.error("שגיאה בשליחה");
    }
  };

  const getLiveTimer = (startTime: string) => {
    if (!startTime) return 0;
    const diff = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="p-2 md:p-4 bg-slate-50 min-h-screen text-right" dir="rtl">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-slate-900 text-white border-none shadow-lg p-3 text-center font-black">
          <div className="text-[10px] opacity-60 uppercase">מנופים בפריקה</div>
          <div className="text-2xl text-blue-400">{liveMetrics.activeCranes}</div>
        </Card>
        <Card className="bg-white p-3 text-center font-black shadow-sm border-none">
          <div className="text-[10px] text-slate-500 uppercase">הובלות שבוצעו</div>
          <div className="text-2xl text-green-600">{liveMetrics.sentCount}</div>
        </Card>
        <Card className="bg-white p-3 text-center font-black shadow-sm border-none">
          <Activity size={16} className="mx-auto mb-1 text-purple-500 animate-pulse" />
          <div className="text-[10px] text-purple-600">LIVE SYNC</div>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className={`border-none shadow-md overflow-hidden ${order.status === 'unloading' ? 'ring-2 ring-purple-500' : ''}`}>
                <div className={`h-1.5 ${
                  order.status === 'unloading' ? 'bg-purple-500 animate-pulse' : 
                  order.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">{order.customer_name}</h3>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                        <MapPin size={12} /> {order.delivery_address}
                      </div>
                    </div>
                    <Badge className="bg-slate-100 text-slate-600 border-none">{order.scheduled_time?.slice(0, 5)}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border">
                      <div className="text-slate-400 mb-1 flex items-center justify-center gap-1"><History size={10}/> היסטוריה</div>
                      <div className="font-bold text-slate-700">{order.estimated_duration_mins || '45'} דק'</div>
                    </div>
                    <div className={`${order.status === 'unloading' ? 'bg-purple-50 border-purple-200' : 'bg-slate-50'} p-2 rounded-lg border`}>
                      <div className="text-slate-400 mb-1 flex items-center justify-center gap-1"><Timer size={10}/> בפועל (LIVE)</div>
                      <div className={`font-bold ${order.status === 'unloading' ? 'text-purple-600' : 'text-slate-700'}`}>
                        {order.status === 'unloading' ? `${getLiveTimer(order.actual_pto_start)} דק'` : (order.actual_duration_mins ? `${order.actual_duration_mins} דק'` : '--')}
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => sendDriverBrief(order.driver_name)}
                    className="w-full bg-slate-900 hover:bg-black font-bold gap-2 h-11"
                  >
                    <Send size={16} /> שלח לו"ז ל{order.driver_name}
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
