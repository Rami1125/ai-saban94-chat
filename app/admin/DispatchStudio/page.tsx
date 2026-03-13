"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Send, Timer, Activity, CheckCircle2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function DispatchStudio() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchDispatch = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
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

  const handleSendBrief = async (order: any) => {
    try {
      const response = await fetch('/api/dispatch/driver-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      
      if (response.ok) {
        toast.success(`לו"ז נשלח בהצלחה ל${order.driver_name}`);
      } else {
        toast.error("שגיאה בשליחת הלו"ז");
      }
    } catch (err) {
      toast.error("חיבור לשרת נכשל");
    }
  };

  const getLiveTimer = (startTime: string) => {
    if (!startTime) return 0;
    return Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
  };

  if (loading && orders.length === 0) return <div className="text-center p-10 font-bold">טוען סידור עבודה...</div>;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <AnimatePresence>
        {orders.map((order) => (
          <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className={`overflow-hidden border-none shadow-md ${order.status === 'unloading' ? 'ring-2 ring-purple-500 bg-purple-50/30' : 'bg-white'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg text-slate-800">{order.customer_name}</h3>
                      {order.status === 'completed' && <CheckCircle2 size={16} className="text-green-500" />}
                    </div>
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <MapPin size={12}/> {order.delivery_address}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-mono">{order.scheduled_time?.slice(0, 5)}</Badge>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-bold text-slate-600 border-t pt-3">
                  <span className="flex items-center gap-1"><Truck size={14} className="text-blue-500"/> {order.driver_name}</span>
                  {order.status === 'unloading' && (
                    <span className="text-purple-600 animate-pulse flex items-center gap-1 bg-purple-100 px-2 py-0.5 rounded-full">
                      <Timer size={14}/> פורק כבר {getLiveTimer(order.actual_pto_start)} דק'
                    </span>
                  )}
                  {order.estimated_duration_mins && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <History size={14}/> היסטוריה: {order.estimated_duration_mins} דק'
                    </span>
                  )}
                </div>

                {/* כאן התיקון לכפתורים - עכשיו הם עטופים נכון ולחיצים */}
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    className="flex-1 font-bold gap-2"
                    variant={order.status === 'pending' ? 'default' : 'outline'}
                    disabled={order.status === 'completed'}
                    onClick={() => handleSendBrief(order)}
                  >
                    {order.status === 'unloading' ? (
                      <><Activity size={14} className="animate-pulse" /> פריקה פעילה</>
                    ) : (
                      <><Send size={14} /> שלח לו"ז לנהג</>
                    )}
                  </Button>
                  
                  <Button size="sm" variant="ghost" className="gap-1 text-slate-400 hover:text-slate-600">
                    <Info size={14} /> פרטים
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {orders.length === 0 && (
        <Card className="p-10 text-center border-dashed border-2 bg-slate-50/50">
          <p className="text-slate-400 font-bold">אין הזמנות להיום במערכת</p>
        </Card>
      )}
    </div>
  );
}
