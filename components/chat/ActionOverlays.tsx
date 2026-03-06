"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Package, CheckCircle2, Send, Ruler } from "lucide-react";

export function ActionOverlays() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  useEffect(() => {
    const handleOpen = (e: any) => {
      // אם המוצר מגיע כ-null, ננסה להבין למה
      if (!e.detail.product) {
        console.warn("שים לב: ה-Overlay נפתח ללא נתוני מוצר!");
      }
      
      setProduct(e.detail.product || null);
      setActiveType(e.detail.type);
      setStatus("idle");
    };

    window.addEventListener('open-action-overlay', handleOpen);
    return () => window.removeEventListener('open-action-overlay', handleOpen);
  }, []);

  if (!activeType) return null;

  const close = () => { setActiveType(null); setProduct(null); };

  // חילוץ שם בטוח - אם הכל נכשל, לפחות שלא יהיה כתוב "כללי"
  const productName = product?.product_name || product?.name || "מוצר נבחר";

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[150] flex justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        <motion.div 
          key={`${activeType}-${productName}`} // רענון הרכיב כששם המוצר משתנה
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200 dark:border-zinc-800"
          dir="rtl"
        >
          <header className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
            <h2 className="text-xl font-black flex items-center gap-2">
               {activeType === "quote" && <><Calculator className="text-blue-600" size={20} /> הצעת מחיר</>}
               {activeType === "calculator" && <><Ruler className="text-indigo-600" size={20} /> מחשבון כמויות</>}
            </h2>
            <button onClick={close} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 mb-8">
              <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">מזהה מוצר בשיחה:</span>
              <h4 className="font-black text-slate-900 dark:text-white text-lg">{productName}</h4>
            </div>

            {/* המשך הטפסים... */}
            {activeType === "quote" && (
              <div className="space-y-6">
                <input type="number" placeholder="כמות" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none font-bold" />
                <button onClick={() => setStatus("success")} className="w-full py-5 bg-[#0B2C63] text-white rounded-[24px] font-black shadow-lg flex items-center justify-center gap-2">
                  שלח בקשה עבור {productName} <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
