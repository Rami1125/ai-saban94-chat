"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Send, Timer, Activity, CheckCircle2, History, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Truck, MapPin, Send, Timer, Activity, 
  CheckCircle2, History, Info, MessageCircle // <--- תוסיף את זה כאן
} from "lucide-react";

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
    // מניעת שגיאת 400 על ידי בדיקת קיום ה-ID
    if (!order?.id) {
      toast.error("מזהה הזמנה לא תקין");
      return;
    }

    try {
      const response = await fetch('/api/dispatch/driver-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      
      if (response.ok) {
        toast.success(`לו"ז נשלח בהצלחה ל${order.driver_name}`);
      } else {
        const errorData = await response.json();
        toast.error(`שגיאה: ${errorData.error || 'נא לבדוק נתוני הזמנה'}`);
      }
    } catch (err) {
      toast.error("חיבור לשרת נכשל");
    }
  };

  const getLiveTimer = (startTime: string) => {
    if (!startTime) return 0;
    return Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
  };

  if (loading && orders.length === 0) return <div className="text-center p-10 font-bold animate-pulse text-slate-400">מתחבר לחמ"ל סבן...</div>;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* לוח מחוונים (Stats) */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-[#0f172a] text-white border-none shadow-xl">
          <CardContent className="p-4 flex flex-col items-center">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 text-center">מנופים בפריקה</span>
            <span className="text-3xl font-black">{orders.filter(o => o.status === 'unloading').length}</span>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-100 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">הזמנות להיום</span>
            <span className="text-3xl font-black text-slate-800">{orders.length}</span>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence mode="popLayout">
        {orders.map((order) => (
          <motion.div key={order.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`overflow-hidden border-none shadow-xl transition-all ${
              order.status === 'unloading' ? 'ring-2 ring-blue-600 bg-blue-50/20' : 'bg-white'
            }`}>
              <div className={`h-1 w-full ${
                order.status === 'unloading' ? 'bg-blue-600 animate-pulse' : 
                order.status === 'completed' ? 'bg-green-500' : 'bg-slate-100'
              }`} />
              
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl text-slate-900 tracking-tighter">{order.customer_name}</h3>
                      {order.status === 'completed' && <CheckCircle2 size={18} className="text-green-500" />}
                    </div>
                    <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-medium">
                      <MapPin size={14} className="text-blue-600"/> {order.delivery_address}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 font-mono text-xs px-2 py-1 border-slate-200">
                    {order.scheduled_time?.slice(0, 5)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                      <Truck size={18}/>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">נהג</p>
                      <p className="text-sm font-black text-slate-700">{order.driver_name}</p>
                    </div>
                  </div>
                  
                  {order.status === 'unloading' ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-xl text-white animate-pulse">
                        <Timer size={18}/>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-blue-600 font-bold uppercase">פריקה LIVE</p>
                        <p className="text-sm font-black text-blue-700">{getLiveTimer(order.actual_pto_start)} דקות</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 opacity-50">
                      <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
                        <History size={18}/>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">היסטוריה</p>
                        <p className="text-sm font-black text-slate-600">{order.estimated_duration_mins || '45'} דק'</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleSendBrief(order)}
                    disabled={order.status === 'completed'}
                    className={`flex-1 h-12 rounded-xl font-bold text-base shadow-lg transition-all active:scale-95 ${
                      order.status === 'pending' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {order.status === 'unloading' ? (
                      <span className="flex items-center gap-2"><Activity size={20} className="animate-spin" /> פריקה פעילה...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Send size={20} /> שלח לו"ז לחכמת</span>
                    )}
                  </Button>
                  <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200 text-slate-300">
                    <Info size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
             <Button 
  size="sm" 
  variant="outline" 
  className="flex-1 border-green-500 text-green-600 hover:bg-green-50 gap-2 font-bold"
  onClick={() => {
    fetch('/api/dispatch/customer-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id })
    }).then(() => toast.success("הודעה נשלחה לבר אורן!"));
  }}
>
  <MessageCircle size={16} />
  עדכן לקוח
</Button>
      </AnimatePresence>
 
      {orders.length === 0 && (
        <Card className="p-16 text-center border-dashed border-2 bg-slate-50/50">
          <p className="text-slate-400 font-bold">אין הזמנות להיום בחמ"ל</p>
        </Card>
      )}
    </div>
  );
}
