"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler, Calculator } from "lucide-react";

export function ActionOverlays() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    const handleOpen = (e: any) => {
      setActiveType(e.detail.type);
      setProduct(e.detail.product || null); // קבלת לוח הגבס מה-Event
    };
    window.addEventListener('open-action-overlay', handleOpen);
    return () => window.removeEventListener('open-action-overlay', handleOpen);
  }, []);

  if (!activeType) return null;

  // חילוץ שם המוצר: אם אין מוצר ב-Context, נשתמש בברירת מחדל
  const productName = product?.product_name || product?.name || "מוצר נבחר";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex justify-end" dir="rtl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveType(null)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <motion.div 
          key={productName} // רענון הרכיב כששם המוצר משתנה
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-s"
        >
          <header className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h2 className="font-black text-lg flex items-center gap-2">
              {activeType === "calculator" ? "מחשבון כמויות" : "הצעת מחיר"}
              <Ruler size={18} className="text-indigo-600" />
            </h2>
            <button onClick={() => setActiveType(null)}><X size={20} /></button>
          </header>

          <div className="p-6 space-y-6">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 block mb-1 uppercase tracking-tighter">מזהה מוצר בשיחה:</span>
              <h4 className="font-black text-slate-900 text-lg leading-tight">{productName}</h4>
            </div>
            
            {/* כאן יבוא שאר המחשבון... */}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
