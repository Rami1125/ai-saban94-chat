"use client";

import React from "react";
import { motion } from "framer-motion";
import { SafeIcon } from "@/components/SafeIcon";
import { Product } from "@/types";
import { useChatActions } from "@/context/ChatActionsContext";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { handleConsult } = useChatActions();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[30px] overflow-hidden shadow-md hover:shadow-xl transition-all p-5 w-full max-w-sm group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <SafeIcon name="Package" size={24} />
        </div>
        <div className="text-left">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">SKU</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{product.sku}</span>
        </div>
      </div>

      <h3 className="font-black text-slate-900 dark:text-white text-base mb-2 leading-tight">
        {product.product_name}
      </h3>
      
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed">
        {product.description || "מידע טכני מפורט זמין במחסני סבן."}
      </p>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        {product.drying_time && (
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <SafeIcon name="Clock" size={14} className="text-orange-500 mb-1" />
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">זמן ייבוש</span>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{product.drying_time}</span>
          </div>
        )}
        
        {product.youtube_url ? (
          <a 
            href={product.youtube_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col items-center hover:bg-red-100 transition-colors"
          >
            <SafeIcon name="Youtube" size={14} className="text-red-600 mb-1" />
            <span className="text-[8px] text-red-400 font-bold uppercase tracking-tighter">וידאו</span>
            <span className="text-[10px] font-black text-red-700 dark:text-red-400">הדרכה טכנית</span>
          </a>
        ) : (
           <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center opacity-40 grayscale">
            <SafeIcon name="Calculator" size={14} className="text-slate-500 mb-1" />
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">חישוב</span>
            <span className="text-[10px] font-black text-slate-700">לפי מפרט</span>
          </div>
        )}
      </div>

      <button 
        onClick={() => handleConsult(product, "מפרט מלא וזמינות")}
        className="w-full py-3 bg-[#0B2C63] dark:bg-white dark:text-[#0B2C63] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-900/20"
      >
        התייעץ עם סבן AI
      </button>
    </motion.div>
  );
}
