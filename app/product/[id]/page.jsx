"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Calculator, ShoppingCart, CheckCircle2, 
  MapPin, Package, Ruler, Loader2, AlertTriangle,
  ChevronRight, ArrowRight, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V8 - דף מוצר חכם המחובר לטבלה inventory
 */
export default function ProductDisplayPage({ params }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. שליפת המוצר מהטבלה לפי ה-ID (SKU)
  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .eq("sku", params.id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (err) {
        setError("המוצר לא נמצא במערכת");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) loadProduct();
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="text-blue-400 font-black animate-pulse uppercase tracking-widest text-xs">SABAN OS: שולף נתונים מהמלאי...</p>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="text-rose-500 mb-4" size={64} />
      <h2 className="text-2xl font-black text-white mb-2">{error || "מוצר לא קיים"}</h2>
      <button onClick={() => window.history.back()} className="text-blue-400 font-bold flex items-center gap-2">
        <ArrowRight size={20} /> חזור לדף הקודם
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-12 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* כפתור חזרה */}
        <button onClick={() => window.history.back()} className="mb-8 text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-bold text-sm">
          <ChevronRight size={18} /> חזרה למלאי
        </button>

        {/* הצגת הרכיב המעוצב עם הנתונים מהטבלה */}
        <SabanProductCard product={product} />
      </div>
    </div>
  );
}

/**
 * רכיב כרטיס המוצר המקצועי
 */
function SabanProductCard({ product }) {
  const [inputs, setInputs] = useState({ length: "", height: "", openings: "0", waste: "5" });

  // חישוב לוגיסטי דינמי המבוסס על ערך ה-coverage מהטבלה
  const calc = useMemo(() => {
    const l = parseFloat(inputs.length) || 0;
    const h = parseFloat(inputs.height) || 0;
    const ops = parseFloat(inputs.openings) || 0;
    const wst = parseFloat(inputs.waste) || 5;
    
    // שליפת כושר כיסוי מהטבלה (ברירת מחדל 0.15)
    const cov = parseFloat(product.coverage) || 0.15;
    
    const baseArea = l * h;
    const netArea = Math.max(0, baseArea - ops);
    const withWaste = netArea * (1 + wst / 100);
    const units = Math.ceil(withWaste / cov);

    return { netArea, withWaste, units, cov };
  }, [inputs, product]);

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl flex flex-col lg:flex-row backdrop-blur-3xl">
      
      {/* אזור ויזואלי */}
      <div className="lg:w-1/2 relative bg-black/40 flex items-center justify-center p-4">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.product_name} 
            className="w-full h-full object-contain max-h-[500px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
          />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-700">
            <Package size={80} />
            <p className="text-xs font-bold mt-2 uppercase tracking-widest">אין תמונה במערכת</p>
          </div>
        )}
        <div className="absolute top-8 right-8 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
           מק"ט: {product.sku}
        </div>
      </div>

      {/* אזור תוכן ומחשבון */}
      <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col">
        <header className="mb-6">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic uppercase">{product.product_name}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-slate-400">⚖️ {product.packaging || "שק/משטח"}</div>
            <div className="px-3 py-1 bg-emerald-500/10 rounded-lg text-xs font-bold text-emerald-500 border border-emerald-500/20">🟢 זמין במלאי</div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 italic">
            {product.description || "תיאור טכני של המוצר כפי שהוגדר על ידי המומחה..."}
          </p>
        </header>

        {/* מחשבון כמויות לביצוע */}
        <div className="bg-black/20 border border-white/5 rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <h3 className="flex items-center gap-2 font-black text-blue-400 text-sm">
              <Calculator size={18} /> מחשבון כמויות לביצוע
            </h3>
            <button onClick={() => setInputs({ length: "", height: "", openings: "0", waste: "5" })} className="text-slate-600 hover:text-white transition-colors">
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">אורך קיר (מטר)</label>
              <input 
                type="number" 
                value={inputs.length} 
                onChange={(e) => setInputs({...inputs, length: e.target.value})}
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">גובה קיר (מטר)</label>
              <input 
                type="number" 
                value={inputs.height} 
                onChange={(e) => setInputs({...inputs, height: e.target.value})}
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* תוצאת חישוב */}
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-blue-500 font-bold uppercase mb-1">כמות מומלצת להזמנה</div>
            <div className="text-3xl font-black text-white italic">{calc.units} <span className="text-sm font-normal text-slate-500">יחידות</span></div>
            <div className="text-[9px] text-slate-500 mt-2 uppercase tracking-widest">
              מחושב לפי {calc.cov} מ"ר ליחידה | כולל {inputs.waste}% פחת
            </div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="flex gap-3 mt-auto">
          <button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all">
            <ShoppingCart size={20} /> הוסף להזמנה
          </button>
          <button className="w-14 h-14 border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/5 transition-all">
            <MapPin size={22} className="text-slate-400" />
          </button>
        </div>

        <footer className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[9px] font-bold text-slate-600 uppercase tracking-widest">
          <span>* המחיר משתנה לפי כמויות. בדוק מול המוקד.</span>
          <span className="italic">Saban OS V8</span>
        </footer>
      </div>
    </div>
  );
}
