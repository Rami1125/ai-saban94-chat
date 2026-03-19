"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Calendar, Clock, Warehouse, MapPin, Share2, Bot, UserCheck, HardHat, FileText, Bell
} from "lucide-react";
import { toast, Toaster } from "sonner";

// נתוני נהגים לפי הקובץ הקיים
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
  const [requests, setRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    fetchInitialData();
    // האזנה בזמן אמת לבקשות חדשות (מלשינון)
    const channel = supabase.channel('dispatch_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saban_requests' }, payload => {
        setRequests(prev => [payload.new, ...prev]);
        if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
        toast.info(`בקשה חדשה מאיציק!`, { icon: <Bell className="text-orange-500" /> });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInitialData = async () => {
    const { data: reqs } = await supabase.from('saban_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    const { data: ords } = await supabase.from('saban_orders').select('*');
    setRequests(reqs || []);
    setOrders(ords || []);
  };

  const shareToWhatsApp = () => {
    const text = `*סידור עבודה SabanOS - תאריך: ${new Date().toLocaleDateString('he-IL')}*\n\n` + 
                 orders.map(o => `⏰ ${o.delivery_time} | 👤 ${o.customer_name} | 🚚 ${o.driver_name}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header עם כפתורי שיתוף ודוח בוקר */}
      <div className="bg-white p-4 border-b sticky top-0 z-30 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-black text-[#0B2C63] flex items-center gap-2 italic">SabanOS Studio</h1>
        <div className="flex gap-2">
          <Button onClick={() => toast.info("מפיק דוח בוקר...")} className="bg-slate-800 rounded-xl gap-2 font-bold h-10 px-4">
             <FileText size={18}/> דוח בוקר
          </Button>
          <Button onClick={shareToWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E] rounded-xl gap-2 font-bold h-10 px-4">
             <Share2 size={18}/> שיתוף ווטסאפ
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* מלשינון בקשות ממתינות - מלבן המבורגר נפתח במובייל */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
               <Bell className="text-orange-500 animate-pulse" size={20}/> לוח בקשות
            </h2>
            <Badge className="bg-orange-500">{requests.length}</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
            {requests.map(req => (
              <Card key={req.id} className="p-4 rounded-[2rem] border-none shadow-md bg-white border-r-8 border-orange-500 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-slate-800 text-sm">{req.customer_name}</span>
                  <div className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                    <Clock size={12}/> <Timer startTime={req.created_at} />
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-bold mb-4 italic">
                  {req.request_type} #{req.doc_number} | {req.delivery_date}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="bg-[#0B2C63] rounded-xl font-bold h-8 text-[11px]">שייך לחכמת</Button>
                  <Button size="sm" className="bg-blue-600 rounded-xl font-bold h-8 text-[11px]">שייך לעלי</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* לוח סידור השעות ותמונות נהגים */}
        <div className="lg:col-span-3 space-y-6">
          {/* שורת נהגים עם תמונות */}
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {drivers.map(driver => (
              <div key={driver.name} className="flex-shrink-0 text-center space-y-2">
                <div className="w-20 h-20 rounded-[2rem] border-4 p-1 shadow-lg transition-transform hover:scale-105" style={{ borderColor: driver.color }}>
                  <img src={driver.img} className="w-full h-full rounded-[1.5rem] object-cover" alt={driver.name} />
                </div>
                <span className="font-black text-sm block">{driver.name}</span>
              </div>
            ))}
            <div className="flex-shrink-0 flex flex-col items-center gap-2 opacity-40 cursor-not-allowed">
                <div className="w-20 h-20 rounded-[2rem] border-4 border-dashed border-slate-300 flex items-center justify-center bg-white shadow-sm">
                    <Plus size={32} className="text-slate-300"/>
                </div>
                <span className="font-black text-xs">הוסף נהג</span>
            </div>
          </div>

          {/* לוח השעות המדויק */}
          <div className="space-y-2">
            {timeSlots.map(time => {
              const timeOrders = orders.filter(o => o.delivery_time === time);
              return (
                <div key={time} className="flex gap-4 items-center group">
                  <div className="w-14 text-sm font-black text-[#0B2C63]">{time}</div>
                  <div className="flex-1 min-h-[55px] p-2 bg-white rounded-2xl border-2 border-slate-50 shadow-sm group-hover:border-blue-100 transition-all flex items-center gap-3">
                    {timeOrders.map((order, idx) => (
                      <Badge key={idx} className="bg-blue-50 text-blue-700 h-10 px-4 rounded-xl border-none font-bold text-sm">
                        {order.customer_name} | {order.driver_name}
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 rounded-xl hover:bg-slate-50">
                        <Plus size={16} className="text-slate-400" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Timer({ startTime }: { startTime: string }) {
    const [ms, setMs] = useState(0);
    useEffect(() => {
        const i = setInterval(() => setMs(Date.now() - new Date(startTime).getTime()), 1000);
        return () => clearInterval(i);
    }, [startTime]);
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return <span>{mins}:{secs.toString().padStart(2, '0')}</span>;
}
