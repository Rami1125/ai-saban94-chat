"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, MessageCircle, PlayCircle } from 'lucide-react';

function getYouTubeId(input?: string) {
  if (!input) return null;
  const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export function ProductCard({ product, onConsult }: { product: any, onConsult?: (p: any, t: string) => void }) {
  const [showVideo, setShowVideo] = useState(false);
  const ytId = getYouTubeId(product.video_url);

  if (!product) return null;

  // פונקציית הגנה למניעת "r is not a function"
  const handleAction = (type: string) => {
    if (typeof onConsult === "function") {
      onConsult(product, type);
    } else {
      console.warn("[מלשינון] onConsult is missing!");
    }
  };

  return (
    <motion.div className="bg-white border border-slate-200 rounded-[30px] overflow-hidden w-full max-w-[320px] shadow-xl mx-auto mb-4" dir="rtl">
      <div className="w-full h-40 bg-slate-100 relative">
        {!showVideo ? (
          <>
            <img src={product.image_url || "https://placehold.co/400x400?text=Saban+AI"} className="w-full h-full object-contain p-4" alt={product.product_name} />
            {ytId && (
              <button onClick={() => setShowVideo(true)} className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10">
                <PlayCircle size={40} className="text-white" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-black">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} allow="autoplay" allowFullScreen />
            <button onClick={() => setShowVideo(false)} className="absolute top-2 right-2 text-white bg-black/50 px-2 rounded-full text-xs">סגור</button>
          </div>
        )}
      </div>
      <div className="p-4 text-right">
        <h3 className="font-black text-[#0B2C63] text-lg mb-2">{product.product_name}</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => handleAction("זמן ייבוש")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
            <Clock size={14} className="mx-auto mb-1 text-orange-500" /> {product.drying_time || "24 שעות"}
          </button>
          <button onClick={() => handleAction("חישוב כמויות")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
            <Calculator size={14} className="mx-auto mb-1 text-blue-500" /> {product.coverage || "לפי מפרט"}
          </button>
        </div>
        <button onClick={() => handleAction("התייעצות כללית")} className="w-full bg-[#0B2C63] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
          <MessageCircle size={18} /> התייעצות כאן
        </button>
      </div>
    </motion.div>
  );
}
