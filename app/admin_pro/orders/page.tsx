"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  ShoppingBag, Clock, CheckCircle2, Truck, 
  Printer, FileText, MoreVertical, Search, 
  Package, Scale, MapPin, X, ShieldCheck, Download, FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Saban Admin Pro - Orders Management V1.5 (PDF Engine Edition)
 * ------------------------------------------------------------
 * - PDF Engine: html2canvas + jsPDF for perfect Hebrew RTL support.
 * - Live Sync: Real-time listening to 'orders' table.
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, vip_profiles(full_name, main_project, phone)`)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders_sync_pro').on('postgres_changes', { event: '*', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- מנוע ה-PDF של ח. סבן ---
  const exportToPDF = async (order: any) => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);
    const toastId = toast.loading("מייצר תעודה דיגיטלית...");

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // איכות גבוהה להדפסה
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Saban_Order_${order.id.slice(-6)}.pdf`);
      
      toast.success("תעודת PDF מוכנה!", { id: toastId });
    } catch (err) {
      toast.error("שגיאה בייצור PDF", { id: toastId });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
    if (!error) {
      toast.success(`הסטטוס עודכן ל: ${STATUS_MAP[nextStatus].label}`);
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter(o => 
    o.vip_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.slice(-6).includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
              <ShoppingBag size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-slate-900">מרכז הזמנות VIP</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Saban Logistics Flow</p>
           </div>
        </div>
        <div className="w-full md:w-96 relative group">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
           <input placeholder="חפש קבלן או הזמנה..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none pr-14 pl-6 py-4 rounded-[22px] font-bold shadow-inner outline-none focus:ring-4 ring-blue-500/10 transition-all text-sm" />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col border-t-8 border-t-slate-100 hover:border-t-blue-500 group">
            <div className="p-8 flex-1">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">ORDER ID: {order.id.slice(-6)}</span>
                    <h3 className="text-xl font-black text-slate-900 italic tracking-tight truncate mt-1">{order.vip_profiles?.full_name}</h3>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border text-[9px] font-black uppercase flex items-center gap-2 ${STATUS_MAP[order.status as OrderStatus].color}`}>
                    {React.createElement(STATUS_MAP[order.status as OrderStatus].icon, { size: 14 })}
                    {STATUS_MAP[order.status as OrderStatus].label}
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 italic"><MapPin size={14} className="text-blue-500" /> {order.vip_profiles?.main_project}</div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center shadow-inner">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-700 italic"><Scale size={16} className="text-slate-400" /> {order.total_weight} ק"ג</div>
                    <div className="flex items-center gap-2 text-xs font-black text-slate-700"><Clock size={16} className="text-slate-400" /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
               </div>
            </div>
            <div className="p-6 bg-slate-50/80 flex gap-3">
               <button onClick={() => setSelectedOrder(order)} className="flex-1 bg-slate-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                  <FileText size={16} /> פרטים והדפסה
               </button>
               <div className="relative group/menu">
                  <button className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all shadow-sm"><MoreVertical size={20} /></button>
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all p-2 z-50">
                    {(Object.keys(STATUS_MAP) as OrderStatus[]).map((st) => (
                      <button key={st} onClick={() => updateStatus(order.id, st)} className="w-full text-right p-3 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-[10px] font-black uppercase transition-colors italic">{STATUS_MAP[st].label}</button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Drawer & PDF Template --- */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
              
              {/* Drawer Controls */}
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                 <div className="text-right">
                    <h2 className="text-2xl font-black italic uppercase leading-none">ניהול פקודת עבודה</h2>
                    <p className="text-blue-400 text-[10px] font-bold uppercase mt-2">Executive Dispatch Unit</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X /></button>
              </div>

              {/* PDF Content Root ( what we will capture ) */}
              <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                <div ref={printRef} className="p-10 bg-white min-h-full" dir="rtl">
                  {/* Branding PDF Header */}
                  <div className="flex justify-between items-center border-b-4 border-slate-900 pb-8 mb-10">
                     <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 border flex items-center justify-center">
                        <img src="/ai.png" alt="Saban" className="w-full h-full object-contain" />
                     </div>
                     <div className="text-right">
                        <h1 className="text-3xl font-black italic leading-none text-slate-900">ח. סבן חומרי בניין</h1>
                        <p className="font-bold text-slate-500 mt-2 text-sm uppercase italic tracking-tighter">החרש 10, הוד השרון | 09-7402575</p>
                     </div>
                  </div>

                  {/* Customer Info Box */}
                  <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">שם לקוח / קבלן</p>
                        <p className="font-black text-lg text-slate-900 italic leading-none">{selectedOrder.vip_profiles?.full_name}</p>
                     </div>
                     <div className="space-y-1 text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מספר פקודה</p>
                        <p className="font-black text-lg text-slate-900 italic leading-none">#{selectedOrder.id.slice(-6)}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">פרויקט</p>
                        <p className="font-bold text-slate-600">{selectedOrder.vip_profiles?.main_project}</p>
                     </div>
                     <div className="space-y-1 text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תאריך הנפקה</p>
                        <p className="font-bold text-slate-600">{new Date(selectedOrder.created_at).toLocaleDateString('he-IL')}</p>
                     </div>
                  </div>

                  {/* Items Table */}
                  <div className="space-y-4">
                     <h4 className="font-black text-slate-900 border-b border-slate-200 pb-2 italic flex items-center gap-2 uppercase tracking-tighter">
                        <Package size={18} /> רשימת ציוד לביצוע:
                     </h4>
                     <div className="space-y-2">
                        {selectedOrder.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-4 bg-white border-b border-slate-100 group">
                             <div className="text-right">
                                <p className="font-black text-slate-800 text-sm">{item.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase italic">SKU: {item.sku || '---'}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-base shadow-lg">
                                   {item.qty}
                                </span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Weight Footer */}
                  <div className="mt-10 pt-10 border-t-2 border-dashed border-slate-200 flex justify-between items-end">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Payload Total</p>
                        <div className="flex items-center gap-3">
                           <Scale size={24} className="text-blue-600" />
                           <h5 className="text-3xl font-black italic text-slate-900">{selectedOrder.total_weight} <span className="text-sm font-bold">KG</span></h5>
                        </div>
                     </div>
                     <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 mb-6 italic">חתימת המחסן לאישור העמסה</p>
                        <div className="w-40 h-1 bg-slate-900" />
                     </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => exportToPDF(selectedOrder)}
                   disabled={isGeneratingPDF}
                   className="bg-slate-950 text-white py-6 rounded-[30px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all hover:bg-blue-600 disabled:opacity-50"
                 >
                    {isGeneratingPDF ? <Loader2 className="animate-spin" size={24} /> : <FileDown size={24} />} 
                    הפק PDF עברי
                 </button>
                 <button 
                   onClick={() => window.print()}
                   className="bg-slate-100 text-slate-500 py-6 rounded-[30px] font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
                 >
                    <Printer size={24} /> הדפסה רגילה
                 </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

// Helper icons
const Loader2 = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
