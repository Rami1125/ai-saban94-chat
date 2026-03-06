"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, Send, Info, CheckCircle2, Ruler } from "lucide-react";

export function CalculatorOverlay({ product, onSuccess }: { product: any, onSuccess: () => void }) {
  const [area, setArea] = useState<number>(0);
  const [calculatedQuantity, setCalculatedQuantity] = useState<number>(0);
  
  // נתון טכני: כמה מ"ר מכסה יחידה אחת של המוצר (למשל: שק סיקה מכסה 2 מ"ר ב-1 ס"מ עובי)
  // במידה ואין נתון ב-DB, נשתמש בברירת מחדל של 1.5
  const coveragePerUnit = product?.coverage_sqm || 1.5;

  useEffect(() => {
    if (area > 0) {
      // חישוב: שטח חלקי כיסוי ליחידה, מעוגל תמיד למעלה (כי אי אפשר לקנות חצי שק)
      setCalculatedQuantity(Math.ceil(area / coveragePerUnit));
    } else {
      setCalculatedQuantity(0);
    }
  }, [area, coveragePerUnit]);

  const handleSendToRami = () => {
    const message = `היי רמי, אשמח לקבל הצעת מחיר עבור ${product?.product_name}. נדרש כיסוי של ${area} מ"ר (חישוב: ${calculatedQuantity} יחידות).`;
    const whatsappUrl = `https://wa.me/972508860896?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onSuccess();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* כרטיס מידע מוצר */}
      <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-[24px] border border-slate-100 dark:border-zinc-800 flex items-center gap-4">
        <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-xl p-2 shadow-sm shrink-0">
          <img src={product?.image_url} className="w-full h-full object-contain" alt={product?.product_name} />
        </div>
        <div>
          <h4 className="font-black text-slate-900 dark:text-white leading-tight">{product?.product_name}</h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">כושר כיסוי: {coveragePerUnit} מ"ר ליחידה</p>
        </div>
      </div>

      {/* הזנת נתונים */}
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
            <Ruler size={16} className="text-blue-600" /> מה השטח לכיסוי (במ"ר)?
          </span>
          <div className="relative">
            <input 
              type="number" 
              value={area || ""}
              onChange={(e) => setArea(Number(e.target.value))}
              placeholder="לדוגמה: 50"
              className="w-full p-5 bg-white dark:bg-zinc-900 rounded-[20px] border-2 border-slate-100 dark:border-zinc-800 outline-none focus:border-blue-600 transition-all text-xl font-black text-blue-600"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">מ"ר</span>
          </div>
        </label>
      </div>

      {/* תוצאת חישוב */}
      {calculatedQuantity > 0 && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="bg-blue-600 p-6 rounded-[32px] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden text-center"
        >
          <div className="relative z-10">
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">כמות מומלצת</p>
            <h3 className="text-4xl font-black">{calculatedQuantity} יחידות</h3>
            <p className="text-[10px] mt-2 font-medium italic">* החישוב כולל עיגול יחידות למעלה</p>
          </div>
          <Calculator className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
        </motion.div>
      )}

      {/* כפתור הנעה לפעולה */}
      <button 
        disabled={!calculatedQuantity}
        onClick={handleSendToRami}
        className="w-full py-5 bg-[#0B2C63] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[24px] font-black text-lg shadow-xl hover:bg-blue-800 transition-all flex items-center justify-center gap-3 active:scale-95"
      >
        <Send size={20} />
        קבל הצעת מחיר מרמי
      </button>

      <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center font-bold uppercase tracking-tight">
        <Info size={12} /> ליווי טכני מלא לכל פרויקט - ח. סבן
      </div>
    </div>
  );
}
