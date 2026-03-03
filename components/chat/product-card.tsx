"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, MessageCircle, PlayCircle } from 'lucide-react';

// פונקציית עזר לחילוץ ID של יוטיוב מכל פורמט
function getYouTubeId(input?: string) {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const parts = url.pathname.split('/embed/');
    if (parts[1]) return parts[1].split(/[/?#&]/)[0];
  } catch { return null; }
  return null;
}

export function ProductCard({ product, onConsult }: { product: any, onConsult?: (p: any, t: string) => void }) {
  const [showVideo, setShowVideo] = useState(false);
  const ytId = getYouTubeId(product.video_url);

  if (!product) return null;

  // הגנה הרמטית מפני TypeError
  const safeConsult = (t: string) => {
    if (typeof onConsult === "function") {
      onConsult(product, t);
    } else {
      console.warn("[מלשינון] onConsult is not a function - Check Parent component", { type: t });
    }
  };

  return (
    <motion.div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-[30px] overflow-hidden w-full max-w-[320px] shadow-xl mx-auto mb-4" dir="rtl">
      <div className="w-full h-40 bg-slate-100 relative">
        {!showVideo ? (
          <>
            <img src={product.image_url || "/placeholder.png"} className="w-full h-full object-contain p-4" alt={product.product_name} />
            {ytId && (
              <button onClick={() => setShowVideo(true)} className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10">
                <PlayCircle size={40} className="text-white drop-shadow-lg" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-black">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} allowFullScreen allow="autoplay" />
            <button onClick={() => setShowVideo(false)} className="absolute top-2 right-2 text-white bg-black/50 px-2 rounded-full text-xs">סגור</button>
          </div>
        )}
      </div>
      <div className="p-4 text-right">
        <h3 className="font-black text-[#0B2C63] dark:text-white text-lg mb-2">{product.product_name}</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => safeConsult("זמן ייבוש")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
            <Clock size={14} className="mx-auto mb-1 text-orange-500" /> {product.drying_time || "24 שעות"}
          </button>
          <button onClick={() => safeConsult("חישוב כמויות")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
            <Calculator size={14} className="mx-auto mb-1 text-blue-500" /> {product.coverage || "לפי מפרט"}
          </button>
        </div>
        <button onClick={() => safeConsult("התייעצות כללית")} className="w-full bg-[#0B2C63] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors">
          <MessageCircle size={18} /> התייעצות כאן
        </button>
      </div>
    </motion.div>
  );
}
