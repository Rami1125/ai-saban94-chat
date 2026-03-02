"use client";

import { motion } from "framer-motion";
import { ShoppingCart, CheckCircle, Calculator, Clock } from 'lucide-react';

export function ProductCard({ product }: { product: any }) {
  if (!product) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)",
      }}
      className="bg-white dark:bg-slate-900 border-2 border-blue-500/10 rounded-[35px] p-6 text-right w-[320px] shadow-2xl transition-all"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-4">
        <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full italic uppercase tracking-tighter">
          SABAN STUDIO
        </span>
        <span className="text-slate-400 text-[10px] font-mono">#{product.sku || '000'}</span>
      </div>
      
      <h3 className="text-xl font-black text-[#0B2C63] dark:text-white mb-2 leading-tight">
        {product.product_name}
      </h3>
      
      <div className="text-3xl font-black text-blue-600 mb-4">
        ₪{product.price} <span className="text-xs text-slate-400 font-bold">+ מע"מ</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl text-center">
          <Calculator size={14} className="mx-auto text-blue-500 mb-1"/>
          <div className="text-[8px] font-black text-slate-600 italic">חישוב לפי שטח</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl text-center">
          <Clock size={14} className="mx-auto text-orange-500 mb-1"/>
          <div className="text-[8px] font-black text-slate-600 italic">אספקה מהירה</div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        className="w-full bg-[#0B2C63] hover:bg-blue-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-colors"
      >
        <ShoppingCart size={18} /> הוספה להזמנה
      </motion.button>
    </motion.div>
  );
}
