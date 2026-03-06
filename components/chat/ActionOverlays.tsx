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
      setActiveType(e.detail.type);
      setProduct(e.detail.product || null); // מקבל את האובייקט המלא (סיקה 500)
      setStatus("idle");
    };
    window.addEventListener('open-action-overlay', handleOpen);
    return () => window.removeEventListener('open-action-overlay', handleOpen);
  }, []);

  if (!activeType) return null;

  const close = () => { setActiveType(null); setProduct(null); };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200 dark:border-zinc-800" dir="rtl">
          
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
              <>
                {/* דף בדיקת מלאי מותאם מוצר */}
                {activeType === "inventory" && (
                  <div className="space-y-8 text-center">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse"><Package size={36} /></div>
                    <div>
                      <h3 className="text-xl font-black italic">בדיקת מלאי בזמן אמת</h3>
                      <p className="text-sm text-blue-600 font-bold mt-2">סורק נתונים עבור: {product?.product_name || "כללי"}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-3xl border border-emerald-100 space-y-3">
                      <div className="flex justify-between text-sm"><span className="font-bold">סטטוס:</span> <span className="text-emerald-600 font-black italic">זמין במלאי</span></div>
                      <div className="flex justify-between text-sm"><span className="font-bold">מחסן:</span> <span className="text-slate-700 dark:text-slate-300">טייבה (מרכזי)</span></div>
                    </div>
                    <button onClick={() => setStatus("success")} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black">שריין לי {product?.product_name}</button>
                  </div>
                )}

                {/* מחשבון כמויות מותאם מוצר */}
                {activeType === "calculator" && (
                  <CalculatorOverlay product={product} onSuccess={() => setStatus("success")} />
                )}

                {/* הצעת מחיר מותאמת מוצר */}
                {activeType === "quote" && (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100">
                      <span className="text-[10px] font-bold text-blue-600 uppercase">מוצר נבחר</span>
                      <h4 className="font-black text-slate-900 dark:text-white">{product?.product_name || "כללי"}</h4>
                    </div>
                    <input type="number" placeholder="כמות מבוקשת" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none focus:ring-2 ring-blue-500" />
                    <button onClick={() => setStatus("success")} className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black flex items-center justify-center gap-2 shadow-lg">שליחת בקשה לרמי <Send size={18} /></button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SuccessState({ close }: any) {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} /></div>
      <h3 className="text-2xl font-black mb-2">נשלח בהצלחה!</h3>
      <p className="text-slate-500 text-sm mb-12">הבקשה שלך התקבלה במוקד ח. סבן.</p>
      <button onClick={close} className="w-full py-4 border-2 border-slate-200 rounded-2xl font-black">חזרה לצ'אט</button>
    </div>
  );
}
