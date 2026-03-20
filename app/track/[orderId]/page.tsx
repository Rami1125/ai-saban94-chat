"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Package, MapPin, Clock, CheckCircle2, 
  MessageCircle, Send, Phone, Info, AlertCircle 
} from "lucide-react";
import { useParams } from 'next/navigation';

export default function SabanCustomerTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const supabase = getSupabase();

  useEffect(() => {
    if (!orderId) return;

    // האזנה לשינויים בזמן אמת (Realtime)
    const fetchAndSubscribe = async () => {
      const { data } = await supabase.from('saban_master_dispatch').select('*').eq('id', orderId).single();
      setOrder(data);

      const channel = supabase
        .channel(`track_${orderId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'saban_master_dispatch', filter: `id=eq.${orderId}` }, 
          (payload) => setOrder(payload.new)
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    fetchAndSubscribe();
  }, [orderId, supabase]);

  const sendUpdate = async () => {
    if (!newNote.trim() || order.status !== 'פתוח') return;
    const updatedDetails = `${order.order_id_comax || ''}\n(תוספת לקוח: ${newNote})`;
    await supabase.from('saban_master_dispatch').update({ order_id_comax: updatedDetails }).eq('id', orderId);
    setNewNote("");
  };

  if (!order) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-black animate-pulse">מחבר אותך לסידור של ח. סבן...</div>;

  const steps = ['פתוח', 'אושר להפצה', 'בביצוע', 'הושלם'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans p-4 pb-24 text-right" dir="rtl">
      {/* Top Branding */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-black italic text-blue-400 uppercase tracking-tighter">ח. סבן</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Order Tracking</p>
            <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
        </div>
      </div>

      {/* Hero Status Card */}
      <Card className="bg-slate-900 border-none rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(currentStepIndex + 1) * 25}%` }}></div>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
            <div className={`p-6 rounded-full shadow-2xl ${order.status === 'בביצוע' ? 'bg-blue-600 animate-bounce' : 'bg-slate-800'}`}>
                {order.status === 'בביצוע' ? <Truck size={48} className="text-white"/> : <Package size={48} className="text-blue-400"/>}
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-black tracking-tight leading-none">שלום, {order.customer_name}</h2>
                <p className="text-blue-400 font-bold text-sm mt-2">{order.status === 'הושלם' ? 'ההזמנה סופקה בהצלחה!' : 'המערכת מעדכנת את ההפצה...'}</p>
            </div>
        </div>

        {/* Status Stepper UI */}
        <div className="grid grid-cols-4 gap-2 relative">
            {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${i <= currentStepIndex ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-slate-700'}`}>
                        {i < currentStepIndex ? <CheckCircle2 size={16}/> : <span className="text-[10px] font-black">{i+1}</span>}
                    </div>
                    <span className={`text-[8px] font-black uppercase text-center ${i <= currentStepIndex ? 'text-white' : 'text-slate-600'}`}>{step}</span>
                </div>
            ))}
        </div>
      </Card>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-slate-800 p-6 rounded-[2rem] flex items-center gap-4">
            <MapPin className="text-red-400" size={24}/>
            <div>
                <p className="text-[9px] font-black text-slate-500 uppercase">מיקום פריקה</p>
                <p className="font-bold text-sm">{order.address}</p>
            </div>
        </Card>
        <Card className="bg-white/5 border-slate-800 p-6 rounded-[2rem] flex items-center gap-4">
            <Clock className="text-blue-400" size={24}/>
            <div>
                <p className="text-[9px] font-black text-slate-500 uppercase">זמן משוער</p>
                <p className="font-bold text-sm">{order.scheduled_time} | {new Date(order.scheduled_date).toLocaleDateString('he-IL')}</p>
            </div>
        </Card>
      </div>

      {/* Live Chat with AI Dispatcher */}
      {order.status === 'פתוח' && (
        <div className="fixed bottom-6 left-6 right-6 z-[100]">
          <Card className="bg-blue-600 rounded-[2rem] p-4 shadow-2xl flex flex-col gap-3">
             <div className="flex items-center gap-3 px-2">
                <div className="bg-white/20 p-2 rounded-full"><MessageCircle size={18} className="text-white"/></div>
                <p className="text-xs font-black text-white italic underline decoration-blue-300">צריך להוסיף משהו להזמנה? כתוב כאן:</p>
             </div>
             <div className="flex gap-2">
                <input 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="למשל: תוסיף לי עוד 2 בלות חול..."
                    className="flex-1 bg-white/10 border-none rounded-xl px-4 py-2 text-white font-bold placeholder:text-white/40 outline-none text-sm text-right"
                />
                <button onClick={sendUpdate} className="bg-white text-blue-600 p-3 rounded-xl border-none font-black cursor-pointer active:scale-95 transition-all">
                    <Send size={18}/>
                </button>
             </div>
          </Card>
        </div>
      )}

      {/* Contact Footer */}
      <div className="mt-12 flex flex-col items-center gap-4 opacity-30">
        <div className="flex gap-6">
            <Phone size={20}/><Activity size={20}/><Info size={20}/>
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest italic">Powered by Saban OS Neural Network</p>
      </div>
    </div>
  );
}
