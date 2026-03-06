"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SafeIcon } from "@/components/SafeIcon";
import { Product } from "@/types";
import { useChatActions } from "@/context/ChatActionsContext";
import { Play, X, Image as ImageIcon, ChevronRight, CheckCircle2 } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { handleConsult } = useChatActions();
  const [showVideo, setShowVideo] = useState(false);

  // שימוש ב-youtube_url מה-DB שלך
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const embedUrl = getYoutubeEmbedUrl(product.youtube_url || "");

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 w-full max-w-sm text-right"
    >
      {/* תמונה ומחיר */}
      <div className="relative h-52 w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.product_name} 
            className="h-full w-full object-contain p-4 transform group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <ImageIcon size={48} className="text-slate-200" />
        )}
        
        {product.price && (
          <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-1.5 rounded-2xl text-sm font-black shadow-lg">
            ₪{product.price}
          </div>
        )}
        
        {embedUrl && (
          <button onClick={() => setShowVideo(true)} className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 p-3 rounded-full shadow-xl"><Play size={24} className="text-red-600 fill-current" /></div>
          </button>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 italic">במלאי</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SKU: {product.sku}</span>
        </div>

        <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2 leading-tight">
          {product.product_name}
        </h3>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 line-clamp-2">
          {product.description || "חומר בניין איכותי מבית ח. סבן."}
        </p>
        
        {/* מאפיינים טכניים מה-SQL שלך */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
            <SafeIcon name="Clock" size={16} className="text-orange-500 mb-1" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ייבוש</span>
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">{product.drying_time || "—"}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
            <SafeIcon name="Layers" size={16} className="text-purple-500 mb-1" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">כיסוי</span>
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">{product.coverage || "—"}</span>
          </div>
        </div>

        {/* יתרונות מה-ARRAY features */}
        {product.features && product.features.length > 0 && (
          <div className="mb-6 space-y-2">
            {product.features.slice(0, 2).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="truncate">{f}</span>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={() => handleConsult(product, `מעוניין בהזמנת ${product.product_name}`)}
          className="w-full py-4 bg-[#0B2C63] hover:bg-[#153a7a] text-white rounded-[20px] text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <span>הזמן דרך סבן AI</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Lightbox יוטיוב */}
      <AnimatePresence>
        {showVideo && embedUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-[32px] overflow-hidden">
              <button onClick={() => setShowVideo(false)} className="absolute top-6 right-6 z-10 bg-white/10 p-3 rounded-full text-white"><X size={24} /></button>
              <iframe src={`${embedUrl}?autoplay=1`} className="w-full h-full" allowFullScreen />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
