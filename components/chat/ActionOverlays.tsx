"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Package, Headset, CheckCircle2, Send, Ruler } from "lucide-react";
import { CalculatorOverlay } from "./CalculatorOverlay";

export function ActionOverlays() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  useEffect(() => {
    const handleOpen = (e: any) => {
      // 1. קודם כל מאפסים את המדינה (State) כדי למנוע "שאריות"
      setStatus("idle");
      
      // 2. מעדכנים את המוצר החדש (למשל לוח גבס)
      const newProduct = e.detail.product || null;
      setProduct(newProduct);
      setActiveType(e.detail.type);

      console.log("סנכרון מוצר חדש:", newProduct?.product_name);
    };

    window.addEventListener('open-action-overlay', handleOpen);
    return () => window.removeEventListener('open-action-overlay', handleOpen);
  }, []);

  if (!activeType) return null;

  const close = () => {
    setActiveType(null);
    setProduct(null);
  };

  // חילוץ שם המוצר בצורה בטוחה
  const currentProductName = product?.product_name || product?.name || "מוצר כללי";

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[150] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close} 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        />

        <motion.div 
          {/* ה-key כאן הוא הקסם: ברגע שהשם משתנה, כל הדף מתרענן */}
          key={`${activeType}-${currentProductName}`} 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200 dark:border-zinc-800"
          dir="rtl"
        >
          <header className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {activeType === "quote" && <><Calculator className="text-blue-600" size={20} /> הצעת מחיר</>}
              {activeType === "inventory" && <><Package className="text-emerald-600" size={20} /> בדיקת מלאי</>}
              {activeType === "calculator" && <><Ruler className="text-indigo-600" size={20} /> מחשבון כמויות</>}
            </h2>
            <button onClick={close} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            {status === "success" ? (
              <SuccessState close={close} />
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* כרטיס המוצר המעודכן - תמיד יציג את מה שמופיע ב-State */}
                <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-[24px] border border-blue-100 dark:border-blue-900/30">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">מוצר נבחר</span>
                  <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">
                    {currentProductName}
                  </h4>
                </div>

                {activeType === "calculator" && (
                  <CalculatorOverlay product={product} onSuccess={() => setStatus("success")} />
                )}

                {activeType === "quote" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-black text-slate-700 dark:text-slate-300">כמות מבוקשת (יחידות/שקים)</label>
                      <input 
                        type="number" 
                        placeholder="כמה יחידות נדרשות?" 
                        className="w-full p-5 bg-white dark:bg-zinc-900 rounded-[20px] border-2 border-slate-100 dark:border-zinc-800 outline-none focus:border-blue-600 transition-all text-xl font-bold"
                      />
                    </div>
                    <button 
                      onClick={() => setStatus("success")} 
                      className="w-full py-5 bg-[#0B2C63] text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-blue-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Send size={20} /> שלח הצעה עבור {currentProductName}
                    </button>
                  </div>
                )}
                
                {/* כאן אפשר להוסיף את שאר ה-Types באותו אופן */}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SuccessState({ close }: any) {
  return (
    <div className="text-center py-12 animate-in zoom-in-95 duration-300">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <CheckCircle2 size={48} />
      </div>
      <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">נשלח בהצלחה!</h3>
      <p className="text-slate-500 text-sm mb-12 font-medium italic">הבקשה שלך בדרך לרמי. נחזור אליך בהקדם.</p>
      <button onClick={close} className="w-full py-4 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl font-black text-slate-600 dark:text-slate-400">
        חזרה לצ'אט
      </button>
    </div>
  );
}
