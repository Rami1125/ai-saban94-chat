"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Anchor, Clock, MapPin, Send, History, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DispatchStudio() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchDispatch = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchDispatch(); }, []);

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans pb-24 text-right" dir="rtl">
      <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-900">מרכז שליטה Saban-OS</h1>
          <p className="text-xs text-slate-500 font-bold">ניהול סידור ואיתורן בזמן אמת</p>
        </div>
        <Button onClick={fetchDispatch} variant="ghost" size="icon">
          <RefreshCw size={20} className={loading ? "animate-spin text-blue-500" : "text-slate-400"} />
        </Button>
      </header>

      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className={`border-none shadow-lg overflow-hidden ${order.status === 'unloading' ? 'ring-2 ring-purple-500' : ''}`}>
                <div className={`h-1.5 ${
                  order.status === 'unloading' ? 'bg-purple-500 animate-pulse' : 
                  order.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-slate-800 text-lg">{order.customer_name}</h3>
                    <Badge className="bg-slate-900">{order.scheduled_time?.slice(0, 5)}</Badge>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                    <MapPin size={14} />
                    <span>{order.delivery_address}</span>
                  </div>

                  {/* נתוני זמן מהאיתורן (Live & History) */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                        <History size={12} /> זמן היסטורי בכתובת
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {order.estimated_duration_mins || '--'} דקות
                      </div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-1 text-[10px] text-purple-400 mb-1">
                        <Clock size={12} /> זמן פריקה בפועל
                      </div>
                      <div className="text-sm font-bold text-purple-700">
                        {order.actual_duration_mins ? `${order.actual_duration_mins} דק'` : (order.status === 'unloading' ? 'פורק עכשיו...' : '--')}
                      </div>
                    </div>
                  </div>

                  {/* המלצת המוח (AI Advisor) */}
                  {order.ai_recommendations && (
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-2 items-start mb-4">
                      <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                      <p className="text-xs text-blue-900 leading-tight font-medium">{order.ai_recommendations}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 h-10 text-xs font-bold gap-2">
                      <Send size={14} /> עדכן לקוח ב-WA
                    </Button>
                    <Button variant="outline" className="flex-1 h-10 text-xs font-bold">
                      שינוי נהג
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* כפתור הפצה לערוץ */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <Button className="w-full bg-slate-900 h-14 rounded-2xl shadow-2xl font-black text-white flex gap-3">
          <Send size={20} /> פרסם סידור מלא לערוץ
        </Button>
      </div>
    </div>
  );
}
