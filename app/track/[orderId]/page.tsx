"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Package, MapPin, Clock, CheckCircle2, 
  MessageCircle, Send, Phone, Info, AlertCircle, Loader2
} from "lucide-react";
import { useParams } from 'next/navigation';
import { toast, Toaster } from "sonner";

export default function SabanCustomerTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const supabase = getSupabase();

  useEffect(() => {
    if (!orderId) return;

    // פונקציה לניקוי ה-ID ושאילתה ל-DB
    const fetchOrder = async () => {
      setLoading(true);
      
      // ניקוי סוגריים מרובעים או תווים מיותרים מה-URL
      const cleanId = orderId.toString().replace(/[\[\]]/g, '');

      try {
        const { data, error } = await supabase
          .from('saban_master_dispatch')
          .select('*')
          .eq('order_id_comax', cleanId) // חיפוש לפי מספר קומקס
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        toast.error("הזמנה לא נמצאה. וודא שהמספר תקין.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // האזנה לשינויים בזמן אמת (Realtime)
    const channel = supabase
      .channel(`track_${orderId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'saban_master_dispatch' }, 
        (payload) => {
          if (payload.new.order_id_comax === orderId.toString().replace(/[\[\]]/g, '')) {
            setOrder(payload.new);
            toast.info("סטטוס ההזמנה עודכן בסידור!");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  const sendUpdate = async () => {
    if (!newNote.trim() || order.status !== 'פתוח') return;
    
    const updatedDetails = `${order.order_id_comax || ''}\n(תוספת לקוח: ${newNote})`;
    
    const { error } = await supabase
      .from('saban_master_dispatch')
      .update({ order_id_comax: updatedDetails })
      .eq('id', order.id);

    if (!error) {
      toast.success("הבקשה נשלחה לסידור של ח. סבן!");
      setNewNote("");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white gap-4 font-black">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="animate-pulse">מתחבר לסידור של ח. סבן...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white p-6 text-center gap-4">
      <AlertCircle size={64} className="text-red-500" />
      <h1 className="text-2xl font-black italic">הזמנה לא נמצאה</h1>
      <p className="text-slate-400 font-bold">מספר ההזמנה {orderId} לא קיים במערכת.</p>
      <button onClick={() => window.location.reload()} className="bg-blue-600 px-6 py-2 rounded-xl font-black mt-4">נסה שוב</button>
    </div>
  );

  const steps = ['פתוח', 'אושר להפצה', 'בביצוע', 'הושלם'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans p-4 pb-24 text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Branding Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-black italic text-blue-400 tracking-tighter uppercase">ח. סבן</h1>
        <div className="flex items-center justify-center gap-2 mt-2 opacity-50">
            <div className="h-[2px] w-12 bg-blue-500 rounded-full"></div>
            <p className="text-[10px] font-black uppercase tracking-widest">Live Logistics</p>
            <div className="h-[2px] w-12 bg-blue-500 rounded-full"></div>
        </div>
      </div>

      {/* Main Status Card */}
      <Card className="bg-slate-900/80 border-none rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden mb-6 backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                 style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}></div>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
            <div className={`p-6 rounded-full shadow-2xl transition-all ${order.status === 'בביצוע' ? 'bg-blue-600 animate-pulse' : 'bg-slate-800'}`}>
                {order.status === 'בביצוע' ? <Truck size={48} className="text-white"/> : <Package size={48} className="text-blue-400"/>}
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-black tracking-tight">שלום, {order.customer_name}</h2>
                <Badge className="bg-blue-500/20 text-blue-400 border-none px-4 py-1 mt-2 text-xs font-black italic">
                   הזמנה #{order.order_id_comax}
                </Badge>
            </div>
        </div>

        {/* Stepper Progress */}
        <div className="grid grid-cols-4 gap-2 relative mt-4">
            {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${i <= currentStepIndex ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-slate-800 border-slate-700 opacity-40'}`}>
                        {i < currentStepIndex ? <CheckCircle2 size={18}/> : <span className="text-[10px] font-black italic">{i+1}</span>}
                    </div>
                    <span className={`text-[9px] font-black uppercase text-center leading-none ${i <= currentStepIndex ? 'text-white' : 'text-slate-600'}`}>{step}</span>
                </div>
            ))}
        </div>
      </Card>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-slate-800/50 p-6 rounded-[2rem] flex items-center gap-4 backdrop-blur-md">
            <div className="bg-red-500/20 p-3 rounded-2xl"><MapPin className="text-red-400" size={24}/></div>
            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter italic">מיקום פריקה</p>
                <p className="font-bold text-sm leading-tight mt-1">{order.address || "לא צוינה כתובת"}</p>
            </div>
        </Card>
        <Card className="bg-white/5 border-slate-800/50 p-6 rounded-[2rem] flex items-center gap-4 backdrop-blur-md">
            <div className="bg-blue-500/20 p-3 rounded-2xl"><Clock className="text-blue-400" size={24}/></div>
            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter italic">מועד מתוכנן</p>
                <p className="font-bold text-sm leading-tight mt-1">{order.scheduled_time} | {new Date(order.scheduled_date).toLocaleDateString('he-IL')}</p>
            </div>
        </Card>
      </div>

      {/* Floating Customer Message Box */}
      {order.status === 'פתוח' && (
        <div className="fixed bottom-6 left-6 right-6 z-[100]">
          <Card className="bg-[#1E293B] rounded-[2rem] p-4 shadow-2xl border border-white/5 ring-4 ring-blue-600/10">
             <div className="flex items-center gap-3 mb-3 px-2">
                <MessageCircle size={18} className="text-blue-400"/>
                <p className="text-xs font-black text-white italic">צריך שינוי או תוספת?</p>
             </div>
             <div className="flex gap-2">
                <input 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="כתוב כאן ונעדכן את הסידור..."
                    className="flex-1 bg-white/5 border-none rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/20 outline-none text-xs text-right"
                />
                <button onClick={sendUpdate} className="bg-blue-600 text-white p-3 rounded-xl border-none font-black cursor-pointer hover:bg-blue-700 transition-transform active:scale-95 shadow-lg shadow-blue-600/20">
                    <Send size={18}/>
                </button>
             </div>
          </Card>
        </div>
      )}

      {/* Bottom Footer */}
      <div className="mt-12 text-center opacity-20 flex flex-col items-center gap-2">
          <div className="h-[1px] w-24 bg-slate-500"></div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] italic">Saban OS Intelligence Unit</p>
      </div>
    </div>
  );
}
