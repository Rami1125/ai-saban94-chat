"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Package, MapPin, Clock, CheckCircle2, 
  MessageCircle, Send, Loader2, BellRing
} from "lucide-react";
import { useParams } from 'next/navigation';
import { toast, Toaster } from "sonner";
import OneSignal from 'react-onesignal';

export default function SabanCustomerTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const supabase = getSupabase();
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // אתחול OneSignal להתראות Push
    OneSignal.init({ 
        appId: "acc8a2bc-d54e-4261-b3d2-cc5c5f7b39d3", // תחליף ב-ID שלך מהפאנל של OneSignal
        allowLocalhoodNotifications: true 
    });

    if (!orderId) return;

    const fetchOrder = async () => {
      setLoading(true);
      const cleanId = orderId.toString().replace(/[\[\]]/g, '');
      try {
        const { data, error } = await supabase
          .from('saban_master_dispatch')
          .select('*')
          .eq('order_id_comax', cleanId)
          .single();
        if (error) throw error;
        setOrder(data);
      } catch (err) {
        toast.error("הזמנה לא נמצאה.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // האזנה לשינויים בזמן אמת + צליל והתראה
    const channel = supabase
      .channel(`track_${orderId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'saban_master_dispatch' }, 
        (payload) => {
          const cleanId = orderId.toString().replace(/[\[\]]/g, '');
          if (payload.new.order_id_comax === cleanId) {
            setOrder(payload.new);
            
            // השמעת צליל התראה
            if (audioPlayer.current) {
                audioPlayer.current.play().catch(e => console.log("Audio blocked by browser"));
            }

            // הקפצת התראה ויזואלית
            toast.info(`סטטוס עודכן ל: ${payload.new.status}`, {
                icon: <BellRing className="text-blue-600" />,
                duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  const sendUpdate = async () => {
    if (!newNote.trim() || order.status !== 'פתוח') return;
    const { error } = await supabase
      .from('saban_master_dispatch')
      .update({ order_id_comax: `${order.order_id_comax}\n(לקוח: ${newNote})` })
      .eq('id', order.id);

    if (!error) {
      toast.success("הבקשה נשלחה לסידור!");
      setNewNote("");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 gap-4 font-black">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p>טוען נתונים מסידור ח. סבן...</p>
    </div>
  );

  if (!order) return <div className="p-10 text-center font-black">הזמנה לא נמצאה</div>;

  const steps = ['פתוח', 'אושר להפצה', 'בביצוע', 'הושלם'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 pb-24 text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      {/* Header יוקרתי ובהיר */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-black italic text-blue-700 tracking-tighter">ח. סבן</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1">Saban Logistics Group</p>
      </div>

      {/* Hero Status Card - Light UI */}
      <Card className="bg-white border-none rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
            <div className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                 style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}></div>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
            <div className={`p-6 rounded-full transition-all ${order.status === 'בביצוע' ? 'bg-blue-600 text-white animate-bounce shadow-xl shadow-blue-200' : 'bg-blue-50 text-blue-600'}`}>
                {order.status === 'בביצוע' ? <Truck size={48}/> : <Package size={48}/>}
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">שלום, {order.customer_name}</h2>
                <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1 mt-2 font-black italic">
                   מעקב הזמנה #{order.order_id_comax}
                </Badge>
            </div>
        </div>

        {/* Stepper Progress */}
        <div className="grid grid-cols-4 gap-2 relative mt-4">
            {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${i <= currentStepIndex ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-300'}`}>
                        {i < currentStepIndex ? <CheckCircle2 size={18}/> : <span className="text-[10px] font-black">{i+1}</span>}
                    </div>
                    <span className={`text-[9px] font-black uppercase text-center ${i <= currentStepIndex ? 'text-blue-700' : 'text-slate-400'}`}>{step}</span>
                </div>
            ))}
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex gap-4">
            <Card className="flex-1 bg-white border-none p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-2xl text-red-500"><MapPin size={24}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">כתובת</p>
                    <p className="font-bold text-sm text-slate-700 leading-tight">{order.address || "טייבה"}</p>
                </div>
            </Card>
            <Card className="flex-1 bg-white border-none p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-500"><Clock size={24}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase italic">שעה</p>
                    <p className="font-bold text-sm text-slate-700 leading-tight">{order.scheduled_time}</p>
                </div>
            </Card>
        </div>
      </div>

      {/* Customer Action Box */}
      {order.status === 'פתוח' && (
        <div className="fixed bottom-6 left-6 right-6 z-[100]">
          <Card className="bg-white rounded-[2rem] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-slate-100 flex gap-2">
                <input 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="צריך להוסיף משהו? כתוב לנו..."
                    className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-700 font-bold outline-none text-xs text-right"
                />
                <button onClick={sendUpdate} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                    <Send size={20}/>
                </button>
          </Card>
        </div>
      )}
    </div>
  );
}
