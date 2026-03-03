"use client";

import { motion } from "framer-motion";
import { 
  ShoppingCart, Calculator, Clock, ShieldCheck, 
  Factory, PlayCircle, Info, Wand2, MessageCircle 
} from 'lucide-react';
import { useState } from "react";

interface ProductCardProps {
  product: any;
  onConsult?: (product: any, type: string) => void;
  onAddToCart?: (product: any) => void;
}

export function ProductCard({ 
  product, 
  onConsult, 
  onAddToCart 
}: ProductCardProps) {
  const [showVideo, setShowVideo] = useState(false);

  if (!product) return null;

  const name = product.product_name || product.name || "מוצר ללא שם";
  const sku = product.sku || "N/A";
  const price = product.price;
  const image = product.image_url || product.image;
  const supplier = product.supplier_name || product.supplier || "ח. סבן";
  const videoUrl = product.video_url;

  // פונקציית הגנה להפעלה בטוחה
  const safeConsult = (type: string) => {
    if (typeof onConsult === "function") {
      onConsult(product, type);
    } else {
      console.warn(`[מלשינון] ⚠️ onConsult לא הוגדר! הלחיצה על ${type} נחסמה למניעת קריסה.`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[35px] overflow-hidden text-right w-full max-w-[340px] shadow-2xl relative mx-auto mb-4"
      dir="rtl"
    >
      {/* אזור מדיה */}
      <div className="w-full h-48 bg-slate-50 dark:bg-slate-800 relative group">
        {image && !showVideo && (
          <img src={image} alt={name} className="w-full h-full object-contain p-4" />
        )}
        {showVideo && videoUrl && (
          <div className="absolute inset-0 z-10 bg-black">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoUrl.includes('v=') ? videoUrl.split('v=')[1] : videoUrl.split('/').pop()}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <button onClick={() => setShowVideo(false)} className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-[10px]">סגור X</button>
          </div>
        )}
        {videoUrl && !showVideo && (
          <button onClick={() => setShowVideo(true)} className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-all">
            <PlayCircle size={48} className="text-white drop-shadow-lg" />
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="bg-[#0B2C63] text-white text-[8px] font-black px-3 py-1 rounded-full italic uppercase">SABAN LOGISTICS</span>
          <span className="text-slate-400 text-[10px] font-mono">{sku}</span>
        </div>
        
        <h3 className="text-lg font-black text-[#0B2C63] dark:text-white mb-4 leading-tight">{name}</h3>

        {/* מחיר */}
        <div className="text-3xl font-black text-blue-600 mb-5 flex items-baseline gap-1">
          {price ? <><span className="text-base">₪</span>{price}</> : <span className="text-lg text-blue-500/70 italic">פנה להצעת מחיר</span>}
        </div>

        {/* כפתורים טכניים */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button onClick={() => safeConsult("זמן ייבוש")} className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 hover:border-blue-400 transition-all">
            <Clock size={16} className="text-orange-500 mb-1"/>
            <span className="text-[10px] text-slate-400 font-bold">זמן ייבוש</span>
            <div className="text-[11px] font-black text-[#0B2C63] dark:text-slate-200">{product.drying_time || "24 שעות"}</div>
          </button>

          <button onClick={() => safeConsult("חישוב כמויות")} className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 hover:border-blue-400 transition-all">
            <Calculator size={16} className="text-blue-500 mb-1"/>
            <span className="text-[10px] text-slate-400 font-bold">כיסוי למ"ר</span>
            <div className="text-[11px] font-black text-[#0B2C63] dark:text-slate-200">{product.coverage || "לפי מפרט"}</div>
          </button>
        </div>

        {/* כפתור התייעצות ראשי */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => safeConsult("התייעצות כללית")}
          className="w-full bg-gradient-to-r from-[#0B2C63] to-blue-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl mb-3 group"
        >
          <MessageCircle size={18} className="group-hover:rotate-12 transition-transform" />
          התייעצות כאן
        </motion.button>

        <button 
          onClick={() => typeof onAddToCart === "function" && onAddToCart(product)}
          className="w-full py-2 text-[11px] text-slate-400 font-bold border-t border-slate-100 mt-2 hover:text-blue-600 transition-colors"
        >
          הוספה מהירה להזמנה +
        </button>
      </div>
    </motion.div>
  );
}
