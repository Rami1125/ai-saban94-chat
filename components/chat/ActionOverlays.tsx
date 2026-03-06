"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, Package, Headset, CheckCircle2, Send, Calendar, Clock, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  const close = () => { setActiveType(null); setProduct(null); };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close} className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        />

        <motion.div 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200 dark:border-zinc-800"
          dir="rtl"
        >
          {/* HEADER */}
          <header className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {activeType === "quote" && <><Calculator className="text-blue-600" /> הצעת מחיר מדויקת</>}
              {activeType === "inventory" && <><Package className="text-emerald-600" /> בדיקת זמינות מלאי</>}
              {activeType === "support" && <><Headset className="text-orange-600" /> שיחה עם נציג</>}
            </h2>
            <button onClick={close} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            {status === "success" ? (
              <SuccessState type={activeType} close={close} />
            ) : (
              <>
                {activeType === "quote" && <QuoteForm product={product} onSuccess={() => setStatus("success")} />}
                {activeType === "inventory" && <InventoryCheck product={product} onSuccess={() => setStatus("success")} />}
                {activeType === "support" && <SupportRequest onSuccess={() => setStatus("success")} />}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// --- תתי רכיבים לכל דף ---

function QuoteForm({ product, onSuccess }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
        <p className="text-xs font-bold text-blue-700">מוצר נבחר:</p>
        <h4 className="font-black text-slate-900">{product?.product_name || "כללי"}</h4>
      </div>
      <div className="grid gap-4">
        <label className="block space-y-2">
          <span className="text-sm font-bold">כמות מבוקשת</span>
          <input type="number" placeholder="לדוגמה: 20" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none focus:ring-2 ring-blue-500" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-bold">כתובת למשלוח (אופציונלי)</span>
          <input type="text" placeholder="עיר/אתר בנייה" className="w-full p-4 bg-slate-50 rounded-2xl border outline-none focus:ring-2 ring-blue-500" />
        </label>
      </div>
      <button onClick={onSuccess} className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black mt-8 flex items-center justify-center gap-2">
        שליחת בקשה להצעה <Send size={18} />
      </button>
    </div>
  );
}

function InventoryCheck({ product, onSuccess }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Package size={40} />
        </div>
        <h3 className="font-black text-lg">בדיקת מלאי אוטומטית</h3>
        <p className="text-sm text-slate-500">המערכת סורקת את המחסן עבור: <b>{product?.product_name}</b></p>
      </div>
      <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
        <div className="flex justify-between items-center text-sm font-bold">
          <span>סטטוס במערכת:</span>
          <span className="text-emerald-600 italic">זמין במלאי (טייבה)</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold">
          <span>זמן אספקה משוער:</span>
          <span className="text-slate-700">עד 24 שעות</span>
        </div>
      </div>
      <button onClick={onSuccess} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black mt-8">
        עדכן אותי כשהנהג יוצא
      </button>
    </div>
  );
}

function SupportRequest({ onSuccess }: any) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 leading-relaxed">השאר פרטים ונציג מכירות של <b>ח. סבן</b> יחזור אליך תוך מספר דקות לתיאום סופי.</p>
      <input type="text" placeholder="שם מלא" className="w-full p-4 bg-slate-50 rounded-2xl border" />
      <input type="tel" placeholder="מספר טלפון לחזרה" className="w-full p-4 bg-slate-50 rounded-2xl border" />
      <button onClick={onSuccess} className="w-full py-5 bg-orange-600 text-white rounded-[24px] font-black">
        שלח בקשה לשיחה
      </button>
    </div>
  );
}

function SuccessState({ type, close }: any) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={48} />
      </div>
      <h3 className="text-2xl font-black mb-2">הבקשה התקבלה!</h3>
      <p className="text-slate-500 text-sm mb-12">צוות ח. סבן כבר מטפל בפנייה שלך.</p>
      <button onClick={close} className="w-full py-4 border-2 border-slate-200 rounded-2xl font-bold">סגור חלוץ</button>
    </motion.div>
  );
}
