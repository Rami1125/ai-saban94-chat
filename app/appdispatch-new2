"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Calendar, Clock, Warehouse, MapPin, Share2, Bot, UserCheck, HardHat, AlertCircle, Bell
} from "lucide-react";
import { toast, Toaster } from "sonner";

// נתוני נהגים
const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' }
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function AppDispatchNew() {
  const [orders, setOrders] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  // טעינת נתונים והאזנה לזמן אמת
  useEffect(() => {
    fetchInitialData();

    // האזנה לבקשות חדשות (מלשינון/לוח בקשות)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saban_requests' }, payload => {
        toast.info(`בקשה חדשה מ${payload.new.requester_name}!`, {
            icon: <Bell className="text-blue-500" />
        });
        setIncomingRequests(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInitialData = async () => {
    const { data: activeOrders } = await supabase.from('saban_orders').select('*').order('delivery_time');
    const { data: pendingReqs } = await supabase.from('saban_requests').select('*').eq('status', 'PENDING').order('created_at', { ascending: false });
    
    setOrders(activeOrders || []);
    setIncomingRequests(pendingReqs || []);
    setLoading(false);
  };

  const approveRequest = async (req: any) => {
    // הפיכת בקשה להזמנה בסידור
    const newOrder = {
      driver_name: 'עלי', // ברירת מחדל לשיבוץ מהיר
      customer_name: `בקשה: ${req.request_type}`,
      delivery_time: req.preferred_time || '08:00',
      warehouse_source: req.from_branch || 'התלמיד',
      delivery_type: 'משאית 🚛',
      status: 'scheduled'
    };

    const { data, error } = await supabase.from('saban_orders').insert([newOrder]).select();
    
    if (!error) {
      await supabase.from('saban_requests').update({ status: 'APPROVED', handled_at: new Date() }).eq('id', req.id);
      setOrders([...orders, data[0]]);
      setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
      toast.success("הבקשה אושרה ושובצה בסידור");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20" dir="rtl">
      <Toaster position="top-center" expand={true} richColors />
      
      {/* Header */}
      <div className="bg-white p-4 border-b sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <h1 className="text-2xl font-black text-[#0B2C63] flex items-center gap-2">
            <Truck /> סטודיו הפצה 2.0
          </h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
            {orders.length} משלוחים פעילים
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* עמודה ימנית: לוח בקשות ומלשינון */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-bold text-slate-500 flex items-center gap-2 px-1">
            <AlertCircle size={18} /> בקשות מהשטח (איציק/שלוחות)
          </h2>
          {incomingRequests.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 text-slate-400 rounded-3xl">
              אין בקשות ממתינות
            </Card>
          ) : (
            incomingRequests.map(req => (
              <Card key={req.id} className={`p-4 rounded-2xl border-r-4 shadow-sm transition-all hover:shadow-md ${req.is_urgent ? 'border-r-red-500 bg-red-50' : 'border-r-blue-500 bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-slate-800">{req.requester_name}</span>
                  {req.is_urgent && <Badge className="bg-red-500 animate-pulse">דחוף!</Badge>}
                </div>
                <div className="text-sm text-slate-600 mb-3">
                  <p className="font-bold">{req.request_type} - מסמך {req.doc_number}</p>
                  <p className="text-xs opacity-70">מקור: {req.from_branch} | שעה: {req.preferred_time}</p>
                </div>
                <Button onClick={() => approveRequest(req)} size="sm" className="w-full bg-[#0B2C63] rounded-xl font-bold">
                  אשר ושבץ בסידור
                </Button>
              </Card>
            ))
          )}
        </div>

        {/* עמודה מרכזית: לוח סידור יומי */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {drivers.map(driver => (
              <div key={driver.name} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl border-2 p-0.5" style={{ borderColor: driver.color }}>
                  <img src={driver.img} className="w-full h-full rounded-[14px] object-cover" alt={driver.name} />
                </div>
                <span className="font-black text-xs">{driver.name}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-slate-500 flex items-center gap-2 px-1">
              <Calendar size={18} /> סדר נסיעות יומי
            </h2>
            
            {timeSlots.map(time => {
              const timeOrders = orders.filter(o => o.delivery_time === time);
              return (
                <div key={time} className="flex gap-4 group">
                  <div className="w-12 pt-2 text-xs font-bold text-slate-400">{time}</div>
                  <div className="flex-1 min-h-[60px] p-2 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 group-hover:border-blue-200 transition-colors flex flex-wrap gap-2">
                    {timeOrders.map((order, idx) => (
                      <Card key={idx} className="flex-1 min-w-[200px] p-3 rounded-xl border-none shadow-sm bg-white border-l-4 border-l-blue-600 flex items-center justify-between">
                        <div>
                          <div className="font-black text-sm">{order.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Warehouse size={10}/> {order.warehouse_source} | <Truck size={10}/> {order.driver_name}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </Button>
                      </Card>
                    ))}
                    {timeOrders.length === 0 && (
                      <button className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-full text-blue-500 text-xs font-bold transition-opacity">
                        <Plus size={14} /> הוסף משלוח
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <Button className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-[#0B2C63] shadow-2xl z-20 p-0">
        <Plus size={28} />
      </Button>
    </div>
  );
}
