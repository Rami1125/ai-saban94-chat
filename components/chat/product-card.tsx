"use client";
import { motion } from "framer-motion";
import { Calculator, Clock, MessageCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import { useState } from "react";

export function ProductCard({ product, onConsult = () => {} }: { product: any, onConsult?: (p: any, t: string) => void }) {
  const [showVideo, setShowVideo] = useState(false);
  if (!product) return null;

  return (
    <motion.div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-[30px] overflow-hidden w-full max-w-[320px] shadow-xl" dir="rtl">
      <div className="w-full h-40 bg-slate-100 relative">
        {!showVideo ? (
          <>
            <img src={product.image_url} className="w-full h-full object-contain p-4" alt={product.product_name} />
            {product.video_url && (
              <button onClick={() => setShowVideo(true)} className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10">
                <PlayCircle size={40} className="text-white drop-shadow-lg" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-black">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${product.video_url.split('v=')[1]}?autoplay=1`} allowFullScreen />
            <button onClick={() => setShowVideo(false)} className="absolute top-2 right-2 text-white bg-black/50 px-2 rounded-full text-xs">סגור</button>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-black text-[#0B2C63] dark:text-white text-lg mb-2">{product.product_name}</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => onConsult(product, "זמן ייבוש")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
            <Clock size={14} className="mx-auto mb-1 text-orange-500" /> {product.drying_time || "24 שעות"}
          </button>
          <button onClick={() => onConsult(product, "חישוב כמויות")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
            <Calculator size={14} className="mx-auto mb-1 text-blue-500" /> {product.coverage || "לפי מפרט"}
          </button>
        </div>
        <button onClick={() => onConsult(product, "התייעצות כללית")} className="w-full bg-[#0B2C63] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-blue-800">
          <MessageCircle size={18} /> התייעצות כאן
        </button>
      </div>
    </motion.div>
  );
}
