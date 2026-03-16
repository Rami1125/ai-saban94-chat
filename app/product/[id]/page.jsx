"use client";

import React, { useState, useEffect, useMemo, use } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Calculator, ShoppingCart, CheckCircle2, 
  MapPin, Package, Loader2, AlertTriangle,
  ChevronRight, ArrowRight, RotateCcw, ShieldCheck,
  Clock, Hammer, Play, Image as ImageIcon,
  Info, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V43.0 - דף מוצר Elite דינמי
 * -------------------------------------------
 * Fix: Next.js 15/16 Async Params support.
 * Fix: TypeScript syntax enforcement (TSX).
 */

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductElitePage({ params }: ProductPageProps) {
  // פתיחת ה-Promise של params לפי התקן החדש של Next.js
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. שליפת נתונים מהמערכת
  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("inventory")
          .select("*")
          .eq("sku", productId)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (productId) loadProduct();
  }, [productId]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-blue-500" size={64} />
      <p className="text-blue-400 font-black animate-pulse uppercase tracking-[0.3em] text-xs text-center">
        SABAN OS: SYNCHRONIZING DNA...
      </p>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
      <AlertTriangle className="text-rose-500 mb-6" size={80} />
      <h2 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter text-right">המוצר לא אותר ב-DNA</h2>
      <p className="text-slate-500 font-bold mb-10 max-w-md uppercase text-xs tracking-widest text-right">וודא שהמק"ט #{productId} הוזרק למערכת בסטודיו הניהול.</p>
      <button onClick={() => window.history.back()} className="bg-white text-slate-950 px-10 py-5 rounded-[25px] font-black flex items-center gap-3 active:scale-95 transition-all shadow-2xl uppercase italic">
        <ArrowRight size={22} /> חזור לביצוע
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-12 font-sans selection:bg-blue-500/30 text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />
      
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <button onClick={() => window.history.back()} className="bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 px-6 py-3 rounded-2xl transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest italic shadow-lg">
            <ChevronRight size={18} /> חזרה למלאי
          </button>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Saban Digital Asset</p>
                <p className="text-white font-black italic mt-1">SKU: {product.sku}</p>
             </div>
             <div className="w-12 h-12 bg-white rounded-xl p-2 shadow-xl border-2 border-blue-500/20">
                <img src="/ai.png" alt="Saban" className="w-full h-full object-contain" />
             </div>
          </div>
        </div>

        {/* --- Main Elite Card --- */}
        <div className="bg-[#0F172A] border border-white/5 rounded-[60px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col xl:flex-row relative">
          
          {/* Media Section */}
          <div className="xl:w-1/2 p-8 md:p-12 space-y-8 bg-black/20">
             <div className="flex gap-4 h-80 md:h-[450px]">
                <div className="flex-[2.5] bg-slate-800 rounded-[40px] overflow-hidden relative border border-white/10 shadow-inner group">
                   {product.image_url ? (
                     <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Main" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={64}/></div>
                   )}
                   <div className="absolute top-6 right-6 bg-blue-600 text-white px-5 py-2 rounded-2xl font-black text-[10px] shadow-2xl animate-pulse tracking-widest uppercase border border-white/20">Main View</div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                   <div className="flex-1 bg-slate-800 rounded-[25px] overflow-hidden border border-white/10 shadow-lg">
                      {product.image_url_2 ? <img src={product.image_url_2} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700/30"><ImageIcon size={24}/></div>}
                   </div>
                   <div className="flex-1 bg-slate-800 rounded-[25px] overflow-hidden border border-white/10 shadow-lg">
                      {product.image_url_3 ? <img src={product.image_url_3} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700/30"><ImageIcon size={24}/></div>}
                   </div>
                </div>
             </div>

             {getYoutubeId(product.video_url) && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="aspect-video bg-black rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative group">
                  <iframe 
                    className="w-full h-full" 
                    src={`https://www.youtube.com/embed/${getYoutubeId(product.video_url)}?modestbranding=1&rel=0`} 
                    frameBorder="0" 
                    allowFullScreen 
                  />
               </motion.div>
             )}
          </div>

          {/* Content Section */}
          <div className="xl:w-1/2 p-10 md:p-16 flex flex-col">
             <header className="space-y-4 mb-10 text-right">
                <div className="flex items-center gap-4 justify-end">
                   <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20 shadow-sm"><ShieldCheck size={14}/> Saban DNA Approved</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">{product.product_name}</h1>
                <div className="flex gap-3 justify-end">
                   <div className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold shadow-inner">⚖️ {product.packaging || "שק/משטח"}</div>
                   <div className="bg-blue-900/40 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-500/20 shadow-inner italic">🔍 SKU: {product.sku}</div>
                </div>
             </header>

             {/* Technical DNA */}
             <div className="grid grid-cols-2 gap-5 mb-10">
                <div className="bg-white/5 border border-white/5 p-8 rounded-[40px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
                   <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3 tracking-widest leading-none">זמן ייבוש</p>
                   <p className="text-3xl font-black text-white italic tracking-tighter flex items-center justify-center gap-3">
                      <Clock size={24} className="text-blue-500"/> {product.drying_time || "--"}
                   </p>
                </div>
                <div className="bg-white/5 border border-white/5 p-8 rounded-[40px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
                   <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3 tracking-widest leading-none">כושר כיסוי</p>
                   <p className="text-3xl font-black text-blue-400 italic tracking-tighter leading-none">
                      {product.coverage_info || product.coverage || "--"}
                   </p>
                </div>
             </div>

             {/* Description & Advice */}
             <div className="space-y-6 mb-10 flex-1 text-right">
                <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[45px] relative overflow-hidden shadow-inner group">
                   <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                   <div className="relative z-10 flex items-center justify-between mb-5">
                      <span className="text-[11px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-3"><Sparkles size={18} className="animate-pulse"/> Technical Advisor OS</span>
                      <Info size={20} className="text-blue-500/40" />
                   </div>
                   <p className="text-white text-lg font-bold leading-relaxed opacity-90 italic mb-6">
                      {product.description || "מוצר איכות מבית ח. סבן חומרי בניין."}
                   </p>
                   <div className="pt-6 border-t border-white/5">
                      <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-2 italic flex items-center gap-2 justify-end">
                         <Hammer size={16}/> שיטת יישום מומלצת:
                      </p>
                      <p className="text-slate-300 text-sm font-bold italic">{product.application_method || 'נא להיוועץ במנהל לפרטים טכניים נוספים.'}</p>
                   </div>
                </div>
             </div>

             <ProductCalculator coverage={parseFloat(product.coverage) || 0.15} />

             <button 
                onClick={() => toast.success("נוסף לסל הפקודה 🦾")}
                className="w-full mt-8 bg-white text-slate-900 py-8 rounded-[45px] font-black text-xs uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-6 border-b-8 border-slate-200 active:scale-95 transition-all italic hover:bg-blue-50"
             >
                הוסף לסל לביצוע <ShoppingCart size={28} className="text-blue-600" />
             </button>
          </div>
        </div>

        <footer className="py-20 border-t border-white/5 opacity-20 text-center uppercase text-[12px] font-black tracking-[1.5em] text-white">
           Saban Visual Intelligence V43.0
        </footer>
      </div>
    </div>
  );
}

function ProductCalculator({ coverage }: { coverage: number }) {
  const [inputs, setInputs] = useState({ length: "", height: "", waste: "5" });

  const units = useMemo(() => {
    const l = parseFloat(inputs.length) || 0;
    const h = parseFloat(inputs.height) || 0;
    const wst = parseFloat(inputs.waste) || 5;
    if (l === 0 || h === 0) return 0;
    return Math.ceil((l * h * (1 + wst/100)) / coverage);
  }, [inputs, coverage]);

  return (
    <div className="bg-slate-950/40 border border-white/5 rounded-[40px] p-8 space-y-6 shadow-2xl text-right">
       <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
             <Calculator size={22} className="text-blue-500" />
             <h4 className="font-black text-white italic uppercase text-sm tracking-widest">מחשבון כמויות</h4>
          </div>
          <button onClick={() => setInputs({length:'', height:'', waste:'5'})} className="text-slate-600 hover:text-white transition-all"><RotateCcw size={16}/></button>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase italic">אורך</label>
             <input type="number" value={inputs.length} onChange={e => setInputs({...inputs, length: e.target.value})} className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white text-right outline-none" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase italic">גובה</label>
             <input type="number" value={inputs.height} onChange={e => setInputs({...inputs, height: e.target.value})} className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl text-white text-right outline-none" />
          </div>
       </div>
       <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[30px] flex items-center justify-between">
          <div className="text-right">
             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 italic">כמות מומלצת</p>
             <p className="text-4xl font-black text-white italic tracking-tighter">{units} <span className="text-xs">יחידות</span></p>
          </div>
       </div>
    </div>
  );
}

function getYoutubeId(url: string) {
  if (!url) return null;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
}
