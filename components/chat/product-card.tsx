"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Calculator, Clock, ShieldCheck, Factory } from 'lucide-react';

export function ProductCard({ product }: { product: any }) {
  if (!product) return null;

  // חילוץ נתונים בצורה בטוחה מהאובייקט (מתאים ל-Supabase ול-Draft)
  const name = product.product_name || product.name || "מוצר ללא שם";
  const sku = product.sku || "N/A";
  const price = product.price;
  const image = product.image_url || product.image;
  const supplier = product.supplier_name || product.supplier || "ח. סבן";
  const coverage = product.coverage || "לפי מפרט";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(11, 44, 99, 0.15)",
      }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[35px] overflow-hidden text-right w-[320px] shadow-xl transition-all mb-4"
      dir="rtl"
    >
      {/* תמונת מוצר - אם קיימת */}
      {image ? (
        <div className="w-full h-48 bg-slate-50 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center p-4">
          <img 
            src={image} 
            alt={name} 
            className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal"
          />
          <div className="absolute top-4 left-4">
             <ShieldCheck size={20} className="text-blue-600 drop-shadow-sm" />
          </div>
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
          <ShieldCheck size={40} className="text-blue-200 dark:text-slate-700" />
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="bg-[#0B2C63] text-white text-[9px] font-black px-3 py-1 rounded-full italic uppercase tracking-wider">
            SABAN LOGISTICS
          </span>
          <span className="text-slate-400 text-[10px] font-mono font-bold tracking-widest">{sku}</span>
        </div>
        
        <h3 className="text-xl font-black text-[#0B2C63] dark:text-white mb-1 leading-tight">
          {name}
        </h3>

        <div className="flex items-center gap-1 text-slate-500 mb-4">
          <Factory size={12} />
          <span className="text-[10px] font-bold tracking-tight uppercase">{supplier}</span>
        </div>
        
        <div className="text-3xl font-black text-blue-600 mb-5 flex items-baseline gap-1">
          {price ? (
            <>
              <span className="text-lg">₪</span>{price}
              <span className="text-[10px] text-slate-400 font-bold mr-1">+ מע"מ</span>
            </>
          ) : (
            <span className="text-lg text-blue-500/70 italic">פנה להצעת מחיר</span>
          )}
        </div>

        {/* מפרט מהיר */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <Calculator size={14} className="mx-auto text-blue-500 mb-1"/>
            <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 italic leading-none">כיסוי: {coverage}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <Clock size={14} className="mx-auto text-orange-500 mb-1"/>
            <div className="text-[9px] font-black text-slate-600 dark:text-slate-400 italic leading-none">אספקה מהירה</div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full bg-[#0B2C63] hover:bg-blue-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all group"
        >
          <ShoppingCart size={18} className="group-hover:translate-x-1 transition-transform" /> 
          הוספה להזמנה
        </motion.button>
      </div>
    </motion.div>
  );
}
