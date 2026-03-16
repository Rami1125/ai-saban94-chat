"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  ShoppingBag, Clock, CheckCircle2, Truck, 
  Printer, FileText, MoreVertical, Search, 
  Package, Scale, MapPin, X, ShieldCheck, Download, FileDown,
  Activity, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Saban Admin Pro - Orders Management V1.8 (Real-time Sync Edition)
 * ------------------------------------------------------------
 * - Real-time: Bi-directional sync between Admin and VIP Portal.
 * - Optimistic UI: Instant status feedback.
 * - PDF Engine: html2canvas + jsPDF.
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
  const [isLive, setIsLive] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // 1. שליפת הזמנות ראשונית
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`*, vip_profiles(full_name, main_project, phone)`)
      .order('updated_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
    setIsLive(true);
  };

  // 2. חיבור ערוץ Real-time להאזנה לשינויים מכל מקום
  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('orders_global_sync')
      .on('postgres_changes', { 
        event: '*', 
        table: 'orders' 
      }, (payload) => {
        // אם מישהו אחר עדכן, נעדכן את הרשימה אצלנו
        if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          // אם זו הזמנה של לקוח VIP פעיל, ניתן התראה קטנה
          toast.info(`הזמנה #${payload.new.id.slice(-4)} עודכנה בשטח 🚛`);
        } else if (payload.eventType === 'INSERT') {
          fetchOrders(); // הזמנה חדשה הגיעה מהצ'אט
          toast.success("הזמנה חדשה נולדה בצ'אט! 🏗️");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 3. עדכון סטטוס אופטימי (Optimistic Update)
  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    // עדכון מקומי מיידי לחוויית משתמש חלקה
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      setOrders(previousOrders); // Rollback במקרה של שגיאה
      toast.error("עדכון סטטוס נכשל");
    } else {
      toast.success(`הסטטוס הועבר ל: ${STATUS_MAP[nextStatus].label}`);
    }
  };

  // 4. מנוע ה-PDF
  const exportToPDF = async (order: any) => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);
    const toastId = toast.loading("מייצר תעודה דיגיטלית...");

    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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

  const filteredOrders = orders.filter(o => 
    o.vip_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.slice(-6).includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header & Status Indicator */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-6 z-10">
           <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl relative">
              <ShoppingBag size={32} />
              {isLive && <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />}
           </div>
           <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-slate-900 flex items-center gap-3">
                מרכז הזמנות VIP
                {isLive && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5 font-black uppercase tracking-widest"><Activity size={10}/> Live Sync</span>}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Saban Logistics Master Bridge</p>
           </div>
        </div>
        
        <div className="w-full md:w-[450px] relative group z-10">
           <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
           <input 
             placeholder="חפש קבלן, פרויקט או מספר פקודה..." 
             value={searchTerm} 
             onChange={(e) => setSearchTerm(e.target.value)} 
             className="w-full bg-slate-50 border-none pr-16 pl-6 py-5 rounded-3xl font-bold shadow-inner outline-none focus:ring-4 ring-blue-500/10 transition-all text-sm italic" 
           />
        </div>
      </div>

      {/* Orders Dynamic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.03 }}
              key={order.id}
              className="bg-white rounded-[45px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col border-t-[10px] border-t-slate-100 hover:border-t-blue-600 group"
            >
              <div className="p-8 flex-1">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none italic">PKD: {order.id.slice(-6)}</span>
                      <h3 className="text-2xl font-black text-slate-900 italic tracking-tight truncate mt-1 max-w-[180px]">{order.vip_profiles?.full_name}</h3>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase flex items-center gap-2 shadow-sm ${STATUS_MAP[order.status as OrderStatus].color}`}>
                      {React.createElement(STATUS_MAP[order.status as OrderStatus].icon, { size: 14 })}
                      {STATUS_MAP[order.status as OrderStatus].label}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 italic"><MapPin size={16} className="text-blue-500" /> {order.vip_profiles?.main_project}</div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Payload</span>
                          <div className="flex items-center gap-2 text-sm font-black text-slate-800 italic"><Scale size={14} className="text-blue-500" /> {order.total_weight} KG</div>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Last Update</span>
                          <div className="flex items-center gap-2 text-sm font-black text-slate-800 italic"><Clock size={14} className="text-blue-500" /> {new Date(order.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-6 bg-slate-50/80 flex gap-3 border-t border-slate-100">
                 <button 
                    onClick={() => setSelectedOrder(order)} 
                    className="flex-1 bg-slate-950 text-white py-5 rounded-[25px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl active:scale-95 border-b-4 border-slate-800 hover:border-blue-800"
                 >
                    <FileText size={18} /> פרטים והדפסה
                 </button>
                 <div className="relative group/menu">
                    <button className="h-14 w-14 bg-white border-2 border-slate-200 rounded-[25px] flex items-center justify-center text-slate-500 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm active:scale-90">
                       <MoreVertical size={24} />
                    </button>
                    {/* Status Instant Switcher */}
                    <div className="absolute bottom-full left-0 mb-4 w-56 bg-white rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all p-3 z-50 transform origin-bottom-left translate-y-2 group-hover/menu:translate-y-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-2 px-3 tracking-widest italic">Change Dispatch Status</p>
                       {(Object.keys(STATUS_MAP) as OrderStatus[]).map((st) => (
                         <button 
                           key={st} 
                           onClick={() => updateStatus(order.id, st)} 
                           className={`w-full text-right p-4 hover:bg-blue-50 hover:text-blue-600 rounded-2xl text-[11px] font-black uppercase transition-all mb-1 flex items-center justify-between ${order.status === st ? 'bg-blue-50 text-blue-600' : ''}`}
                         >
                           {STATUS_MAP[st].label}
                           {order.status === st && <CheckCircle2 size={14}/>}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- Detailed Drawer & PDF Capture Area --- */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-950/75 backdrop-blur-xl" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
              
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                 <div className="text-right">
                    <h2 className="text-2xl font-black italic uppercase leading-none tracking-tighter">פקודת ביצוע לוגיסטי</h2>
                    <p className="text-blue-400 text-[10px] font-bold uppercase mt-2 tracking-[0.2em] flex items-center gap-2 justify-end">
                       <ShieldCheck size={14}/> Verified Order Entry
                    </p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all active:scale-90"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#FDFDFD] scrollbar-hide">
                <div ref={printRef} className="p-12 bg-white min-h-full" dir="rtl">
                  {/* PDF Branding */}
                  <div className="flex justify-between items-center border-b-8 border-slate-900 pb-10 mb-12">
                     <div className="w-24 h-24 bg-slate-50 rounded-[30px] p-3 border-2 border-slate-100 flex items-center justify-center shadow-inner">
                        <img src="/ai.png" alt="Saban" className="w-full h-full object-contain" />
                     </div>
                     <div className="text-right">
                        <h1 className="text-4xl font-black italic leading-none text-slate-900 uppercase">ח. סבן</h1>
                        <p className="font-extrabold text-slate-500 mt-2 text-sm uppercase italic tracking-widest">חומרי בניין | החרש 10, הוד השרון</p>
                        <p className="font-bold text-blue-600 mt-1 text-xs">09-7402575 | www.saban-building.co.il</p>
                     </div>
                  </div>

                  {/* Summary Box */}
                  <div className="grid grid-cols-2 gap-10 mb-12 bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                     <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
                     <div className="space-y-2 relative">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">שם קבלן / לקוח</p>
                        <p className="font-black text-xl text-slate-900 italic leading-none">{selectedOrder.vip_profiles?.full_name}</p>
                     </div>
                     <div className="space-y-2 text-left relative">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">מספר הזמנה</p>
                        <p className="font-black text-xl text-slate-900 italic leading-none tracking-tighter">#{selectedOrder.id.slice(-6)}</p>
                     </div>
                     <div className="space-y-2 relative">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">פרויקט פעיל</p>
                        <p className="font-bold text-slate-700">{selectedOrder.vip_profiles?.main_project}</p>
                     </div>
                     <div className="space-y-2 text-left relative">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">מועד הנפקה</p>
                        <p className="font-bold text-slate-700">{new Date(selectedOrder.created_at).toLocaleDateString('he-IL')}</p>
                     </div>
                  </div>

                  {/* Products Table */}
                  <div className="space-y-6">
                     <h4 className="font-black text-slate-900 border-b-2 border-slate-100 pb-3 italic flex items-center gap-3 uppercase tracking-tighter text-lg">
                        <Package size={22} className="text-blue-600" /> מפרט ציוד להעמסה:
                     </h4>
                     <div className="space-y-3">
                        {selectedOrder.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm group hover:border-blue-100 transition-colors">
                             <div className="text-right">
                                <p className="font-black text-slate-800 text-lg leading-tight">{item.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase italic mt-1 tracking-widest">Identification: {item.sku || 'N/A'}</p>
                             </div>
                             <div className="flex items-center gap-5">
                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Units</span>
                                <span className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-b-4 border-slate-700 group-hover:bg-blue-600 group-hover:border-blue-800 transition-all">
                                   {item.qty}
                                </span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* PDF Footer Logistics */}
                  <div className="mt-14 pt-10 border-t-4 border-double border-slate-100 flex justify-between items-end">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-3">Shipment Capacity</p>
                        <div className="flex items-center gap-4 bg-slate-900 text-white px-6 py-4 rounded-[25px] shadow-xl border-b-4 border-slate-700">
                           <Scale size={28} className="text-blue-400" />
                           <h5 className="text-4xl font-black italic">{selectedOrder.total_weight} <span className="text-sm font-bold opacity-60">KG</span></h5>
                        </div>
                     </div>
                     <div className="text-left w-1/2">
                        <div className="space-y-8">
                           <div className="border-b-2 border-slate-200 pb-2 flex justify-between">
                              <span className="text-[10px] font-black text-slate-300 uppercase italic">Warehouse Approval</span>
                              <div className="h-4" />
                           </div>
                           <div className="border-b-2 border-slate-200 pb-2 flex justify-between">
                              <span className="text-[10px] font-black text-slate-300 uppercase italic">Driver Signature</span>
                              <div className="h-4" />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-10 border-t border-slate-100 bg-white grid grid-cols-2 gap-5 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                 <button 
                   onClick={() => exportToPDF(selectedOrder)} 
                   disabled={isGeneratingPDF} 
                   className="bg-slate-950 text-white py-6 rounded-[35px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all hover:bg-blue-600 disabled:opacity-50 border-b-8 border-slate-800 hover:border-blue-800 italic uppercase tracking-widest"
                 >
                    {isGeneratingPDF ? <RefreshCcw className="animate-spin" size={28} /> : <FileDown size={28} />} 
                    הפק PDF
                 </button>
                 <button 
                   onClick={() => window.print()} 
                   className="bg-slate-100 text-slate-400 py-6 rounded-[35px] font-black text-lg flex items-center justify-center gap-4 hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95 italic"
                 >
                    <Printer size={28} /> הדפסה מהירה
                 </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global CSS for Print */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: absolute; left: 0; top: 0; width: 100%; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
