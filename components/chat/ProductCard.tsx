"use client";

import React, { useState } from 'react';
import { 
  Package, ShoppingCart, ChevronDown, Clock, 
  Droplets, Ruler, Hammer, PlayCircle, Image as ImageIcon,
  Plus, Minus, ChevronRight, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  product_name: string;
  sku: string;
  price: number;
  image_url?: string;
  image_url_2?: string;
  image_url_3?: string;
  youtube_url?: string;
  drying_time?: string;
  coverage_per_sqm?: string;
  application_method?: string;
  features?: string[];
  stock_quantity?: number;
}

export default function ProductCard({ product, onAddToCart }: { product: Product, onAddToCart?: (p: any, qty: number) => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);

  // איסוף כל המדיה הקיימת (תמונות + וידאו)
  const media = [
    product.image_url,
    product.image_url_2,
    product.image_url_3
  ].filter(Boolean);

  const nextImg = () => setCurrentImg((prev) => (prev + 1) % media.length);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
    >
      {/* Media Gallery */}
      <div className="relative h-56 bg-black/20 group">
        {media.length > 0 ? (
          <img 
            src={media[currentImg]} 
            className="w-full h-full object-cover transition-all duration-700"
            alt={product.product_name}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={48} /></div>
        )}
        
        {media.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setCurrentImg(prev => (prev - 1 + media.length) % media.length)} className="bg-black/40 p-1 rounded-full"><ChevronRight size={20}/></button>
            <button onClick={nextImg} className="bg-black/40 p-1 rounded-full"><ChevronLeft size={20}/></button>
          </div>
        )}

        {product.youtube_url && (
          <a href={product.youtube_url} target="_blank" className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
            <PlayCircle size={20} />
          </a>
        )}
        
        <Badge className="absolute bottom-4 right-4 bg-blue-600/80 backdrop-blur-md border-none">
          מק"ט: {product.sku}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4" dir="rtl">
        <div>
          <h3 className="text-xl font-black text-white leading-tight">{product.product_name}</h3>
          <div className="text-2xl font-black text-emerald-400 mt-1">{product.price} ₪</div>
        </div>

        {/* Hamburger Style Details */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
        >
          <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
            <Package size={14} /> מפרט טכני ותכונות
          </span>
          <ChevronDown size={16} className={`transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-2 pt-2"
            >
              {product.drying_time && (
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 p-2 rounded-lg">
                  <Clock size={14} className="text-blue-400" /> <b>זמן ייבוש:</b> {product.drying_time}
                </div>
              )}
              {product.coverage_per_sqm && (
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 p-2 rounded-lg">
                  <Ruler size={14} className="text-emerald-400" /> <b>כושר כיסוי:</b> {product.coverage_per_sqm}
                </div>
              )}
              {product.application_method && (
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 p-2 rounded-lg">
                  <Hammer size={14} className="text-orange-400" /> <b>שיטת יישום:</b> {product.application_method}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center bg-slate-800 rounded-2xl border border-white/10">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 hover:text-blue-400"><Minus size={16}/></button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="p-3 hover:text-blue-400"><Plus size={16}/></button>
          </div>
          
          <Button 
            onClick={() => onAddToCart?.(product, quantity)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl h-12 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <ShoppingCart size={18} /> הוסף לסל
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
