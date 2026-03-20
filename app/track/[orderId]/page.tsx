"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Package, MapPin, Clock, CheckCircle2, 
  Send, Loader2, BellRing, AlertTriangle
} from "lucide-react";
import { useParams } from 'next/navigation';
import { toast, Toaster } from "sonner";

export default function SabanCustomerTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const supabase = getSupabase();
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!orderId) {
        setError("מספר הזמנה חסר בכתובת");
        setLoading(false);
        return;
    }
const fetchOrder = async () => {
  const cleanId = orderId.toString().replace(/[\[\]]/g, '').trim();
  console.log("🔍 SabanOS Testing ID:", cleanId);

  try {
    // בדיקה אם ה-Client של Supabase בכלל עובד
    if (!supabase) {
        throw new Error("Supabase client is not initialized");
    }

    const { data, error: sbError, status } = await supabase
      .from('saban_master_dispatch')
      .select('*')
      .eq('order_id_comax', cleanId)
      .maybeSingle();

    console.log("📡 Supabase Response Status:", status);
    console.log("📦 Data Received:", data);

    if (sbError) throw sbError;

    if (!data) {
        setError(`הזמנה ${cleanId} לא נמצאה בסידור. וודא שהמספר נכון ב-Supabase.`);
    } else {
        setOrder(data);
    }
  } catch (err: any) {
    console.error("❌ Critical Error:", err);
    setError(`שגיאה: ${err.message || "לא ניתן להתחבר לנתונים"}`);
  } finally {
    setLoading(false);
  }
};
    fetchOrder();

    // הגנה: אם אחרי 10 שניות עדיין בטעינה, נשחרר את המסך
    const timeout = setTimeout(() => {
        if (loading) {
            setLoading(false);
            setError("זמן ההמתנה פג. נסה לרענן.");
        }
    }, 10000);

    return () => clearTimeout(timeout);
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-900 gap-4 font-black">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="animate-pulse italic">מתחבר לסידור של ח. סבן...</p>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-4 font-black">
      <AlertTriangle size={64} className="text-amber-500" />
      <h1 className="text-2xl text-slate-800">אופס! משהו לא עבד</h1>
      <p className="text-slate-500">{error || "הזמנה לא נמצאה"}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="bg-blue-600 text-white px-8 py-3 rounded-2xl shadow-lg active:scale-95 transition-all"
      >
        נסה שוב
      </button>
    </div>
  );

  const steps = ['פתוח', 'אושר להפצה', 'בביצוע', 'הושלם'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 pb-24 text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      <div className="text-center py-6">
        <h1 className="text-4xl font-black italic text-blue-700 tracking-tighter">ח. סבן</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Live Tracking</p>
      </div>

      <Card className="bg-white border-none rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden mb-6 border-t-4 border-blue-600">
        <div className="flex flex-col items-center gap-4 mb-8">
            <div className={`p-6 rounded-full transition-all duration-500 ${order.status === 'בביצוע' ? 'bg-blue-600 text-white animate-bounce shadow-xl shadow-blue-200' : 'bg-blue-50 text-blue-600'}`}>
                {order.status === 'בביצוע' ? <Truck size={48}/> : <Package size={48}/>}
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">שלום, {order.customer_name}</h2>
                <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1 mt-2 font-black italic">
                   הזמנה #{order.order_id_comax}
                </Badge>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-2 relative mt-4">
            {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${i <= currentStepIndex ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-200'}`}>
                        {i < currentStepIndex ? <CheckCircle2 size={18}/> : <span className="text-[10px] font-black">{i+1}</span>}
                    </div>
                    <span className={`text-[9px] font-black uppercase text-center ${i <= currentStepIndex ? 'text-blue-700' : 'text-slate-300'}`}>{step}</span>
                </div>
            ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-none p-5 rounded-[2rem] shadow-sm flex flex-col items-center text-center gap-2">
            <div className="bg-red-50 p-2 rounded-xl text-red-500"><MapPin size={20}/></div>
            <p className="text-[9px] font-black text-slate-400 uppercase italic">כתובת</p>
            <p className="font-bold text-xs text-slate-700 leading-tight">{order.address || "טייבה"}</p>
        </Card>
        <Card className="bg-white border-none p-5 rounded-[2rem] shadow-sm flex flex-col items-center text-center gap-2">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><Clock size={20}/></div>
            <p className="text-[9px] font-black text-slate-400 uppercase italic">שעה</p>
            <p className="font-bold text-xs text-slate-700 leading-tight">{order.scheduled_time}</p>
        </Card>
      </div>

      {order.status === 'פתוח' && (
        <div className="fixed bottom-6 left-6 right-6 z-[100]">
          <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-3 shadow-2xl border border-white flex gap-2 ring-1 ring-black/5">
                <input 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="הוסף הערה לסידור..."
                    className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-700 font-bold outline-none text-xs text-right"
                />
                <button onClick={sendUpdate} className="bg-blue-600 text-white p-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-blue-100">
                    <Send size={20}/>
                </button>
          </Card>
        </div>
      )}
    </div>
  );
}
