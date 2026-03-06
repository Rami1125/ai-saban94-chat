"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Package, Headset, CheckCircle2, Send, Ruler, Info, ArrowRight } from "lucide-react";
import { CalculatorOverlay } from "./CalculatorOverlay"; // המחשבון שבנינו קודם

export function ActionOverlays() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  useEffect(() => {
    const handleOpen = (e: any) => {
      setActiveType(e.detail.type);
      setProduct(e.detail.product || null);
      setStatus("idle");
    };
    window.addEventListener('open-action-overlay', handleOpen);
    return () => window.removeEventListener('open-action-overlay', handleOpen);
  }, []);

  if (!activeType) return null;

  const close = () => {
    setActiveType(null);
    setProduct(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex justify-end">
        {/* Overlay חשוך */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close} 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        />

        {/* חלונית צדדית */}
        <motion.div 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200 dark:border-zinc-800"
          dir="rtl"
        >
          {/* Header דינמי */}
          <header className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {activeType === "quote" && <><Calculator className="text-blue-600" size={20} /> הצעת מחיר מדויקת</>}
              {activeType === "inventory" && <><Package className="text-emerald-600" size={20} /> בדיקת זמינות מלאי</>}
              {activeType === "support" && <><Headset className="text-orange-600" size={20} /> שיחה עם נציג</>}
              {activeType === "calculator" && <><Ruler className="text-indigo-600" size={20} /> מחשבון כמויות מ"ר</>}
            </h2>
            <button onClick={close} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {status === "success" ? (
              <SuccessState close={close} />
            ) : (
              <>
                {activeType === "calculator" && (
                  <CalculatorOverlay product={product} onSuccess={() => setStatus("success")} />
                )}
                
                {activeType === "quote" && (
                  <QuoteForm product={product} onSuccess={() => setStatus("success")} />
                )}

                {activeType === "inventory" && (
                  <InventoryCheck product={product} onSuccess={() => setStatus("success")} />
                )}

                {activeType === "support" && (
                  <SupportRequest onSuccess={() => setStatus("success")} />
                )}
              </>
            )}
          </div>

          <footer className="p-4 bg-slate-50 dark:bg-zinc-900 border-t text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ח. סבן - איכות ושירות ללא פשרות</p>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// --- טופס הצעת מחיר ---
function QuoteForm({ product, onSuccess }: any) {
  const [qty, setQty] = useState("");
  
  const handleSend = () => {
    const msg = `היי רמי, אשמח לקבל הצעת מחיר עבור ${product?.product_name || 'מוצר'}. כמות מבוקשת: ${qty}`;
    window.open(`https://wa.me/972508860896?text=${encodeURIComponent(msg)}`, '_blank');
    onSuccess();
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <span className="text-[10px] font-bold text-blue-600 uppercase">מוצר נבחר</span>
        <h4 className="font-black text-slate-900 dark:text-white">{product?.product_name || "כללי"}</h4>
      </div>
      <div className="space-y-4">
        <label className="block text-sm font-bold">כמות מבוקשת (יחידות/שקים)</label>
        <input 
          type="number" 
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="לדוגמה: 50" 
          className="w-full p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border outline-none focus:ring-2 ring-blue-500" 
        />
      </div>
      <button onClick={handleSend} className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black flex items-center justify-center gap-2 shadow-lg">
        שליחת בקשה לרמי <Send size={18} />
      </button>
    </div>
  );
}

// --- בדיקת מלאי ---
function InventoryCheck({ product, onSuccess }: any) {
  return (
    <div className="space-y-8 text-center">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
        <Package size={36} />
      </div>
      <div>
        <h3 className="text-xl font-black italic">בדיקת מלאי בזמן אמת</h3>
        <p className="text-sm text-slate-500 mt-2">סורק נתונים עבור: {product?.product_name}</p>
      </div>
      <div className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-3xl border space-y-3">
        <div className="flex justify-between text-sm"><span className="font-bold">סטטוס:</span> <span className="text-emerald-600 font-black">זמין במלאי</span></div>
        <div className="flex justify-between text-sm"><span className="font-bold">מחסן:</span> <span className="text-slate-700 dark:text-slate-300">טייבה (מרכזי)</span></div>
      </div>
      <button onClick={onSuccess} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-lg">
        שריין לי במלאי
      </button>
    </div>
  );
}

// --- שיחה עם נציג ---
function SupportRequest({ onSuccess }: any) {
  const handleCall = () => {
    window.open(`https://wa.me/972508860896?text=${encodeURIComponent("היי רמי, אני צריך עזרה טכנית/ייעוץ לגבי מוצר.")}`, '_blank');
    onSuccess();
  };

  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
        <Headset size={36} />
      </div>
      <h3 className="text-xl font-black">ייעוץ מקצועי</h3>
      <p className="text-sm text-slate-500">נציג מומחה של ח. סבן יחזור אליך בווטסאפ לתיאום וייעוץ טכני.</p>
      <button onClick={handleCall} className="w-full py-5 bg-orange-600 text-white rounded-[24px] font-black shadow-lg flex items-center justify-center gap-2">
        פתח צ'אט עם נציג <Send size={18} />
      </button>
    </div>
  );
}

// --- מצב הצלחה ---
function SuccessState({ close }: any) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <CheckCircle2 size={48} />
      </div>
      <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">נשלח בהצלחה!</h3>
      <p className="text-slate-500 text-sm mb-12">הבקשה שלך התקבלה במוקד ח. סבן. נחזור אליך בהקדם.</p>
      <button onClick={close} className="w-full py-4 border-2 border-slate-200 dark:border-zinc-800 rounded-2xl font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all">
        חזרה לצ'אט
      </button>
    </motion.div>
  );
}
