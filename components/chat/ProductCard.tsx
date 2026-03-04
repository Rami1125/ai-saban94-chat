"use client";
import React from "react";
import { motion } from "framer-motion";
import { Clock, Calculator, MessageCircle } from "lucide-react";
import { Product } from "@/types"; 
import { useChatActions } from "@/context/ChatActionsContext"; 

export function ProductCard({ product }: { product: Product }) {
  const { handleConsult } = useChatActions();

  const onAction = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleConsult(product, type);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border rounded-[25px] overflow-hidden shadow-sm p-4 w-full">
      <h3 className="font-black text-slate-900 dark:text-white mb-2">{product.product_name}</h3>
      <div className="flex gap-2 mb-4">
        <button onClick={(e) => onAction(e, "זמן ייבוש")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px]">
          <Clock size={14} className="mx-auto mb-1 text-orange-500" /> זמן ייבוש
        </button>
        <button onClick={(e) => onAction(e, "חישוב")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px]">
          <Calculator size={14} className="mx-auto mb-1 text-blue-500" /> חישוב כמויות
        </button>
      </div>
      <button 
        onClick={(e) => onAction(e, "ייעוץ")}
        className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
      >
        התייעצות כללית
      </button>
    </div>
  );
}
