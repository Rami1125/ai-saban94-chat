"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  ShoppingBag, Clock, CheckCircle2, Truck, 
  Printer, FileText, MoreVertical, Search, 
  Filter, ChevronRight, Package, Scale, 
  MapPin, User, AlertCircle, Loader2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

/**
 * Saban Admin Pro - Orders Management V1.0
 * ---------------------------------------
 * - Live Sync: Real-time listening to 'orders' table.
 * - Progress Tracking: Dynamic status updates (Pending -> Prep -> Ready -> Shipped).
 * - Print/PDF: Clean invoice generation for warehouse/drivers.
 */

type OrderStatus = 'pending_upload' | 'received' | 'in_preparation' | 'out_for_delivery' | 'delivered';

const STATUS_MAP: Record<OrderStatus, { label: string, color: string, icon: any }> = {
  pending_upload: { label: 'ממתין להעלאה', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  received: { label: 'התקבלה', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
  in_preparation: { label: 'בהכנה במחסן', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Package },
  out_for_delivery: { label: 'יצא להפצה', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Truck },
  delivered: { label: 'סופקה', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: ShieldCheck },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // 1. שליפה וסנכרון Real-time
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, vip_profiles(full_name, main_project, phone)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error("שגיאה בסנכרון הזמנות");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders_sync')
      .on('postgres_changes', { event: '*', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. עדכון סטטוס הזמנה
  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId);

    if (!error) {
      toast.success(`הסטטוס עודכן ל: ${STATUS_MAP[nextStatus].label}`);
    } else {
      toast.error("עדכון סטטוס נכשל");
    }
  };

  // 3. הדפסה (Print view)
  const handlePrint = (order: any) => {
    window.print();
  };

  const filteredOrders = orders.filter(o => 
    o.vip_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.slice(-6).includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20" dir="rtl">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
              <ShoppingBag size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">מרכז הזמנות VIP</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Saban Logistics Flow</p>
           </div>
        </div>
        <div className="w-full md:w-96 relative group">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
           <input 
              placeholder="חפש לפי שם קבלן או מספר הזמנה..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none pr-14 pl-6 py-4 rounded-[22px] font-bold shadow-inner outline-none focus:ring-4 ring-blue-500/10 transition-all text-sm"
           />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 print:block">
        <AnimatePresence>
          {filteredOrders.map((order, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={order.id}
              className="bg-white rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group overflow-hidden border-t-8 border-t-slate-100 hover:border-t-blue-500 print:border-none print:shadow-none print:mb-8"
            >
              {/* Card Header */}
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ORDER ID: {order.id.slice(-6)}</span>
                    <h3 className="text-xl font-black text-slate-900 italic tracking-tight truncate max-w-[200px]">{order.vip_profiles?.full_name}</h3>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase flex items-center gap-2 ${STATUS_MAP[order.status as OrderStatus].color}`}>
                    {React.createElement(STATUS_MAP[order.status as OrderStatus].icon, { size: 14 })}
                    {STATUS_MAP[order.status as OrderStatus].label}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 italic">
                  <MapPin size={14} className="text-blue-500" /> {order.vip_profiles?.main_project}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center shadow-inner">
                   <div className="flex items-center gap-2">
                      <Scale size={16} className="text-slate-400" />
                      <span className="text-xs font-black text-slate-700 italic">{order.total_weight} ק"ג</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-xs font-black text-slate-700">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                </div>
              </div>

              {/* Items Summary (Mini list) */}
              <div className="px-8 pb-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">רשימת פריטים חלקית</p>
                 <div className="space-y-2">
                    {order.items?.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs font-bold text-slate-600 bg-slate-50/50 p-2 rounded-lg">
                        <span>{item.name}</span>
                        <span className="text-blue-600 font-black">x{item.qty}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-center text-[10px] font-bold text-slate-400 mt-2">...ועוד {order.items.length - 3} פריטים נוספים</p>
                    )}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50/80 p-6 flex gap-3 print:hidden">
                 <button 
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 bg-slate-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                 >
                    <FileText size={16} /> פרטים והדפסה
                 </button>
                 <div className="relative group/menu">
                    <button className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                       <MoreVertical size={20} />
                    </button>
                    {/* Status Popover */}
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all p-2 z-50">
                       {(Object.keys(STATUS_MAP) as OrderStatus[]).map((st) => (
                         <button 
                           key={st}
                           onClick={() => updateStatus(order.id, st)}
                           className="w-full text-right p-3 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase transition-colors"
                         >
                           {STATUS_MAP[st].label}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Order Detail Drawer (The Hamburger Responsive Style) */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex justify-end print:static print:block">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md print:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col print:w-full print:shadow-none"
            >
              {/* Drawer Header */}
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center shrink-0 print:hidden">
                 <div className="text-right">
                    <h2 className="text-2xl font-black italic uppercase leading-none">תעודת הזמנה לביצוע</h2>
                    <p className="text-blue-400 text-[10px] font-bold uppercase mt-2 tracking-[0.2em]">Ready for Preparations</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X /></button>
              </div>

              {/* Print Only Header */}
              <div className="hidden print:block p-8 border-b-4 border-slate-900 mb-8">
                 <div className="flex justify-between items-center">
                    <img src="/ai.png" className="h-16" alt="Saban" />
                    <div className="text-right">
                       <h1 className="text-3xl font-black">ח. סבן חומרי בניין</h1>
                       <p className="font-bold">החרש 10, הוד השרון | 09-7402575</p>
                    </div>
                 </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                 
                 {/* Customer Summary */}
                 <div className="grid grid-cols-2 gap-6 text-right">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">לקוח</p>
                       <p className="font-black text-lg italic text-slate-900 leading-none">{selectedOrder.vip_profiles?.full_name}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מספר הזמנה</p>
                       <p className="font-black text-lg italic text-slate-900 leading-none">#{selectedOrder.id.slice(-6)}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">פרויקט / אתר</p>
                       <p className="font-bold text-slate-600">{selectedOrder.vip_profiles?.main_project}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">טלפון לתיאום</p>
                       <p className="font-bold text-slate-600">{selectedOrder.vip_profiles?.phone}</p>
                    </div>
                 </div>

                 {/* Items Table */}
                 <div className="space-y-4">
                    <h4 className="font-black text-slate-900 border-b-2 border-slate-100 pb-2 italic flex items-center gap-2">
                       <Package size={18} /> רשימת ציוד לביצוע:
                    </h4>
                    <div className="space-y-3">
                       {selectedOrder.items?.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-[22px] border border-slate-100 group">
                            <div className="text-right">
                               <p className="font-black text-slate-800 text-sm leading-none">{item.name}</p>
                               <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">SKU: {item.sku || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="text-[10px] font-black text-slate-400 uppercase italic">QTY</span>
                               <span className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm border border-slate-200 text-lg">
                                  {item.qty}
                               </span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Payload Summary */}
                 <div className="bg-slate-950 text-white p-8 rounded-[35px] shadow-2xl flex justify-between items-center">
                    <div>
                       <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Total Payload</p>
                       <h5 className="text-3xl font-black italic leading-none">{selectedOrder.total_weight} <span className="text-sm">KG</span></h5>
                    </div>
                    <div className="text-right opacity-50">
                       <Scale size={32} />
                    </div>
                 </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-10 border-t border-slate-100 bg-white flex gap-4 print:hidden">
                 <button 
                   onClick={() => handlePrint(selectedOrder)}
                   className="flex-1 bg-slate-900 text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all"
                 >
                    <Printer size={28} /> הדפס תעודה
                 </button>
                 <button 
                   onClick={() => setSelectedOrder(null)}
                   className="px-10 bg-slate-100 text-slate-400 rounded-[30px] font-black text-sm uppercase transition-all"
                 >
                    סגור
                 </button>
              </div>

              {/* Print Only Signature */}
              <div className="hidden print:flex justify-between p-10 mt-auto border-t-2 border-dashed border-slate-200">
                 <div className="text-right space-y-8">
                    <p className="font-bold underline italic">חתימת הנהג / מוביל</p>
                    <div className="h-10" />
                 </div>
                 <div className="text-right space-y-8">
                    <p className="font-bold underline italic">חתימת הלקוח באתר</p>
                    <div className="h-10" />
                 </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Styles for Printing */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\:block, .print\:block * { visibility: visible; }
          .print\:block { position: absolute; left: 0; top: 0; width: 100%; }
          .print\:hidden { display: none !important; }
        }
      `}</style>

    </div>
  );
}
