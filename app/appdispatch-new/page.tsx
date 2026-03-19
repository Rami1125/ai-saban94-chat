"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // חיובי!
import { 
  Truck, Bell, Clock, Plus, Share2, FileText, Trash2
} from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB' }
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function AppDispatchNew() {
  const [requests, setRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    fetchInitialData();
    const channel = supabase.channel('dispatch_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saban_requests' }, payload => {
        setRequests(prev => [payload.new, ...prev]);
        if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
        toast.info(`בקשה חדשה מאיציק!`, { icon: <Bell className="text-orange-500" /> });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInitialData = async () => {
    const { data: reqs } = await supabase.from('saban_requests').select('*').eq('status', 'pending');
    const { data: ords } = await supabase.from('saban_orders').select('*');
    setRequests(reqs || []);
    setOrders(ords || []);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="bg-white p-4 border-b sticky top-0 z-30 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-black text-[#0B2C63] italic">SabanOS Dispatch</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold h-10 border-slate-200 text-slate-700"><FileText size={18} className="ml-2"/> דוח בוקר</Button>
          <Button className="bg-[#25D366] hover:bg-[#128C7E] rounded-xl font-bold h-10 text-white"><Share2 size={18} className="ml-2"/> שיתוף</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
        
        {/* לוח בקשות צדדי */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
               <Bell className="text-orange-500" size={20}/> בקשות חמות
            </h2>
            <Badge className="bg-orange-500 text-white">{requests.length}</Badge>
          </div>
          <div className="space-y-3">
            {requests.map(req => (
              <Card key={req.id} className="p-4 rounded-3xl border-none shadow-md bg-white border-r-8 border-orange-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-slate-800 text-sm">{req.customer_name}</span>
                  <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1"><Clock size={12}/> {new Date(req.created_at).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-xs text-slate-400 font-bold mb-3">{req.request_type} #{req.doc_number}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="bg-[#0B2C63] text-white rounded-xl font-bold h-8 text-[11px]">חכמת</Button>
                  <Button size="sm" className="bg-blue-600 text-white rounded-xl font-bold h-8 text-[11px]">עלי</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* לוח שעות ראשי */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {drivers.map(driver => (
              <div key={driver.name} className="flex-shrink-0 text-center">
                <div className="w-16 h-16 rounded-2xl border-2 p-1 shadow-sm mb-1" style={{ borderColor: driver.color }}>
                  <img src={driver.img} className="w-full h-full rounded-xl object-cover" alt={driver.name} />
                </div>
                <span className="font-black text-[10px]">{driver.name}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {timeSlots.map(time => (
              <div key={time} className="flex gap-4 items-center group">
                <div className="w-12 text-xs font-black text-slate-400">{time}</div>
                <div className="flex-1 min-h-[50px] p-2 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:border-blue-200 transition-all flex items-center gap-2">
                    {orders.filter(o => o.delivery_time === time).map((o, idx) => (
                        <Badge key={idx} className="bg-blue-50 text-blue-700 border-none font-bold text-xs px-3 h-8">
                            {o.customer_name} | {o.driver_name}
                        </Badge>
                    ))}
                    <Plus size={14} className="text-slate-200 opacity-0 group-hover:opacity-100 cursor-pointer ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
