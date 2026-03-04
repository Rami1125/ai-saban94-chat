"use client";
import React from "react";
import { motion } from "framer-motion";
import { Clock, Calculator, MessageCircle } from "lucide-react";
import { Product } from "../../types"; // תיקון נתיב
import { useChatActions } from "../../context/ChatActionsContext"; // תיקון נתיב
import { formatPrice } from "../../utils/chat-helpers"; // תיקון נתיב

export function ProductCard({ product }: { product: Product }) {
  const { handleConsult } = useChatActions();

  const onAction = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleConsult(product, type);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[35px] overflow-hidden shadow-xl max-w-[320px] transition-all"
      dir="rtl"
    >
      <div className="w-full h-44 bg-slate-50 relative p-4 flex items-center justify-center">
        <img src={product.image_url} alt={product.product_name} className="max-h-full object-contain" />
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 leading-tight h-12 overflow-hidden">
          {product.product_name}
        </h3>
        <p className="text-blue-600 font-black text-xl mb-4">{formatPrice(product.price)}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button 
            onClick={(e) => onAction(e, "זמן ייבוש")}
            className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 transition-colors"
          >
            <Clock size={16} className="text-orange-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-400">זמן ייבוש</span>
            <span className="text-[11px] font-black">{product.drying_time || "24 שעות"}</span>
          </button>
          
          <button 
            onClick={(e) => onAction(e, "חישוב כמויות")}
            className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 transition-colors"
          >
            <Calculator size={16} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-400">כיסוי</span>
            <span className="text-[11px] font-black">{product.coverage || "לפי מפרט"}</span>
          </button>
        </div>

        <button 
          onClick={(e) => onAction(e, "ייעוץ כללי")}
          className="w-full py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
        >
          <MessageCircle size={18} />
          התייעצות כאן
        </button>
      </div>
    </motion.div>
  );
}
