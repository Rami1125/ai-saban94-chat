"use client";

import { motion } from "framer-motion";
import { 
  ShoppingCart, Calculator, Clock, ShieldCheck, 
  Factory, PlayCircle, Info, Droplets, Wand2, MessageCircle 
} from 'lucide-react';
import { useState } from "react";

// הגדרת ה-Props עם ערך ברירת מחדל לפונקציה כדי למנוע את שגיאת ה-TypeError
interface ProductCardProps {
  product: any;
  onConsult?: (product: any, type: string) => void;
}

export function ProductCard({ 
  product, 
  onConsult = () => {} // אם לא עברה פונקציה, האתר לא יקרוס
}: ProductCardProps) {
  const [showVideo, setShowVideo] = useState(false);

  if (!product) return null;

  // חילוץ נתונים מורחב מהטבלה (Supabase)
  const name = product.product_name || product.name || "מוצר ללא שם";
  const sku = product.sku || "N/A";
  const price = product.price;
  const image = product.image_url || product.image;
  const supplier = product.supplier_name || product.supplier || "ח. סבן";
  
  // שדות טכניים מהטבלה
  const coverage = product.coverage || "לפי מפרט";
  const dryingTime = product.drying_time || "24 שעות";
  const applicationMethod = product.application_method || "הברשה / מלג' / התזה";
  const videoUrl = product.video_url; // לינק מיוטיוב

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[35px] overflow-hidden text-right w-full max-w-[340px] shadow-2xl transition-all mb-4 relative mx-auto"
      dir="rtl"
    >
      {/* תמונת מוצר ונגן וידאו */}
      <div className="w-full h-48 bg-slate-50 dark:bg-slate-800 relative group">
        {image && !showVideo && (
          <img src={image} alt={name} className="w-full h-full object-contain p-4 mix-blend-multiply dark:mix-blend-normal" />
        )}
        
        {showVideo && videoUrl && (
          <div className="absolute inset-0 z-10 bg-black">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoUrl.includes('v=') ? videoUrl.split('v=')[1] : videoUrl.split('/').pop()}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setShowVideo(false); }} 
              className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-[10px] z-20"
            >
              סגור X
            </button>
          </div>
        )}

        {videoUrl && !showVideo && (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
            className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/20 transition-all"
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
        
        <h3 className="text-lg font-black text-[#0B2C63] dark:text-white mb-1 leading-tight">
          {name}
        </h3>

        <div className="flex items-center gap-1 text-slate-400 mb-3">
          <Factory size={10} />
          <span className="text-[9px] font-bold uppercase">{supplier}</span>
        </div>

        {/* מחיר */}
        <div className="text-3xl font-black text-blue-600 mb-4 flex items-baseline gap-1">
          {price ? (
            <><span className="text-base">₪</span>{price}</>
          ) : (
            <span className="text-lg text-blue-500/70 italic">פנה להצעת מחיר</span>
          )}
        </div>

        {/* שדות טכניים לחיצים - כל אחד מפעיל את ג'ימיני עם שאילתה מובנית */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          
          <button 
            onClick={() => onConsult(product, "זמן ייבוש")}
            className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-400 transition-all text-center"
          >
            <Clock size={16} className="text-orange-500 mb-1"/>
            <span className="text-[10px] text-slate-400 font-bold">זמן ייבוש</span>
            <div className="text-[11px] font-black text-[#0B2C63] dark:text-slate-200">{dryingTime}</div>
          </button>

          <button 
            onClick={() => onConsult(product, "חישוב צריכה לפי מטר")}
            className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-400 transition-all text-center"
          >
            <Calculator size={16} className="text-blue-500 mb-1"/>
            <span className="text-[10px] text-slate-400 font-bold">צריכה למ"ר</span>
            <div className="text-[11px] font-black text-[#0B2C63] dark:text-slate-200">{coverage}</div>
          </button>

          <button 
            onClick={() => onConsult(product, "שיטת יישום")}
            className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-400 transition-all text-center"
          >
            <Wand2 size={16} className="text-purple-500 mb-1"/>
            <span className="text-[10px] text-slate-400 font-bold">איך מיישמים?</span>
            <div className="text-[11px] font-black text-[#0B2C63] dark:text-slate-200 truncate w-full">{applicationMethod}</div>
          </button>

          <button 
            onClick={() => onConsult(product, "תכונות טכניות")}
            className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 hover:border-blue-400 transition-all text-center"
          >
            <Info size={16} className="text-emerald-500 mb-1"/>
            <span className="text-[10px] text-slate-400 font-bold">תכונות</span>
            <div className="text-[11px] font-black text-[#0B2C63] dark:text-slate-200 italic">מפרט מלא</div>
          </button>
        </div>

        {/* כפתור ההתייעצות הראשי */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onConsult(product, "התייעצות כללית")}
          className="w-full bg-gradient-to-r from-[#0B2C63] to-blue-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl mb-3 group transition-all"
        >
          <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" /> 
          התייעצות כאן
        </motion.button>

        <button className="w-full py-2 text-[11px] text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800 mt-2 hover:text-blue-600 transition-colors">
           הוספה מהירה להזמנה +
        </button>
      </div>
    </motion.div>
  );
}
