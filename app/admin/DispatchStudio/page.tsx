"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Anchor, 
  Clock, 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Share2,
  Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DispatchStudio() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const supabase = getSupabase();

  // שליפת סידור העבודה להיום
  const fetchDispatch = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchDispatch(); }, []);

  // עדכון סטטוס ב-DB
  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('dispatch_orders')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    }
    setUpdatingId(null);
  };

  // שליחת הודעה ל-JONI (לקוח או ערוץ)
  const handleNotify = async (order: any, type: "CLIENT_UPDATE" | "CHANNEL_POST") => {
    try {
      const response = await fetch('/api/dispatch/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: order.status, type })
      });
      
      if (response.ok) {
        alert(type === "CLIENT_UPDATE" ? "הודעה נשלחה ללקוח" : "עדכון פורסם בערוץ");
      } else {
        alert("שגיאה בשליחת ההודעה");
      }
    } catch (err) {
      console.error("Notify error:", err);
    }
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans pb-24" dir="rtl">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="text-blue-600" />
            סידור עבודה חכם - ח. סבן
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button onClick={fetchDispatch} variant="ghost" size="icon" className="rounded-full">
          <RefreshCw size={20} className={loading ? "animate-spin text-blue-500" : "text-slate-400"} />
        </Button>
      </header>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {orders.length > 0 ? orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`overflow-hidden border-none shadow-md transition-all ${
                order.status === 'unloading' ? 'ring-2 ring-purple-500' : ''
              }`}>
                <CardContent className="p-0">
                  {/* Status Bar */}
                  <div className={`h-1.5 w-full ${
                    order.status === 'loaded' ? 'bg-blue-500' : 
                    order.status === 'in_transit' ? 'bg-yellow-500' :
                    order.status === 'unloading' ? 'bg-purple-500 animate-pulse' :
                    order.status === 'completed' ? 'bg-green-500' : 'bg-slate-200'
                  }`} />

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{order.customer_name}</h3>
                          {order.status === 'completed' && <CheckCircle2 size={16} className="text-green-500" />}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <MapPin size={12} />
                          <span>{order.delivery_address}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-mono">
                        {order.scheduled_time?.slice(0, 5)}
                      </Badge>
                    </div>

                    {/* Logistic Details */}
                    <div className="flex gap-4 mb-4 text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                        <Truck size={14} />
                        {order.driver_name || "ללא נהג"}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                        <Anchor size={14} />
                        {order.truck_type === 'crane' ? 'מנוף' : 'פריקה ידנית'}
                      </div>
                    </div>

                    {/* AI Insights (From PTO History) */}
                    {order.ai_recommendations && (
                      <div className="mb-4 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                        <div className="bg-blue-500 p-0.5 rounded text-white mt-0.5">
                          <AlertCircle size={10} />
                        </div>
                        <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
                          <span className="font-bold">תובנת AI:</span> {order.ai_recommendations}
                        </p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-4 gap-2 border-t pt-4">
                      <Button 
                        variant={order.status === 'loaded' ? 'default' : 'outline'}
                        className="text-[10px] h-8 bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-500 hover:text-white"
                        onClick={() => updateStatus(order.id, 'loaded')}
                      >
                        הועמס
                      </Button>
                      <Button 
                        variant={order.status === 'in_transit' ? 'default' : 'outline'}
                        className="text-[10px] h-8 bg-yellow-50 border-yellow-100 text-yellow-700 hover:bg-yellow-500 hover:text-white"
                        onClick={() => updateStatus(order.id, 'in_transit')}
                      >
                        בדרך
                      </Button>
                      <Button 
                        className="text-[10px] h-8 bg-green-600 text-white hover:bg-green-700"
                        onClick={() => handleNotify(order, 'CLIENT_UPDATE')}
                      >
                        <Phone size={12} className="ml-1" />
                        לקוח
                      </Button>
                      <Button 
                        variant="outline"
                        className="text-[10px] h-8 border-slate-200 text-slate-600"
                        onClick={() => handleNotify(order, 'CHANNEL_POST')}
                      >
                        <Share2 size={12} className="ml-1" />
                        ערוץ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )) : (
            <div className="text-center py-20 text-slate-400">
              <Truck size={48} className="mx-auto mb-4 opacity-20" />
              <p>אין הזמנות משובצות להיום</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button - פרסום סידור בוקר */}
      <div className="fixed bottom-6 left-6 right-6 flex gap-3 z-50">
        <Button 
          className="w-full bg-slate-900 hover:bg-black text-white shadow-2xl font-bold h-12 rounded-2xl flex gap-2"
          onClick={() => alert("מג'נרט פוסט סידור בוקר...")}
        >
          <Send size={18} />
          פרסם סידור מלא לערוץ
        </Button>
      </div>
    </div>
  );
}
