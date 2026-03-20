"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Package, MapPin, Clock, CheckCircle2, 
  Send, Loader2, BellRing, AlertTriangle, Volume2
} from "lucide-react";
import { useParams } from 'next/navigation';
import { toast, Toaster } from "sonner";

export default function SabanCustomerTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const supabase = getSupabase();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // פונקציה להפעלת סאונד (חייבת לבוא מפעולת משתמש)
  const enableAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        setAudioEnabled(true);
        toast.success("התראות קוליות הופעלו");
      }).catch(() => toast.error("דרוש אישור דפדפן לסאונד"));
    }
  };

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const cleanId = orderId.toString().replace(/[\[\]]/g, '').trim();
      try {
        const { data, error: sbError } = await supabase
          .from('saban_master_dispatch')
          .select('*')
          .eq('order_id_comax', cleanId)
          .maybeSingle();

        if (sbError) throw sbError;
        if (!data) setError("הזמנה לא נמצאה");
        else setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // האזנה לשינויים בזמן אמת
    const channel = supabase
      .channel(`track_${orderId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'saban_master_dispatch' }, 
        (payload) => {
          const cleanId = orderId.toString().replace(/[\[\]]/g, '').trim();
          if (payload.new.order_id_comax === cleanId) {
            const oldStatus = order?.status;
            const newStatus = payload.new.status;
            setOrder(payload.new);

            if (oldStatus && oldStatus !== newStatus) {
                // 1. השמעת צליל (רק אם המשתמש אישר)
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => console.log("Sound blocked"));
                }

                // 2. התראת OneSignal (הודעה פנימית)
                if (typeof window !== "undefined" && (window as any).OneSignal) {
                    (window as any).OneSignal.push(() => {
                        (window as any).OneSignal.displaySelfHostedInAppMessage(`סטטוס הזמנה שונה ל: ${newStatus}`);
                    });
                }

                toast.info(`עדכון מח. סבן: הסטטוס הוא כעת ${newStatus}`, {
                    icon: <BellRing className="text-blue-600" />,
                    duration: 8000
                });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, order, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-900 font-black">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="mt-4">מתחבר לסידור של ח. סבן...</p>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-4 font-black">
      <AlertTriangle size={64} className="text-amber-500" />
      <h1 className="text-xl">הזמנה #{orderId} לא נמצאה</h1>
      <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl">נסה שוב</button>
    </div>
  );

  const steps = ['פתוח', 'אושר להפצה', 'בביצוע', 'הושלם'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 pb-24 text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      {/* כפתור הפעלת התראות קוליות - חובה בגלל חוקי דפדפן */}
      {!audioEnabled && (
        <button 
          onClick={enableAudio}
          className="w-full mb-4 bg-blue-50 text-blue-700 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs border border-blue-100 shadow-sm"
        >
          <Volume2 size={16} /> לחץ כאן להפעלת צליל והתראות
        </button>
      )}

      <div className="text-center py-4">
        <h1 className="text-4xl font-black italic text-blue-700 tracking-tighter">ח. סבן</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Live Tracking</p>
      </div>

      <Card className="bg-white border-none rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden mb-6 border-t-4 border-blue-600">
        <div className="flex flex-col items-center gap-4 mb-8">
            <div className={`p-6 rounded-full transition-all duration-500 ${order.status === 'בביצוע' ? 'bg-blue-600 text-white animate-bounce shadow-xl' : 'bg-blue-50 text-blue-600'}`}>
                {order.status === 'בביצוע' ? <Truck size={48}/> : <Package size={48}/>}
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">שלום, {order.customer_name}</h2>
                <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1 mt-2 font-black italic text-xs">
                   הזמנה #{order.order_id_comax}
                </Badge>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-2 relative mt-4">
            {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${i <= currentStepIndex ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-200'}`}>
                        {i < currentStepIndex ? <CheckCircle2 size={18}/> : <span className="text-[10px] font-black">{i+1}</span>}
                    </div>
                    <span className={`text-[9px] font-black uppercase text-center ${i <= currentStepIndex ? 'text-blue-700' : 'text-slate-300'}`}>{step}</span>
                </div>
            ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-none p-5 rounded-[2rem] shadow-sm flex flex-col items-center text-center gap-1">
            <div className="bg-red-50 p-2 rounded-xl text-red-500"><MapPin size={20}/></div>
            <p className="text-[9px] font-black text-slate-400 uppercase">כתובת</p>
            <p className="font-bold text-xs text-slate-700">{order.address || "טייבה"}</p>
        </Card>
        <Card className="bg-white border-none p-5 rounded-[2rem] shadow-sm flex flex-col items-center text-center gap-1">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><Clock size={20}/></div>
            <p className="text-[9px] font-black text-slate-400 uppercase">שעה</p>
            <p className="font-bold text-xs text-slate-700">{order.scheduled_time}</p>
        </Card>
      </div>
    </div>
  );
}
