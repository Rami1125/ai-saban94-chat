"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Send, History, RefreshCw, Timer, Activity, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function DispatchStudio() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchDispatch = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    // שימוש ב-* פותר את שגיאת ה-400
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });
    
    if (error) {
      console.error("Supabase Error:", error.message);
    } else {
      setOrders(data || []);
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

  const getLiveTimer = (startTime: string) => {
    if (!startTime) return 0;
    return Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
  };

  if (loading && orders.length === 0) return <div className="text-center p-10 font-bold">טוען סידור עבודה...</div>;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {orders.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-2">
          <p className="text-slate-400">אין הזמנות להיום. הגיע הזמן להוסיף אחת!</p>
        </Card>
      ) : (
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className={`overflow-hidden border-none shadow-md ${order.status === 'unloading' ? 'ring-2 ring-purple-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-lg flex items-center gap-2">
                        {order.customer_name}
                        {order.status === 'completed' && <CheckCircle2 size={16} className="text-green-500" />}
                      </h3>
                      <p className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={12}/> {order.delivery_address}</p>
                    </div>
                    <Badge variant="outline">{order.scheduled_time?.slice(0, 5)}</Badge>
                  </div>
                  
                  <div className="flex gap-4 mt-4 text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1"><Truck size={12}/> {order.driver_name}</span>
                    {order.status === 'unloading' && (
                      <span className="text-purple-600 animate-pulse flex items-center gap-1">
                        <Timer size={12}/> פורק כבר {getLiveTimer(order.actual_pto_start)} דק'
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
