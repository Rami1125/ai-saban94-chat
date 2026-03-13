"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Send, Timer, Activity, CheckCircle2, History, AlertCircle } from "lucide-react";
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
      toast.error("שגיאה במשיכת נתונים");
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
    if (!order.id) {
      toast.error("מזהה הזמנה חסר");
      return;
    }

    try {
      const response = await fetch('/api/dispatch/driver-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // וודא שהשם של השדה תואם למה שה-API מצפה (orderId)
        body: JSON.stringify({ orderId: order.id })
      });
      
      if (response.ok) {
        toast.success(`לו"ז נשלח לחכמת: ${order.customer_name}`);
      } else {
        const errData = await response.json();
        toast.error(`שגיאה 400: ${errData.error || 'נתונים לא תקינים'}`);
      }
    } catch (err) {
      toast.error("חיבור לשרת ה-API נכשל");
    }
  };

  const getLiveTimer = (startTime: string) => {
    if (!startTime) return 0;
    return Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
  };

  if (loading && orders.length === 0) return <div className="text-center p-10 font-bold animate-pulse">טוען חמ"ל סבן...</div>;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* לוח מחוונים עליון - metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-900 text-white border-none shadow-lg">
          <CardContent className="p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">מנופים פעילים</span>
            <span className="text-2xl font-black text-blue-400">{orders.filter(o => o.status === 'unloading').length}</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-md">
          <CardContent className="p-4 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">הזמנות להיום</span>
            <span className="text-2xl font-black text-slate-800">{orders.length}</span>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence mode="popLayout">
        {orders.map((order) => (
          <motion.div 
            key={order.id} 
            layout 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className={`overflow-hidden border-none shadow-xl transition-all ${
              order.status === 'unloading' ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'bg-white'
            }`}>
              <div className={`h-1.5 w-full ${
                order.status === 'unloading' ? 'bg-blue-500 animate-pulse' : 
                order.status === 'completed' ? 'bg-green-500' : 'bg-slate-200'
              }`} />
              
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl text-slate-900 tracking-tight">{order.customer_name}</h3>
                      {order.status === 'completed' && <CheckCircle2 size={18} className="text-green-500" />}
                    </div>
                    <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                      <MapPin size={14} className="text-blue-500"/> {order.delivery_address}
                    </p>
                  </div>
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-sm font-mono px-3 py-1">
                    {order.scheduled_time?.slice(0, 5)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <Truck size={16}/>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">נהג</p>
                      <p className="text-sm font-black text-slate-700">{order.driver_name || 'לא שובץ'}</p>
                    </div>
                  </div>
                  
                  {order.status === 'unloading' ? (
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 p-2 rounded-lg text-white animate-pulse">
                        <Timer size={16}/>
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">זמן פריקה LIVE</p>
                        <p className="text-sm font-black text-blue-700">{getLiveTimer(order.actual_pto_start)} דקות</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 opacity-60">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                        <History size={16}/>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">צפי פריקה</p>
                        <p className="text-sm font-black text-slate-700">{order.estimated_duration_mins || '45'} דק'</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleSendBrief(order)}
                    disabled={order.status === 'completed'}
                    className={`flex-1 font-bold h-12 rounded-xl shadow-md transition-all ${
                      order.status === 'pending' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {order.status === 'unloading' ? (
                      <span className="flex items-center gap-2"><Activity size={18} className="animate-spin" /> פריקה בעיצומה...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send size={18} /> שלח לו"ז לנהג</span>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200 text-slate-400">
                    <AlertCircle size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {orders.length === 0 && (
        <Card className="p-16 text-center border-dashed border-4 border-slate-200 bg-white/50 rounded-3xl">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Truck size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800">אין סידור עבודה להיום</h3>
          <p className="text-slate-500">הכנס הזמנה חדשה בטאב שליד כדי להתחיל</p>
        </Card>
      )}
    </div>
  );
}
