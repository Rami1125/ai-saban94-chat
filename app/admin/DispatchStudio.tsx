"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Anchor, Clock, MapPin, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DispatchStudio() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchDispatch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_time', { ascending: true });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchDispatch(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('dispatch_orders').update({ status: newStatus }).eq('id', id);
    fetchDispatch();
    // כאן בהמשך נזריק את השליחה האוטומטית ל-JONI
  };

  return (
    <div className="p-4 bg-[#f8fafc] min-h-screen font-sans pb-20" dir="rtl">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">סידור עבודה חכם</h1>
          <p className="text-sm text-slate-500">ח. סבן 1994 | {new Date().toLocaleDateString('he-IL')}</p>
        </div>
        <Button onClick={fetchDispatch} variant="outline" size="icon">
          <Clock size={18} className={loading ? "animate-spin" : ""} />
        </Button>
      </header>

      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={`border-r-4 shadow-sm ${
                order.status === 'loaded' ? 'border-r-blue-500' : 
                order.status === 'in_transit' ? 'border-r-yellow-500' :
                order.status === 'unloading' ? 'border-r-purple-500 bg-purple-50/30' :
                'border-r-slate-200'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{order.customer_name}</h3>
                      <div className="flex items-center gap-1 text-slate-500 text-sm">
                        <MapPin size={14} />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono">{order.scheduled_time?.slice(0, 5)}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg">
                      <Truck size={16} className="text-slate-600" />
                      <span className="text-xs font-bold">{order.driver_name || "טרם שובץ"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg">
                      <Anchor size={16} className="text-slate-600" />
                      <span className="text-xs font-bold">{order.truck_type === 'crane' ? 'מנוף' : 'פריקה ידנית'}</span>
                    </div>
                  </div>

                  {/* המלצת גימני AI */}
                  {order.ai_recommendations && (
                    <div className="mb-4 bg-blue-50 p-2 rounded-md border border-blue-100 flex items-start gap-2">
                      <AlertCircle size={14} className="text-blue-600 mt-0.5" />
                      <p className="text-[11px] text-blue-800 leading-tight">{order.ai_recommendations}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant={order.status === 'loaded' ? 'default' : 'outline'}
                      className="flex-1 text-xs h-9"
                      onClick={() => updateStatus(order.id, 'loaded')}
                    >
                      הועמס
                    </Button>
                    <Button 
                      variant={order.status === 'in_transit' ? 'default' : 'outline'}
                      className="flex-1 text-xs h-9"
                      onClick={() => updateStatus(order.id, 'in_transit')}
                    >
                      בדרך
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="bg-green-50 text-green-700 hover:bg-green-100 text-xs h-9"
                    >
                      <Send size={14} className="ml-1" />
                      עדכן לקוח
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Action Button לפרסום לערוץ */}
      <div className="fixed bottom-6 left-6 right-6 flex gap-3">
        <Button className="flex-1 bg-green-600 hover:bg-green-700 shadow-xl font-bold h-12">
          פרסם סידור לערוץ
        </Button>
      </div>
    </div>
  );
}
