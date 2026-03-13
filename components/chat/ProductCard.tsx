"use client";
import React from 'react';
import { PlayCircle, MessageCircle, Info, ExternalLink, Share2 } from 'lucide-react';

interface ProductProps {
  product: {
    name: string;
    description: string;
    image_url?: string;
    youtube_id?: string;
    price_status?: string; // "בדיקה טלפונית" לפי ה-DNA
    technical_specs?: string;
  };
}

export default function ProductCard({ product }: ProductProps) {
  
  const shareToWhatsApp = () => {
    const text = `היי, אני מעוניין במוצר: ${product.name}\n${product.description}`;
    window.open(`https://wa.me/972508860896?text=${encodeURIComponent(text)}`, '_blank');
  };

  const openYoutube = () => {
    if (product.youtube_id) {
      window.open(`https://www.youtube.com/watch?v=${product.youtube_id}`, '_blank');
    }
  };

  return (
    <div className="w-full max-w-[350px] bg-[#0F172A] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 group" dir="rtl">
      
      {/* תמונת המוצר עם Overlay מקצועי */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-800">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Info className="text-slate-600" size={48} />
          </div>
        )}
        
        {/* Badge סטטוס מחיר (לפי ה-DNA) */}
        <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
          {product.price_status || "בדיקה טלפונית"}
        </div>
      </div>

      {/* תוכן הכרטיס */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2 text-blue-400">
          <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
          <span className="text-[10px] font-black uppercase tracking-tighter">ח. סבן - קטלוג מקצועי</span>
        </div>

        <h3 className="text-2xl font-black text-white mb-2 leading-tight">
          {product.name}
        </h3>
        
        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 line-clamp-3 italic">
          "{product.description}"
        </p>

        {/* כפתורי פעולה */}
        <div className="flex flex-col gap-3">
          
          {/* כפתור יוטיוב מוסתר (רק אם יש ID) */}
          {product.youtube_id && (
            <button 
              onClick={openYoutube}
              className="flex items-center justify-center gap-3 w-full h-14 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-red-900/30"
            >
              <PlayCircle size={20} />
              צפה בסרטון הדרכה
            </button>
          )}

          {/* כפתור שיתוף ווטסאפ של ח. סבן */}
          <button 
            onClick={shareToWhatsApp}
            className="flex items-center justify-center gap-3 w-full h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl font-black transition-all shadow-lg shadow-green-900/20"
          >
            <MessageCircle size={20} />
            הזמן עכשיו בווטסאפ
          </button>

          <div className="flex gap-2">
            <button className="flex-1 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-white/5">
              <ExternalLink size={14} /> מפרט טכני
            </button>
            <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center border border-white/5">
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer עדין */}
      <div className="p-4 bg-white/5 text-center">
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
          SABAN ENTERPRISE • PROFESSIONAL SOLUTIONS
        </p>
      </div>
    </div>
  );
}
