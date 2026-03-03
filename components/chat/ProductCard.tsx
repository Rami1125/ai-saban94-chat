"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, MessageCircle, PlayCircle } from 'lucide-react';

export function ProductCard({ product, onConsult }: { product: any, onConsult?: (p: any, t: string) => void }) {
  const [showVideo, setShowVideo] = useState(false);
  if (!product) return null;

  // פונקציית הגנה חסינה
  const safeConsult = (p: any, t: string) => {
    if (typeof onConsult === "function") {
      onConsult(p, t);
    } else {
      console.error("❌ [סבן AI] onConsult אינו פונקציה:", onConsult, { product: p, type: t });
    }
  };

  return (
    <motion.div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-[30px] overflow-hidden w-full max-w-[320px] shadow-xl mx-auto mb-4" dir="rtl">
      {/* אזור תמונה/וידאו */}
      <div className="w-full h-40 bg-slate-100 relative">
        <img src={product.image_url || "https://placehold.co/400x400?text=Saban+AI"} className="w-full h-full object-contain p-4" alt={product.product_name} />
      </div>
      <div className="p-4 text-right">
        <h3 className="font-black text-[#0B2C63] text-lg mb-2">{product.product_name}</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => safeConsult(product, "זמן ייבוש")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
            <Clock size={14} className="mx-auto mb-1 text-orange-500" /> {product.drying_time || "24 שעות"}
          </button>
          <button onClick={() => safeConsult(product, "חישוב כמויות")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
            <Calculator size={14} className="mx-auto mb-1 text-blue-500" /> {product.coverage || "לפי מפרט"}
          </button>
        </div>
        <button onClick={() => safeConsult(product, "התייעצות כללית")} className="w-full bg-[#0B2C63] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
          <MessageCircle size={18} /> התייעצות כאן
        </button>
      </div>
    </motion.div>
  );
}
