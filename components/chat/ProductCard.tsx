"use client";
import React from 'react';
import { ShoppingCart, Play, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';

export default function ProductStoreCard({ product }: any) {
  return (
    <div className="max-w-sm bg-[#0F172A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] group transition-all hover:border-blue-500/50">
      
      {/* תמונת מוצר גדולה */}
      <div className="relative h-64 bg-white p-4">
        <img 
          src={product.image_url || "/placeholder-product.png"} 
          alt={product.name} 
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
        />
        <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
          Best Seller
        </div>
      </div>

      {/* פרטי המוצר בסגנון חנות */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-black text-white">{product.name}</h3>
          <span className="text-blue-400 font-bold">#603</span>
        </div>

        {/* תכונות עיקריות (הצ'קים) */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <CheckCircle2 size={16} className="text-green-500" />
            <span>סיווג תקני: C2TE S1 (גמיש)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <CheckCircle2 size={16} className="text-green-500" />
            <span>צריכה: 1.4 ק"ג למ"ר (למ"מ עובי)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <CheckCircle2 size={16} className="text-green-500" />
            <span>מתאים לריצוף חוץ ופנים</span>
          </div>
        </div>

        {/* מחיר וקריאה לפעולה */}
        <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-bold text-xs uppercase italic underline">מחיר ח.סבן:</span>
            <span className="text-white font-black text-lg">בדיקה טלפונית</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* כפתור יוטיוב מוסתר */}
            <button className="flex items-center justify-center gap-2 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs transition-all">
              <Play size={14} className="fill-white" />
              וידאו יישום
            </button>
            
            {/* כפתור רכישה/שיתוף */}
            <button className="flex items-center justify-center gap-2 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-900/40">
              <ShoppingCart size={14} />
              הזמן עכשיו
            </button>
          </div>
        </div>
      </div>

      {/* Footer עם חותמת איכות */}
      <div className="bg-blue-600/10 p-3 flex justify-center items-center gap-2">
        <ShieldCheck size={14} className="text-blue-400" />
        <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest text-center">
          אספקה מיידית - חמ"ל ח. סבן
        </span>
      </div>
    </div>
  );
}
