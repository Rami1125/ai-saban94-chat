"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Package, MapPin, Clock, CheckCircle2, 
  Loader2, BellRing, AlertTriangle, Volume2, Navigation,
  ChevronRight, ArrowRight
} from "lucide-react";
import { useParams, useRouter } from 'next/navigation';
import { toast, Toaster } from "sonner";

export default function SabanCustomerTracking() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const supabase = getSupabase();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // הסטטוסים החדשים שתואמים למאסטר
  const steps = [
    { id: 'הזמנה התקבלה', label: 'התקבלה', icon: Package },
    { id: 'בהכנה', label: 'בהכנה', icon: Loader2 },
    { id: 'בדרך', label: 'בדרך אליך', icon: Truck },
    { id: 'סופקה', label: 'סופקה', icon: CheckCircle2 }
  ];

  const enableAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        setAudioEnabled(true);
        toast.success("התראות קוליות הופעלו");
      }).catch(() => toast.error("דרוש אישור דפדפן לסאונד"));
    }
  };

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
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
  }, [orderId, supabase]);

  useEffect(() => {
    fetchOrder();

    const channel = supabase
      .channel(`live_track_${orderId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'saban_master_dispatch' }, 
        (payload) => {
          if (payload.new.order_id_comax === orderId?.toString()) {
            const oldStatus = order?.status;
            const newStatus = payload.new.status;
            setOrder(payload.new);

            if (oldStatus && oldStatus !== newStatus) {
                if (audioRef.current && audioEnabled) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                }
                toast.info(`עדכון סטטוס: ${newStatus}`, {
                    icon: <BellRing className="text-blue-600" />,
                    duration: 5000
                });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, order, supabase, audioEnabled, fetchOrder]);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-black animate-pulse text-blue-700 italic">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="uppercase tracking-widest text-xs">Saban OS Live Tracking...</p>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center gap-6 font-black">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
        <AlertTriangle size={40} />
      </div>
      <div>
        <h1 className="text-2xl text-slate-800 italic">הזמנה #{orderId} לא נמצאה</h1>
        <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-tighter">Please check your order number</p>
      </div>
      <button onClick={() => router.back()} className="bg-slate-900 text-white px-10 py-4 rounded-[2rem] shadow-xl active:scale-95 transition-all">חזרה</button>
    </div>
  );

  const currentStepIndex = steps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans p-6 pb-24 text-right transition-all" dir="rtl">
      <Toaster position="top-center" richColors />
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm"><ArrowRight size={20}/></button>
        <div className="text-center">
            <h1 className="text-3xl font-black italic text-blue-700 tracking-tighter leading-none uppercase">ח. סבן</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Order Tracker</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Volume2 size={20} className={audioEnabled ? "text-blue-600" : "text-slate-300"} onClick={enableAudio}/>
        </div>
      </div>

      {/* Main Status Card */}
      <Card className="bg-white border-none rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden mb-8 border-t-8 border-blue-600">
        <div className="flex flex-col items-center gap-6 mb-12">
            <div className={`w-24 h-24 rounded-[2.5rem] transition-all duration-700 flex items-center justify-center ${order.status === 'בדרך' ? 'bg-orange-500 text-white shadow-2xl animate-bounce' : 'bg-blue-50 text-blue-600 shadow-inner'}`}>
                {order.status === 'בדרך' ? <Truck size={48}/> : <Package size={48}/>}
            </div>
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">{order.customer_name}</h2>
                <Badge className="bg-slate-50 text-slate-400 border-none px-4 py-1 mt-3 font-black italic text-[10px] uppercase tracking-widest shadow-sm">
                   COMAX ID: #{order.order_id_comax}
                </Badge>
            </div>
        </div>

        {/* Timeline Stepper */}
        <div className="grid grid-cols-4 gap-2 relative">
            {steps.map((step, i) => (
                <div key={step.id} className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 ${i <= currentStepIndex ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-50 text-slate-200'}`}>
                        {i <= currentStepIndex ? <step.icon size={22} className={i === currentStepIndex ? "animate-pulse" : ""}/> : <span className="text-xs font-black">{i+1}</span>}
                    </div>
                    <span className={`text-[9px] font-black uppercase text-center leading-tight ${i <= currentStepIndex ? 'text-blue-700' : 'text-slate-300'}`}>{step.label}</span>
                </div>
            ))}
            {/* Background progress line */}
            <div className="absolute top-6 left-0 right-0 h-[2px] bg-slate-50 -z-10 mx-6" />
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm border border-white/50 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><MapPin size={28}/></div>
            <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">יעד אספקה</p>
                <p className="font-black text-lg text-slate-700 leading-tight">{order.address || "פרויקט פעיל"}</p>
            </div>
            <button className="p-3 bg-slate-900 text-white rounded-xl shadow-lg active:scale-90 transition-all"><Navigation size={18}/></button>
        </Card>

        <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/50 p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><Clock size={24}/></div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase italic">חלון זמן</p>
                    <p className="font-black text-sm text-slate-700 italic">{order.scheduled_time}</p>
                </div>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border border-white/50 p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><Package size={24}/></div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase italic">פעולה</p>
                    <p className="font-black text-sm text-slate-700 italic">{order.container_action || "הובלה"}</p>
                </div>
            </Card>
        </div>
      </div>

      {/* Live Helper Toast */}
      {order.status === 'בדרך' && (
        <div className="bg-[#0B2C63] text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10 duration-1000">
            <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                <p className="text-sm font-black italic">המשאית במרחק נגיעה ממך!</p>
            </div>
            <ChevronRight size={20}/>
        </div>
      )}
    </div>
  );
}
