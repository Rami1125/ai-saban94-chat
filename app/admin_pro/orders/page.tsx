"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  ShoppingBag, Clock, CheckCircle2, Truck, 
  Printer, FileText, MoreVertical, Search, 
  Package, Scale, MapPin, X, ShieldCheck 
} from 'lucide-react'; // ShieldCheck הוסף כאן לתיקון השגיאה
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

/**
 * Saban Admin Pro - Orders Management V1.1 (Fixed)
 * ---------------------------------------
 * Fix: Added missing ShieldCheck import for build stability.
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

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId);

    if (!error) {
      toast.success(`הסטטוס עודכן ל: ${STATUS_MAP[nextStatus].label}`);
      fetchOrders();
    } else {
      toast.error("עדכון סטטוס נכשל");
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 print:hidden">
        <AnimatePresence>
          {filteredOrders.map((order, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id}
              className="bg-white rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group overflow-hidden border-t-8 border-t-slate-100 hover:border-t-blue-500"
            >
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ORDER ID: {order.id.slice(-6)}</span>
                    <h3 className="text-xl font-black text-slate-900 italic tracking-tight truncate max-w-[150px]">{order.vip_profiles?.full_name}</h3>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase flex items-center gap-2 ${STATUS_MAP[order.status as OrderStatus].color}`}>
                    {React.createElement(STATUS_MAP[order.status as OrderStatus].icon, { size: 14 })}
                    {STATUS_MAP[order.status as OrderStatus].label}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 italic">
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
              <div className="bg-slate-50/80 p-6 flex gap-3">
                 <button onClick={() => setSelectedOrder(order)} className="flex-1 bg-slate-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all shadow-lg">
                    <FileText size={16} className="inline ml-2" /> פרטים והדפסה
                 </button>
                 <div className="relative group/menu">
                    <button className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                       <MoreVertical size={20} />
                    </button>
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all p-2 z-50">
                       {(Object.keys(STATUS_MAP) as OrderStatus[]).map((st) => (
                         <button key={st} onClick={() => updateStatus(order.id, st)} className="w-full text-right p-3 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase transition-colors">
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

      {/* Drawer Detail */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-10">
              <div className="flex justify-between items-center mb-10">
                 <div className="text-right">
                    <h2 className="text-2xl font-black italic uppercase leading-none text-slate-900">תעודת משלוח</h2>
                    <p className="text-blue-600 text-[10px] font-bold uppercase mt-2">Saban Logistics Admin</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 bg-slate-100 rounded-2xl"><X /></button>
              </div>
              <div className="space-y-6 text-right overflow-y-auto flex-1">
                 <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] font-bold text-slate-400">לקוח</p><p className="font-black italic">{selectedOrder.vip_profiles?.full_name}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400">פרויקט</p><p className="font-black italic">{selectedOrder.vip_profiles?.main_project}</p></div>
                 </div>
                 <div className="border-t pt-6">
                    <p className="font-black text-slate-900 mb-4 italic uppercase">רשימת ציוד:</p>
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between p-4 bg-slate-50 rounded-2xl mb-2 border border-slate-100">
                         <span className="font-black text-blue-600 italic">x{item.qty}</span>
                         <span className="font-bold text-slate-700">{item.name}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <button onClick={() => window.print()} className="w-full bg-slate-950 text-white py-6 rounded-[30px] font-black text-xl mt-10 shadow-2xl flex items-center justify-center gap-4">
                 <Printer size={28} /> הדפס תעודה
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
