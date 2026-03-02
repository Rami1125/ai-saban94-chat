"use client";

import { motion } from "framer-motion";
import { ShoppingCart, CheckCircle } from 'lucide-react';

export const ProductCard = ({ product }: { product: any }) => {
  return (
    <motion.div
      whileHover={{ 
        boxShadow: "0 0 25px rgba(59, 130, 246, 0.3)",
        borderColor: "rgba(59, 130, 246, 0.5)"
      }}
      className="bg-white dark:bg-slate-900 border-2 border-slate-100 rounded-[35px] p-6 text-right w-[320px] shadow-2xl transition-colors"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-4">
        <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full italic">SABAN STUDIO</span>
        <span className="text-slate-400 text-[10px] font-mono">#{product.sku}</span>
      </div>
      
      <h3 className="text-xl font-black text-[#0B2C63] dark:text-white mb-2 leading-tight">
        {product.product_name}
      </h3>
      
      <div className="text-3xl font-black text-blue-600 mb-4">
        ₪{product.price} <span className="text-xs text-slate-400">+ מע"מ</span>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        className="w-full bg-[#0B2C63] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
      >
        <ShoppingCart size={18} /> הוספה לסל
      </motion.button>
    </motion.div>
  );
};
