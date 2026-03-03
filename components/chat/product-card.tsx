"use client";

import { motion } from "framer-motion";
import { 
  ShoppingCart, Calculator, Clock, ShieldCheck, 
  Factory, PlayCircle, Info, Droplets, Wand2, MessageCircle 
} from 'lucide-react';
import { useState } from "react";

export function ProductCard({ product, onConsult }: { product: any, onConsult: (p: any, type: string) => void }) {
  const [showVideo, setShowVideo] = useState(false);

  if (!product) return null;

  // חילוץ נתונים מורחב מהטבלה
  const name = product.product_name || product.name || "מוצר ללא שם";
  const sku = product.sku || "N/A";
  const price = product.price;
  const image = product.image_url || product.image;
  const supplier = product.supplier_name || product.supplier || "ח. סבן";
  const coverage = product.coverage || "לפי מפרט";
  const dryingTime = product.drying_time || "24 שעות";
  const applicationMethod = product.application_method || "הברשה/התזה";
  const videoUrl = product.video_url; // לינק מיוטיוב

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[35px] overflow-hidden text-right w-full max-w-[340px] shadow-2xl transition-all mb-4 relative"
      dir="rtl"
    >
      {/* תמונת מוצר וסרטון */}
      <div className="w-full h-48 bg-slate-50 dark:bg-slate-800 relative group">
        {image && !showVideo && (
          <img src={image} alt={name} className="w-full h-full object-contain p-4" />
        )}
        
        {showVideo && videoUrl && (
          <div className="absolute inset-0 z-10 bg-black">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoUrl.split('v=')[1]}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <button onClick={() => setShowVideo(false)} className="absolute top-2 right-2 bg-white/20 p-1 rounded-full text-white text-[10px]">סגור X</button>
          </div>
        )}

        {videoUrl && !showVideo && (
          <button 
            onClick={() => setShowVideo(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-all"
          >
            <PlayCircle size={48} className="text-white drop-shadow-lg" />
          </button>
        )}
        
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm">
           <ShieldCheck size={18} className="text-blue-600" />
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="bg-[#0B2C63] text-white text-[8px] font-black px-3 py-1 rounded-full italic uppercase tracking-tighter">
            SABAN LOGISTICS
          </span>
          <span className="text-slate-400 text-[10px] font-mono font-bold">{sku}</span>
        </div>
        
        <h3 className="text-lg font-black text-[#0B2C63] dark:text-white mb-3 leading-tight">
          {name}
        </h3>

        {/* מחיר בולט */}
        <div className="text-3xl font-black text-blue-600 mb-4 flex items-baseline gap-1">
          {price ? (
            <><span className="text-base">₪</span>{price}</>
          ) : (
            <span className="text-lg text-blue-500/70 italic">פנה להצעת מחיר</span>
          )}
        </div>

        {/* שדות לחיצים - כל שדה מפעיל את ג'ימיני */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          
          {/* זמן ייבוש - לחיץ */}
          <button 
            onClick={() => onConsult(product, "זמן ייבוש")}
            className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-300 transition-all"
          >
            <Clock size={16} className="text-orange-500 mb-1"/>
            <span className="text-[10px] text-slate-400">זמן ייבוש</span>
            <div className="text-[11px] font-black text-slate-700 dark:text-slate-200">{dryingTime}</div>
          </button>

          {/* כמות כיסוי - לחיץ (מפעיל מחשבון) */}
          <button 
            onClick={() => onConsult(product, "חישוב כמויות")}
            className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-300 transition-all"
          >
            <Calculator size={16} className="text-blue-500 mb-1"/>
            <span className="text-[10px] text-slate-400">כיסוי למ"ר</span>
            <div className="text-[11px] font-black text-slate-700 dark:text-slate-200">{coverage}</div>
          </button>

          {/* שיטת יישום - לחיץ */}
          <button 
            onClick={() => onConsult(product, "שיטת יישום")}
            className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-300 transition-all"
          >
            <Wand2 size={16} className="text-purple-500 mb-1"/>
            <span className="text-[10px] text-slate-400">איך מיישמים?</span>
            <div className="text-[11px] font-black text-slate-700 dark:text-slate-200">{applicationMethod}</div>
          </button>

          {/* תכונות נוספות - לחיץ */}
          <button 
            onClick={() => onConsult(product, "מידע טכני")}
            className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-300 transition-all"
          >
            <Info size={16} className="text-emerald-500 mb-1"/>
            <span className="text-[10px] text-slate-400">תכונות</span>
            <div className="text-[11px] font-black text-slate-700 dark:text-slate-200 italic font-mono">מפרט מלא</div>
          </button>
        </div>

        {/* כפתור הפעולה המרכזי - התייעצות */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onConsult(product, "כללי")}
          className="w-full bg-gradient-to-r from-[#0B2C63] to-blue-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl mb-3 group"
        >
          <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" /> 
          התייעצות כאן
        </motion.button>

        <button className="w-full py-2 text-[11px] text-slate-400 font-bold border-t border-slate-100 mt-2">
           הוספה מהירה לסל +
        </button>
      </div>
    </motion.div>
  );
}
