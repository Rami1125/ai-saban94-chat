"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  PackageCheck, Truck, ClipboardList, CheckCircle2, 
  User, MapPin, Search, RefreshCw, PenTool, 
  ChevronRight, ArrowRight, X, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V29.0 - Picking & Delivery Mobile Interface
 * --------------------------------------------------
 * - Mode Switch: Warehouse (Picking) vs. Driver (Delivery).
 * - Real-time: Updates order status in Supabase.
 * - Interaction: Touch-friendly lists and Digital Signature.
 */

type ViewMode = 'warehouse' | 'driver';

export default function LogisticsMobileView() {
  const [mode, setMode] = useState<ViewMode>('warehouse');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showSignature, setShowSignature] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);

  // 1. שליפת הזמנות רלוונטיות לפי המצב
  const fetchOrders = async () => {
    setLoading(true);
    const statusFilter = mode === 'warehouse' ? ['received', 'in_preparation'] : ['out_for_delivery'];
    
    const { data, error } = await supabase
      .from('orders')
      .select('*, vip_profiles(full_name, main_project)')
      .in('status', statusFilter)
      .order('created_at', { ascending: true });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('mobile_sync')
      .on('postgres_changes', { event: '*', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mode]);

  // 2. עדכון סטטוס מהשטח
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId);

    if (!error) {
      toast.success(nextStatus === 'out_for_delivery' ? "העמסה הושלמה! המשאית מוכנה" : "הזמנה סופקה בהצלחה 🦾");
      setSelectedOrder(null);
      fetchOrders();
    }
  };

  // 3. לוגיקת חתימה דיגיטלית
  const startDrawing = (e: any) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.moveTo(x, y);
  };

  const draw = (e: any) => {
    const canvas = sigCanvasRef.current;
    if (!canvas || e.buttons !== 1 && !e.touches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-blue-100" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A] text-white p-6 shadow-xl rounded-b-[30px]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
                <img src="/ai.png" alt="Saban" className="w-full h-full object-contain" />
             </div>
             <div>
                <h1 className="font-black text-lg italic tracking-tighter leading-none">SABAN FIELD</h1>
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-1">Real-time Ops</p>
             </div>
          </div>
          <button onClick={fetchOrders} className="p-2 bg-white/5 rounded-lg active:scale-90 transition-all">
             <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="bg-white/5 p-1.5 rounded-2xl flex gap-2">
           <button 
             onClick={() => setMode('warehouse')}
             className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'warehouse' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
              <PackageCheck size={16}/> מחסנאי
           </button>
           <button 
             onClick={() => setMode('driver')}
             className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'driver' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
              <Truck size={16}/> נהג
           </button>
        </div>
      </header>

      {/* Main List Area */}
      <main className="p-5 pb-24">
         {loading ? (
           <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-3xl" />)}
           </div>
         ) : orders.length === 0 ? (
           <div className="py-32 text-center space-y-4 opacity-30">
              <ClipboardList size={64} className="mx-auto" />
              <p className="font-black italic uppercase tracking-widest text-sm">אין פקודות עבודה פעילות</p>
           </div>
         ) : (
           <div className="space-y-4">
             {orders.map((order) => (
               <motion.div 
                 key={order.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 onClick={() => setSelectedOrder(order)}
                 className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-200 active:scale-[0.98] transition-all flex justify-between items-center group"
               >
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PKD: {order.id.slice(-6)}</span>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg leading-tight italic">{order.vip_profiles?.full_name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 italic">
                       <MapPin size={12} className="text-blue-500"/> {order.vip_profiles?.main_project}
                    </div>
                 </div>
                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ChevronRight size={24} />
                 </div>
               </motion.div>
             ))}
           </div>
         )}
      </main>

      {/* Order Detail Overlay */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-end"
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full bg-white rounded-t-[50px] p-8 max-h-[92vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-start mb-8">
                 <div className="text-right">
                    <h2 className="text-2xl font-black italic text-slate-900 leading-tight mb-2">{selectedOrder.vip_profiles?.full_name}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{mode === 'warehouse' ? 'רשימת ליקוט פריטים' : 'פירוט פריקה באתר'}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 bg-slate-100 rounded-2xl"><X size={24}/></button>
              </div>

              {/* Items Checklist */}
              <div className="space-y-3 mb-10">
                 {selectedOrder.items?.map((item: any, i: number) => (
                   <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[25px] border border-slate-100">
                      <div className="text-right">
                         <p className="font-black text-slate-800 text-sm">{item.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">SKU: {item.sku || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-slate-300 uppercase italic">QTY</span>
                         <span className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm border border-slate-200 text-lg">
                            {item.qty}
                         </span>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Action Button */}
              {mode === 'warehouse' ? (
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'out_for_delivery')}
                  className="w-full bg-slate-950 text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all border-b-8 border-slate-800"
                >
                   <CheckCircle2 size={28} /> העמסתי הכל - שחרר נהג
                </button>
              ) : (
                <button 
                  onClick={() => setShowSignature(true)}
                  className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all border-b-8 border-blue-800"
                >
                   <PenTool size={28} /> חתום ומסור ציוד
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signature Overlay */}
      <AnimatePresence>
        {showSignature && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col p-8"
          >
             <div className="text-center mb-10">
                <h3 className="text-2xl font-black italic text-slate-900">אישור מסירה דיגיטלי</h3>
                <p className="text-slate-400 font-bold mt-1">נא לחתום בתוך המסגרת</p>
             </div>

             <div className="flex-1 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] relative overflow-hidden">
                <canvas 
                  ref={sigCanvasRef}
                  className="w-full h-full touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  width={500}
                  height={800}
                />
                <div className="absolute bottom-6 right-6 text-slate-200 pointer-events-none italic font-black uppercase text-4xl opacity-20">SIGN HERE</div>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-10">
                <button 
                  onClick={() => {
                    const canvas = sigCanvasRef.current;
                    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
                  }}
                  className="py-6 bg-slate-100 text-slate-400 rounded-[30px] font-black uppercase italic"
                >
                   נקה חתימה
                </button>
                <button 
                  onClick={() => {
                    setShowSignature(false);
                    handleUpdateStatus(selectedOrder.id, 'delivered');
                  }}
                  className="py-6 bg-emerald-500 text-white rounded-[30px] font-black shadow-xl flex items-center justify-center gap-3 border-b-8 border-emerald-700 active:scale-95 transition-all"
                >
                   <CheckCircle2 size={24}/> אשר מסירה
                </button>
             </div>
             <button onClick={() => setShowSignature(false)} className="mt-6 text-slate-300 font-bold uppercase text-xs">ביטול וחזרה</button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-center items-center">
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Saban Field Ops V29.0</p>
      </footer>

      <style jsx global>{`
        body { overflow-x: hidden; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
