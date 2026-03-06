"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Package, Share2, CheckCircle2, Send, Ruler, Smartphone } from "lucide-react";

export function ActionOverlays() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  useEffect(() => {
const handleProductShare = async () => {
  const messageData = {
    to: "972508861080", // המספר המעודכן שביקשת
    text: `🏗️ *ח. סבן - כרטיס מוצר*\n*מוצר:* ${product?.product_name}\n*מחיר:* ${product?.price}₪`,
    timestamp: Date.now(),
    type: "product_card"
  };

  // דחיפה ל-Firebase
  await push(ref(rtdb, 'saban94/send'), messageData);
  setStatus("success");
};
    window.addEventListener('open-action-overlay', handleOpen);
    return () => window.removeEventListener('open-action-overlay', handleOpen);
  }, []);

  if (!activeType) return null;

  const close = () => { setActiveType(null); setProduct(null); };
  const productName = product?.product_name || product?.name || "מוצר כללי";

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[150] flex justify-end" dir="rtl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div key={`${activeType}-${productName}`} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200">
          
          <header className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
            <h2 className="text-xl font-black flex items-center gap-2 italic">
              {activeType === "share_product" && <><Share2 className="text-emerald-600" size={22} /> שליחת כרטיס מוצר</>}
              {activeType === "quote" && <><Calculator className="text-blue-600" size={22} /> הצעת מחיר</>}
              {activeType === "calculator" && <><Ruler className="text-indigo-600" size={22} /> מחשבון כמויות</>}
            </h2>
            <button onClick={close} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            {status === "success" ? (
              <SuccessState close={close} />
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="p-5 bg-blue-50/50 rounded-[24px] border border-blue-100">
                  <span className="text-[10px] font-black text-blue-600 uppercase block mb-1">מוצר נבחר</span>
                  <h4 className="font-black text-slate-900 text-lg leading-tight">{productName}</h4>
                </div>

                {activeType === "share_product" && (
                  <div className="space-y-6">
                    <div className="bg-zinc-50 p-6 rounded-[32px] border-2 border-dashed border-zinc-200 text-center">
                       {product?.image_url && <img src={product.image_url} className="w-24 h-24 mx-auto mb-4 object-contain" />}
                       <p className="text-sm font-bold text-slate-600 italic">הכרטיס יכלול: שם, מחיר וקישור להזמנה</p>
                    </div>
                    <button 
                      onClick={() => setStatus("success")}
                      className="w-full py-5 bg-[#25D366] text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-green-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Smartphone size={20} /> שלח כרטיס לווטסאפ של הלקוח
                    </button>
                  </div>
                )}

                {/* כאן יבואו שאר ה-Types (quote, calculator) */}
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
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
      <h3 className="text-2xl font-black mb-2">בוצע בהצלחה!</h3>
      <p className="text-slate-500 text-sm mb-12">הכרטיס נשלח דרך הצינור של JONI.</p>
      <button onClick={close} className="w-full py-4 border-2 rounded-2xl font-black text-slate-600">סגור</button>
    </div>
  );
}
