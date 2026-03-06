"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Package, Share2, CheckCircle2, Send, Ruler, Smartphone } from "lucide-react";
import { rtdb } from "@/lib/firebase";
import { ref, push } from "firebase/database";

export function ActionOverlays() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  // שימוש ב-useCallback כדי למנוע את שגיאת ה-Reference
  const handleOpen = useCallback((e: any) => {
    const data = e.detail;
    if (data) {
      setProduct(data.product || null);
      setActiveType(data.type);
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    // הוספת המאזין רק כשהקומפוננטה עולה
    window.addEventListener('open-action-overlay', handleOpen);
    
    // ניקוי המאזין כשהקומפוננטה יורדת למניעת כפילויות ושגיאות זיכרון
    return () => {
      window.removeEventListener('open-action-overlay', handleOpen);
    };
  }, [handleOpen]);

  if (!activeType) return null;

  const close = () => {
    setActiveType(null);
    setProduct(null);
  };

  const productName = product?.product_name || product?.name || "מוצר כללי";

  // פונקציית השליחה לווטסאפ דרך הצינור של JONI
  const sendToWhatsApp = async () => {
    try {
      const messageData = {
        to: "972508861080", // המספר שביקשת
        text: `🏗️ *ח. סבן - כרטיס מוצר*\n\n*מוצר:* ${productName}\n*מחיר:* ${product?.price || 'לפי פנייה'}₪\n\nשלום רב, מצורפים פרטים לבקשתך. נשמח לעמוד לשירותך.`,
        timestamp: Date.now(),
        type: "product_card"
      };

      await push(ref(rtdb, 'saban94/send'), messageData);
      setStatus("success");
    } catch (error) {
      console.error("שגיאה בשליחה ל-Firebase:", error);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[150] flex justify-end" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={close} 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        />
        
        <motion.div 
          key={`${activeType}-${productName}`} 
          initial={{ x: "100%" }} 
          animate={{ x: 0 }} 
          exit={{ x: "100%" }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200"
        >
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
                  <span className="text-[10px] font-black text-blue-600 uppercase block mb-1 tracking-widest text-center">מוצר מזוהה בשיחה</span>
                  <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight text-center">{productName}</h4>
                </div>

                {activeType === "share_product" && (
                  <div className="space-y-6">
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                       {product?.image_url && (
                         <img src={product.image_url} className="w-24 h-24 mx-auto mb-4 object-contain" alt={productName} />
                       )}
                       <p className="text-sm font-bold text-slate-600 dark:text-slate-400 italic">הכרטיס יישלח אוטומטית ללקוח דרך JONI</p>
                    </div>
                    <button 
                      onClick={sendToWhatsApp}
                      className="w-full py-5 bg-[#25D366] text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-green-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Smartphone size={20} /> שלח למספר 1080 בווטסאפ
                    </button>
                  </div>
                )}

                {/* כאן ניתן להוסיף לוגיקה ל-quote ו-calculator באותו מבנה */}
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

function SuccessState({ close }: { close: () => void }) {
  return (
    <div className="text-center py-12 animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <CheckCircle2 size={40} />
      </div>
      <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">בוצע בהצלחה!</h3>
      <p className="text-slate-500 text-sm mb-12 font-medium">כרטיס המוצר נדחף לצינור השליחה של JONI.</p>
      <button onClick={close} className="w-full py-4 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl font-black text-slate-600 dark:text-slate-400">
        סגור וחזור לצ'אט
      </button>
    </div>
  );
}
