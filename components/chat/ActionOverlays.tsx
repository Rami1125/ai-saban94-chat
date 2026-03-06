"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Package, Headset, CheckCircle2, Send, Ruler, Info } from "lucide-react";
import { CalculatorOverlay } from "./CalculatorOverlay";

export function ActionOverlays() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  useEffect(() => {
    const handleOpen = (e: any) => {
      // וידוא שהנתונים מגיעים נכון מה-Event
      const data = e.detail;
      setActiveType(data.type);
      setProduct(data.product || null);
      setStatus("idle");
      
      // דיבאג מהיר לקונסול (תוכל למחוק אחרי הבדיקה)
      console.log("Overlay opened with product:", data.product);
    };

    window.addEventListener('open-action-overlay', handleOpen);
    return () => window.removeEventListener('open-action-overlay', handleOpen);
  }, []);

  if (!activeType) return null;

  const close = () => {
    setActiveType(null);
    setProduct(null);
  };

  // חילוץ שם המוצר בצורה בטוחה מכל שדה אפשרי
  const productName = product?.product_name || product?.name || product?.metadata?.name || "סיקה סרם 500";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex justify-end">
        {/* Overlay רקע */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close} 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        />

        {/* פאנל צידי */}
        <motion.div 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200 dark:border-zinc-800"
          dir="rtl"
        >
          {/* Header */}
          <header className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {activeType === "quote" && <><Calculator className="text-blue-600" size={20} /> הצעת מחיר</>}
              {activeType === "inventory" && <><Package className="text-emerald-600" size={20} /> בדיקת מלאי</>}
              {activeType === "calculator" && <><Ruler className="text-indigo-600" size={20} /> מחשבון כמויות</>}
              {activeType === "support" && <><Headset className="text-orange-600" size={20} /> ייעוץ טכני</>}
            </h2>
            <button onClick={close} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {status === "success" ? (
              <SuccessState close={close} />
            ) : (
              <div className="space-y-8">
                {/* הצגת המוצר הנבחר בראש כל דף (חוץ ממצב הצלחה) */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm shrink-0 border border-slate-100">
                    <img 
                      src={product?.image_url || "/placeholder-product.png"} 
                      className="w-full h-full object-contain" 
                      alt={productName} 
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">מוצר נבחר</span>
                    <h4 className="font-black text-slate-900 dark:text-white leading-tight">{productName}</h4>
                  </div>
                </div>

                {/* תוכן דינמי לפי סוג הפעולה */}
                {activeType === "calculator" && (
                  <CalculatorOverlay product={product} onSuccess={() => setStatus("success")} />
                )}
                
                {activeType === "quote" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-4">
                      <label className="block text-sm font-black">כמות מבוקשת (יחידות/שקים)</label>
                      <input type="number" placeholder="כמה שקים תרצה?" className="w-full p-5 bg-slate-50 dark:bg-zinc-900 rounded-[20px] border-2 border-transparent focus:border-blue-600 outline-none transition-all font-bold text-xl" />
                    </div>
                    <button 
                      onClick={() => setStatus("success")} 
                      className="w-full py-5 bg-[#0B2C63] text-white rounded-[24px] font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      שליחת בקשה לרמי <Send size={20} />
                    </button>
                  </div>
                )}

                {activeType === "inventory" && (
                  <div className="space-y-6 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Package size={36} /></div>
                    <div className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-[32px] border border-emerald-100 dark:border-emerald-900/30 space-y-4">
                       <div className="flex justify-between items-center"><span className="text-sm font-bold">סטטוס מלאי:</span> <span className="text-emerald-600 font-black italic">זמין במחסן</span></div>
                       <div className="flex justify-between items-center"><span className="text-sm font-bold">מיקום:</span> <span className="font-bold text-slate-700 dark:text-slate-300">טייבה (סניף ראשי)</span></div>
                    </div>
                    <button onClick={() => setStatus("success")} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-lg">שריין לי במלאי</button>
                  </div>
                )}

                {activeType === "support" && (
                  <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto"><Headset size={36} /></div>
                    <p className="text-sm text-slate-500 font-medium">נציג מומחה של ח. סבן יחזור אליך תוך פחות מ-15 דקות לייעוץ טכני מלא.</p>
                    <button onClick={() => setStatus("success")} className="w-full py-5 bg-orange-600 text-white rounded-[24px] font-black shadow-lg flex items-center justify-center gap-2">דבר עם נציג עכשיו <Send size={18} /></button>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="p-4 bg-slate-50 dark:bg-zinc-900 border-t text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">SABAN BUILDING MATERIALS 1994</p>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SuccessState({ close }: any) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <CheckCircle2 size={48} />
      </div>
      <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">הבקשה בדרך!</h3>
      <p className="text-slate-500 text-sm mb-12 italic leading-relaxed">תודה רבה. רמי סבן קיבל את פנייתך ויחזור אליך בהקדם עם כל הפרטים.</p>
      <button onClick={close} className="w-full py-4 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all">חזרה לצ'אט</button>
    </motion.div>
  );
}
