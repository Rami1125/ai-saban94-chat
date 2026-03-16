"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { 
  CheckCircle2, Truck, Package, Clock, ShieldCheck, 
  MapPin, Phone, ChevronRight, ArrowLeft, Loader2,
  Box, Scale, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban VIP - Live Order Tracker V1.0
 * ----------------------------------
 * - Real-time tracking for the customer.
 * - Visual progress bar (4 Stages).
 * - Live sync with Admin status updates.
 */

type OrderStatus = 'pending_upload' | 'received' | 'in_preparation' | 'out_for_delivery' | 'delivered';

const STEPS = [
  { id: 'received', label: 'הזמנה נקלטה', icon: Clock, desc: 'ההזמנה ממתינה לאישור סופי' },
  { id: 'in_preparation', label: 'בהכנה במחסן', icon: Package, desc: 'צוות המחסן מעמיס את הציוד' },
  { id: 'out_for_delivery', label: 'בדרך אליך', icon: Truck, desc: 'הנהג יצא מהמרלו"ג' },
  { id: 'delivered', label: 'סופקה בהצלחה', icon: ShieldCheck, desc: 'הציוד נפרק באתר' },
];

export default function LiveTrackPage() {
  const { id } = useParams(); // ה-ID של הלקוח
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. שליפת הזמנה פעילה וסנכרון Real-time
  const fetchActiveOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', id)
        .neq('status', 'delivered') // מחפשים הזמנה שעדיין לא הסתיימה
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // אם אין הזמנה פעילה, נבדוק את האחרונה שסופקה (עבור תצוגת סיום)
      if (!data) {
        const { data: lastDelivered } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', id)
          .eq('status', 'delivered')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setActiveOrder(lastDelivered);
      } else {
        setActiveOrder(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrder();

    const channel = supabase.channel(`track_${id}`)
      .on('postgres_changes', { event: '*', table: 'orders', filter: `customer_id=eq.${id}` }, () => {
        fetchActiveOrder();
        toast.info("סטטוס הזמנה עודכן בזמן אמת 🚛");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // חישוב השלב הנוכחי
  const currentStepIndex = activeOrder ? STEPS.findIndex(s => s.id === activeOrder.status) : -1;

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="font-black italic text-slate-400 uppercase tracking-widest text-xs">Saban Live Sync...</p>
    </div>
  );

  if (!activeOrder) return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-white" dir="rtl">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-slate-100">
        <Box size={40} className="text-slate-200" />
      </div>
      <h2 className="text-2xl font-black italic text-slate-900">אין הזמנות פעילות</h2>
      <p className="text-slate-400 font-bold mt-2 max-w-xs">כל ההזמנות שלך סופקו או שטרם בוצעה הזמנה חדשה היום.</p>
      <button 
        onClick={() => router.push(`/vip/${id}`)}
        className="mt-10 bg-slate-950 text-white px-10 py-5 rounded-3xl font-black shadow-xl active:scale-95 transition-all flex items-center gap-3"
      >
        <ArrowLeft size={20} /> חזרה לצ'אט הלוגיסטי
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="bg-white p-6 md:p-10 border-b border-slate-100 sticky top-0 z-50 shadow-sm flex justify-between items-center">
        <button onClick={() => router.push(`/vip/${id}`)} className="p-3 bg-slate-50 rounded-2xl active:scale-90 transition-transform">
          <ChevronRight size={24} />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-black italic uppercase leading-none">Live Track</h1>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Saban VIP Experience</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-xl shadow-lg border p-1.5 ring-2 ring-blue-50 overflow-hidden">
           <img src="/ai.png" alt="Saban" className="w-full h-full object-contain" />
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        
        {/* Order ID & Project Card */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Order Reference</span>
               <h2 className="text-2xl font-black italic tracking-tighter">#{activeOrder.id.slice(-6)}</h2>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-black uppercase">
               VIP Priority
            </div>
          </div>
          <div className="space-y-4 relative z-10">
             <div className="flex items-center gap-3">
                <MapPin size={18} className="text-blue-400" />
                <p className="font-bold text-sm italic">{activeOrder.delivery_details?.address || 'סטרומה 4, הרצליה'}</p>
             </div>
             <div className="flex items-center gap-3">
                <Scale size={18} className="text-blue-400" />
                <p className="font-bold text-sm italic">{activeOrder.total_weight} ק"ג (משקל כולל)</p>
             </div>
          </div>
        </div>

        {/* Live Progress Tracker */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
          <h3 className="font-black text-slate-900 text-lg italic mb-10 flex items-center gap-2">
             <Truck className="text-blue-600" size={20} /> סטטוס משלוח חי
          </h3>

          <div className="relative space-y-12 pr-4">
             {/* The Vertical Line */}
             <div className="absolute right-7 top-2 bottom-2 w-1 bg-slate-100 rounded-full" />
             <motion.div 
               initial={{ height: 0 }}
               animate={{ height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
               className="absolute right-7 top-2 w-1 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-1000"
             />

             {/* Steps */}
             {STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isActive = index === currentStepIndex;

                return (
                  <div key={step.id} className="relative flex items-start gap-8 group">
                    {/* Circle Indicator */}
                    <motion.div 
                      initial={false}
                      animate={{ 
                        scale: isActive ? 1.2 : 1,
                        backgroundColor: isCompleted ? '#2563eb' : '#F1F5F9'
                      }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-sm border-4 border-white"
                    >
                      <step.icon size={22} className={isCompleted ? 'text-white' : 'text-slate-300'} />
                    </motion.div>

                    {/* Content */}
                    <div className="text-right pt-2 flex-1">
                       <h4 className={`font-black italic text-base leading-none ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                          {step.label}
                       </h4>
                       <p className={`text-[11px] font-bold mt-2 leading-relaxed ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                          {step.desc}
                       </p>
                       {isActive && (
                         <motion.div 
                           initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                           className="inline-flex items-center gap-2 mt-3 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100 text-[10px] font-black uppercase"
                         >
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> עכשיו בביצוע
                         </motion.div>
                       )}
                    </div>
                  </div>
                );
             })}
          </div>
        </div>

        {/* Order Details Accordion */}
        <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h4 className="font-black text-slate-800 text-sm italic uppercase tracking-widest flex items-center gap-2">
                 <Package size={16} /> פירוט פריטים
              </h4>
              <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{activeOrder.items?.length || 0} פריטים</span>
           </div>
           <div className="p-8 space-y-4">
              {activeOrder.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="font-black text-slate-800 text-sm italic">{item.name}</p>
                   <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm text-sm">x{item.qty}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Support CTA */}
        <div className="flex gap-4">
           <button 
             onClick={() => window.open(`https://wa.me/972508860896`, '_blank')}
             className="flex-1 bg-[#25D366] text-white py-6 rounded-[30px] font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all italic text-lg"
           >
              <Phone size={24} /> דבר עם ראמי
           </button>
        </div>

      </main>

      {/* Styles for smooth progress line */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  );
}
