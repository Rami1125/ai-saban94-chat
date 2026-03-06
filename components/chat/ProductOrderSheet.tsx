"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, ShoppingCart, Plus, Minus, Truck, ShieldCheck, Star } from "lucide-react";

export function ProductOrderSheet() {
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("בוקר (07:00-12:00)");

  useEffect(() => {
    const handleOpen = (e: any) => {
      setProduct(e.detail);
      setQuantity(1);
    };
    window.addEventListener('open-product-sheet', handleOpen);
    return () => window.removeEventListener('open-product-sheet', handleOpen);
  }, []);

  if (!product) return null;

  const totalPrice = product.price * quantity;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Overlay חשוך */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setProduct(null)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* הדף עצמו */}
        <motion.div 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col border-s border-slate-200 dark:border-zinc-800"
          dir="rtl"
        >
          {/* Header */}
          <header className="p-6 border-b flex justify-between items-center bg-slate-50 dark:bg-zinc-900">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">סיכום הזמנה</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">ח. סבן - אספקה מהירה</p>
            </div>
            <button onClick={() => setProduct(null)} className="p-3 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-500">
              <X size={24} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {/* כרטיס מוצר ויזואלי */}
            <div className="flex gap-6 items-start">
              <div className="w-32 h-32 bg-slate-100 dark:bg-zinc-800 rounded-[24px] p-2 flex items-center justify-center border border-slate-200 dark:border-zinc-700">
                <img src={product.image_url} className="max-h-full max-w-full object-contain drop-shadow-md" alt={product.product_name} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-orange-500 mb-1">
                  <Star size={12} fill="currentColor" />
                  <span className="text-[10px] font-black italic uppercase">Premium Grade</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{product.product_name}</h3>
                <p className="text-sm text-slate-400 mt-1">מק"ט: {product.sku}</p>
                <p className="text-2xl font-black text-blue-600 mt-2">₪{product.price} <span className="text-xs text-slate-400 font-normal">ליחידה</span></p>
              </div>
            </div>

            {/* בחירת כמות עם UI משופר */}
            <div className="space-y-4">
              <label className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Plus className="text-blue-500" size={18} /> בחירת כמות
              </label>
              <div className="flex items-center gap-8 bg-slate-50 dark:bg-zinc-900 p-3 rounded-[24px] border border-slate-100 dark:border-zinc-800 w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-xl shadow-sm hover:scale-105 transition-transform"><Minus size={20}/></button>
                <span className="font-black text-3xl w-12 text-center text-slate-900 dark:text-white">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-md hover:scale-105 transition-transform"><Plus size={20}/></button>
              </div>
            </div>

            {/* לוגיסטיקה: תאריך ושעה */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500"/> תאריך אספקה
                </label>
                <input 
                  type="date" 
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  onChange={(e) => setDeliveryDate(e.target.value)} 
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock size={18} className="text-blue-500"/> שעת הגעה
                </label>
                <select 
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setDeliveryTime(e.target.value)}
                >
                  <option>בוקר (07:00-12:00)</option>
                  <option>צהריים (12:00-16:00)</option>
                  <option>אחר הצהריים (16:00-19:00)</option>
                </select>
              </div>
            </div>

            {/* הבטחות מותג */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-[32px] border border-blue-100 dark:border-blue-900/30 space-y-3">
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 text-xs font-bold">
                <Truck size={16} /> אספקה מיידית עם צי המפעל
              </div>
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 text-xs font-bold">
                <ShieldCheck size={16} /> אחריות מלאה של ח. סבן
              </div>
            </div>
          </div>

          {/* Footer Footer */}
          <footer className="p-8 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1 uppercase tracking-tighter">סה"כ לתשלום</span>
                <span className="text-4xl font-black text-slate-900 dark:text-white">₪{totalPrice.toLocaleString()}</span>
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">מע"מ כלול</span>
              </div>
            </div>
            <button className="w-full py-5 bg-[#0B2C63] hover:bg-[#153a7a] text-white rounded-[24px] font-black text-lg shadow-2xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 group active:scale-95">
              <ShoppingCart size={22} className="group-hover:rotate-12 transition-transform" />
              הוסף לסל וסיים הזמנה
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
