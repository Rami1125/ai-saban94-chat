"use client";

import React, { useState, useEffect, use } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Send, Database, ClipboardList, CheckCircle2, 
  AlertTriangle, Save, Loader2, User, 
  Package, History, ArrowLeftRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro V51.0 - Customer DNA & Double Injection
 * -------------------------------------------
 * - Feature: Input WhatsApp list -> Process AI -> Paste Delivery Note -> Auto-Learn Aliases.
 */

export default function CustomerOrderCanvas({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<any>(null);
  const [whatsappText, setWhatsappText] = useState("");
  const [deliveryNoteText, setDeliveryNoteText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderDraft, setOrderDraft] = useState<any[]>([]);

  // 1. שליפת פרופיל לקוח
  useEffect(() => {
    async function getProfile() {
      const { data } = await supabase.from('vip_profiles').select('*').eq('id', id).maybeSingle();
      setClient(data);
    }
    getProfile();
  }, [id]);

  // 2. פונקציית עיבוד רשימה גולמית (השלב הראשון)
  const processWhatsappList = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: whatsappText, 
          customerId: id,
          mode: 'parse_raw_list' // המוח ידע שזו רשימה לניתוח
        })
      });
      const data = await res.json();
      // המוח מחזיר רשימה של פריטים מזוהים ופריטים בספק
      setOrderDraft(data.items || []);
      toast.success("הרשימה פוענחה ב-DNA");
    } catch (e) { toast.error("שגיאה בפענוח"); }
    finally { setIsProcessing(false); }
  };

  // 3. פונקציית למידה (השלב השני - הזרקת תעודת משלוח)
  const learnFromDeliveryNote = async () => {
    const toastId = toast.loading("מצליב נתונים ומזריק לזיכרון...");
    try {
      // כאן ה-AI לוקח את הטקסט מהקומקס ומצליב אותו מול הווצאפ
      const { data: learningResult } = await supabase.rpc('learn_customer_patterns', {
        client_id: id,
        raw_whatsapp: whatsappText,
        delivery_note: deliveryNoteText
      });
      
      toast.success("ה-AI למד מוצרים חדשים! 🦾", { id: toastId });
      setWhatsappText("");
      setDeliveryNoteText("");
      setOrderDraft([]);
    } catch (e) { toast.error("שגיאה בסנכרון הלמידה", { id: toastId }); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 md:p-14 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header - Customer Info */}
        <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-blue-500 shadow-2xl">
                 <User size={32} />
              </div>
              <div className="text-right">
                 <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{client?.full_name || 'לקוח VIP'}</h1>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">ID: {id} | Project: {client?.main_project || 'כללי'}</p>
              </div>
           </div>
           <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
              <span className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 animate-pulse">
                <Sparkles size={14}/> AI Machine Learning Active
              </span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           
           {/* צד ימין - הזרקות (Injection Boxes) */}
           <div className="space-y-8">
              {/* תיבה 1: קלט ווצאפ */}
              <div className="bg-white rounded-[45px] p-8 shadow-lg border border-slate-100 space-y-6">
                 <div className="flex items-center gap-3 text-slate-800">
                    <ClipboardList className="text-blue-600" size={24} />
                    <h3 className="font-black text-lg italic uppercase">1. הזרקת רשימה מהשטח (WhatsApp)</h3>
                 </div>
                 <textarea 
                    value={whatsappText}
                    onChange={(e) => setWhatsappText(e.target.value)}
                    placeholder="הדבק כאן את הטקסט של תחסין..."
                    className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-[30px] p-6 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none"
                 />
                 <button 
                    onClick={processWhatsappList}
                    disabled={!whatsappText || isProcessing}
                    className="w-full bg-slate-900 text-white py-5 rounded-[25px] font-black uppercase tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    נתח רשימה במוח
                 </button>
              </div>

              {/* תיבה 2: הזרקת תעודת משלוח (למידה) */}
              <div className="bg-[#020617] rounded-[45px] p-8 shadow-2xl space-y-6 text-white">
                 <div className="flex items-center gap-3 text-blue-400">
                    <Database size={24} />
                    <h3 className="font-black text-lg italic uppercase">2. סגירת מעגל - הזרקת תעודת משלוח</h3>
                 </div>
                 <textarea 
                    value={deliveryNoteText}
                    onChange={(e) => setDeliveryNoteText(e.target.value)}
                    placeholder="הדבק כאן את המוצרים שיצאו בקומקס..."
                    className="w-full h-48 bg-white/5 border-2 border-white/10 rounded-[30px] p-6 font-bold text-blue-100 outline-none focus:border-blue-500 transition-all resize-none"
                 />
                 <button 
                    onClick={learnFromDeliveryNote}
                    disabled={!deliveryNoteText}
                    className="w-full bg-blue-600 text-white py-5 rounded-[25px] font-black uppercase tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
                 >
                    <ArrowLeftRight size={20} />
                    הזרק לזיכרון וסנכרן DNA 🦾
                 </button>
              </div>
           </div>

           {/* צד שמאל - תצוגת פענוח וכרטיס הזמנה */}
           <div className="bg-white rounded-[55px] p-10 shadow-2xl border border-slate-100 flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-4">
                    <History size={24} className="text-slate-400" />
                    <h3 className="text-xl font-black italic uppercase text-slate-800">טיוטת פקודת עבודה</h3>
                 </div>
                 <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full border border-blue-100 uppercase tracking-widest">Real-time Analysis</span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                 {orderDraft.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 space-y-4">
                      <Package size={64} strokeWidth={1} />
                      <p className="font-black uppercase tracking-widest italic text-xs text-center">הזרק רשימה מימין <br/>כדי להתחיל את תהליך הלימוד</p>
                   </div>
                 ) : orderDraft.map((item, idx) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                     key={idx} 
                     className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[28px] group hover:bg-white hover:shadow-lg transition-all"
                   >
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${item.sku ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {item.sku ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}
                         </div>
                         <div className="text-right">
                            <p className="font-black text-slate-800 leading-none">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Requested: {item.raw_name}</p>
                         </div>
                      </div>
                      <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black italic shadow-lg">
                         {item.qty}
                      </div>
                   </motion.div>
                 ))}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                 <button className="w-full bg-emerald-500 text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.3em] shadow-xl flex items-center justify-center gap-5 border-b-8 border-emerald-700 active:scale-95 transition-all italic">
                    <Save size={24} /> אשר רשימה והעבר לליקוט
                 </button>
              </div>
           </div>
        </div>
      </div>
      <footer className="py-20 text-center opacity-10 uppercase text-[12px] font-black tracking-[1.5em] text-slate-900">Saban OS Learning Engine V51.0</footer>
    </div>
  );
}
