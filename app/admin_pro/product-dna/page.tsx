"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, X, Package, Clock, Gauge, Hammer, ShoppingCart, 
  ShieldCheck, Sparkles, Youtube, Image as ImageIcon, Tag, 
  FileText, Dna, Zap, Monitor, Smartphone, PlayCircle, 
  Maximize2, Plus, BrainCircuit, Search, ChevronRight,
  MoreVertical, Info, Layout, Award
} from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "sonner";

/**
 * Saban OS V79.0 - DNA Product Designer Studio
 * -------------------------------------------
 * - Workspace: Executive Dark Form (Left) vs Samsung Note 25 Live Simulator (Right).
 * - Interaction: Real-time data binding and visual confirmation.
 * - Hardware Mockup: Samsung Note 25 with Infinity Display & Center Punch-hole.
 */

const CATEGORIES = ['צבעים', 'ציפויים', 'כלי עבודה', 'דבקים', 'אביזרים', 'גבס', 'בטון ומלט'];

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  
  // Core State for the Designer
  const [product, setProduct] = useState({
    product_name: "לוח גבס 4K ירוק",
    sku: "76208",
    price: "85.00",
    category: "גבס",
    image_url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600",
    image_url_2: "",
    image_url_3: "",
    video_url: "https://www.youtube.com/watch?v=q-5jjkev9hY",
    drying_time: "24 שעות",
    coverage_info: "3 מ''ר ללוח",
    application_method: "הברגה ישירה",
    keywords: "גבס ירוק, לוח גבס, גפלט, עמיד לחות",
    description: "לוח גבס מקצועי עמיד לחות (ירוק) המיועד לביצוע בחדרים רטובים וסביבות לחות. מפרט תקני מלא כולל הגנה נוירולוגית ומבנה 4K חזק במיוחד."
  });

  useEffect(() => { setMounted(true); }, []);

  const updateField = (field: string, value: any) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const current = product.keywords ? product.keywords.split(',').map(k => k.trim()) : [];
      if (!current.includes(keywordInput.trim())) {
        const updated = [...current, keywordInput.trim()].join(', ');
        updateField('keywords', updated);
      }
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    const updated = product.keywords.split(',').filter(k => k.trim() !== kw.trim()).join(', ');
    updateField('keywords', updated);
  };

  const youtubeId = useMemo(() => {
    if (!product.video_url) return null;
    const match = product.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return (match && match[1].length === 11) ? match[1] : null;
  }, [product.video_url]);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading("מזריק DNA למערכת...");
    try {
      const { error } = await supabase.from('inventory').upsert({
        ...product,
        last_trained: new Date().toISOString()
      });
      if (error) throw error;
      toast.success("המוצר סונכרן לביצוע בשטח! 🦾", { id: toastId });
    } catch (e: any) {
      toast.error("שגיאה בסנכרון: " + e.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      <div className="max-w-[1800px] mx-auto space-y-10">
        
        {/* --- Sidebar / Header --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-8 rounded-[50px] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-full bg-blue-600/5 -skew-x-12 translate-x-16 group-hover:translate-x-8 transition-transform duration-1000" />
          <div className="flex items-center gap-8 relative z-10">
             <div className="w-20 h-20 bg-slate-950 text-blue-500 rounded-[35px] flex items-center justify-center shadow-2xl ring-8 ring-slate-50">
                <BrainCircuit size={40} />
             </div>
             <div>
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">DNA Designer Studio</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.4em] flex items-center gap-2 justify-end">
                   Saban OS Elite Suite <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </p>
             </div>
          </div>
          <div className="flex items-center gap-6 relative z-10">
             <StatMini label="Assets" value="142" />
             <StatMini label="Trained" value="92%" color="text-emerald-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* --- LEFT COLUMN: Form Area --- */}
          <div className="lg:col-span-7 bg-slate-950 rounded-[60px] p-8 md:p-12 shadow-2xl border border-white/5 space-y-12 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
             
             <header className="flex justify-between items-center border-b border-white/10 pb-10 relative z-10">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner"><Dna size={28}/></div>
                   <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">Edit Asset DNA</h3>
                </div>
                <button onClick={() => window.location.reload()} className="p-4 bg-white/5 text-slate-500 rounded-2xl hover:bg-rose-500/20 hover:text-rose-500 transition-all"><X size={24}/></button>
             </header>

             <div className="space-y-12 relative z-10">
                {/* 1. Core Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <InputGroup label="שם מוצר רשמי" value={product.product_name} onChange={(v) => updateField('product_name', v)} />
                   <InputGroup label="מק''ט זיהוי (Disabled)" value={product.sku} disabled />
                   <InputGroup label="מחיר יחידה (ILS)" value={product.price} type="number" onChange={(v) => updateField('price', v)} />
                   <div className="space-y-3 text-right">
                      <label className="text-[10px] font-black uppercase text-slate-500 mr-2 tracking-widest italic">קטגוריה</label>
                      <select 
                        value={product.category}
                        onChange={(e) => updateField('category', e.target.value)}
                        className="w-full bg-slate-900 border-2 border-white/5 p-5 rounded-3xl font-black text-xl text-white outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer shadow-inner"
                      >
                         {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                </div>

                {/* 2. Media Matrix */}
                <div className="space-y-6 pt-10 border-t border-white/5">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 justify-end italic">Media Asset Matrix <ImageIcon size={14}/></h4>
                   <InputGroup label="לינק תמונה ראשית" value={product.image_url} onChange={(v) => updateField('image_url', v)} placeholder="https://..." />
                   <div className="grid grid-cols-2 gap-6">
                      <InputGroup label="תמונה משנית 2" value={product.image_url_2} onChange={(v) => updateField('image_url_2', v)} />
                      <InputGroup label="תמונה משנית 3" value={product.image_url_3} onChange={(v) => updateField('image_url_3', v)} />
                   </div>
                   <InputGroup label="לינק סרטון יוטיוב (יישום)" value={product.video_url} onChange={(v) => updateField('video_url', v)} placeholder="https://youtube.com/watch?v=..." />
                </div>

                {/* 3. Tech DNA */}
                <div className="space-y-6 pt-10 border-t border-white/5 text-right">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 justify-end italic">Technical Intelligence <Zap size={14}/></h4>
                   <div className="grid grid-cols-3 gap-6">
                      <InputGroup label="זמן ייבוש" value={product.drying_time} onChange={(v) => updateField('drying_time', v)} placeholder="24 שעות" />
                      <InputGroup label="כושר כיסוי" value={product.coverage_info} onChange={(v) => updateField('coverage_info', v)} placeholder="ק''ג למ''ר" />
                      <InputGroup label="שיטת יישום" value={product.application_method} onChange={(v) => updateField('application_method', v)} placeholder="מריחה/התזה" />
                   </div>
                   
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 mr-2 tracking-widest italic flex items-center gap-2 justify-end">מילון סלנג (DNA Keywords) <Tag size={12}/></label>
                      <div className="flex gap-3">
                         <input 
                           value={keywordInput} 
                           onChange={(e) => setKeywordInput(e.target.value)} 
                           onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                           placeholder="הקלד מילה (למשל: בורג גפלט) והקש Enter"
                           className="flex-1 bg-slate-900 border-2 border-white/5 p-5 rounded-3xl font-black text-lg text-white outline-none focus:border-blue-600 shadow-inner" 
                         />
                         <button onClick={addKeyword} className="px-8 bg-blue-600 text-white rounded-2xl font-black text-2xl active:scale-90">+</button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                         {product.keywords.split(',').filter(Boolean).map((kw, i) => (
                           <span key={i} className="bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-blue-500/20 flex items-center gap-2">
                              {kw.trim()}
                              <X size={12} className="cursor-pointer hover:text-white" onClick={() => removeKeyword(kw)} />
                           </span>
                         ))}
                      </div>
                   </div>
                </div>

                {/* 4. Description Area */}
                <div className="space-y-4 pt-10 border-t border-white/5">
                   <label className="text-[10px] font-black text-slate-500 uppercase mr-2 tracking-widest italic block">Full Technical Specifications</label>
                   <textarea 
                     value={product.description}
                     onChange={(e) => updateField('description', e.target.value)}
                     className="w-full bg-slate-900 border-2 border-white/5 p-8 rounded-[40px] font-bold text-lg text-white outline-none focus:border-blue-600 transition-all h-48 text-right shadow-inner leading-relaxed scrollbar-hide"
                     placeholder="פרט כאן את כל הנתונים הטכניים והיתרונות ללקוח..."
                   />
                </div>
             </div>

             {/* Footer Actions */}
             <div className="pt-10 flex justify-end gap-6 border-t border-white/10">
                <button className="px-12 py-6 rounded-[30px] font-black text-slate-500 hover:text-white transition-all uppercase text-xs italic tracking-widest">Discard</button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-20 py-7 bg-blue-600 text-white rounded-[40px] font-black text-xl uppercase italic tracking-[0.3em] shadow-2xl flex items-center gap-6 hover:bg-blue-500 active:scale-95 transition-all border-b-[10px] border-blue-900 disabled:opacity-50"
                >
                   {isSaving ? <Loader2 className="animate-spin" size={32}/> : <Save size={32}/>}
                   Inject & Sync DNA 🦾
                </button>
             </div>
          </div>

          {/* --- RIGHT COLUMN: Live Samsung Note 25 Simulator --- */}
          <div className="lg:col-span-5 flex flex-col items-center">
             <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-full border border-slate-200 shadow-md mb-8">
                <Monitor size={22} className="text-blue-500" />
                <span className="h-6 w-[2px] bg-slate-100" />
                <MobileIcon size={22} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic mr-2">SAMSUNG NOTE 25 SIMULATOR</span>
             </div>

             {/* The Phone Frame */}
             <div className="relative bg-[#020617] rounded-[75px] border-[12px] border-slate-800 shadow-[0_80px_160px_rgba(0,0,0,0.6)] w-full max-w-[420px] aspect-[9/19.5] flex flex-col overflow-hidden group">
                
                {/* Note 25 Center Punch-hole Camera */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-50 border border-slate-700 shadow-inner" />
                
                {/* Screen Reflections */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none z-10" />

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-white/5 backdrop-blur-3xl m-2.5 rounded-[60px] border border-white/5 p-6 space-y-6 text-white text-right" dir="rtl">
                   
                   {/* 1. App Navigation Mockup */}
                   <div className="flex justify-between items-center pt-5 px-3">
                      <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md"><ChevronRight size={20}/></div>
                      <img src="/ai.png" className="h-8 opacity-90 drop-shadow-xl" alt="Saban" />
                      <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md"><MoreVertical size={18}/></div>
                   </div>

                   {/* 2. Advanced Stitched Collage */}
                   <div className="grid grid-cols-12 gap-3 h-64 mx-2">
                      <div className="col-span-8 bg-slate-900 rounded-[35px] overflow-hidden relative border border-white/10 shadow-2xl group/img">
                         <SimAsset src={product.image_url} />
                         <div className="absolute bottom-4 left-4 bg-black/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md"><Maximize2 size={14}/></div>
                      </div>
                      <div className="col-span-4 flex flex-col gap-3">
                         <div className="flex-1 bg-slate-900 rounded-[22px] overflow-hidden border border-white/10 shadow-lg">
                            <SimAsset src={product.image_url_2} size="sm" />
                         </div>
                         <div className="flex-1 bg-slate-900 rounded-[22px] overflow-hidden border border-white/10 shadow-lg">
                            <SimAsset src={product.image_url_3} size="sm" />
                         </div>
                      </div>
                   </div>

                   {/* 3. Identity Header */}
                   <div className="space-y-4 pt-4 px-4">
                      <div className="flex items-center gap-3 justify-end">
                         <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/20 shadow-sm flex items-center gap-2">
                            <Award size={10}/> Elite Asset
                         </span>
                         <ShieldCheck size={20} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                      <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none drop-shadow-lg">{product.product_name || "Waiting for Input..."}</h2>
                      <div className="flex items-center gap-3 opacity-60 justify-end font-bold text-[10px]">
                         <span>SKU: {product.sku || "----"}</span>
                         <span className="h-3 w-[1px] bg-white/20" />
                         <span className="uppercase italic tracking-widest">{product.category || "Building Materials"}</span>
                      </div>
                   </div>

                   {/* 4. Tech DNA Matrix */}
                   <div className="grid grid-cols-3 gap-2 px-4 py-2">
                      <TechPill icon={<Clock size={14}/>} label="Drying" value={product.drying_time} />
                      <TechPill icon={<Gauge size={14}/>} label="Coverage" value={product.coverage_info} />
                      <TechPill icon={<Hammer size={14}/>} label="Method" value={product.application_method} />
                   </div>

                   {/* 5. Video Integrator */}
                   {youtubeId && (
                      <div className="mx-4 aspect-video bg-black rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative group">
                         <iframe className="w-full h-full pointer-events-none opacity-60 grayscale-[0.5] group-hover:grayscale-0 transition-all" src={`https://www.youtube.com/embed/${youtubeId}?modestbranding=1&controls=0&mute=1`} frameBorder="0" />
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/10 backdrop-blur-[1px]">
                            <PlayCircle size={64} className="text-white drop-shadow-2xl opacity-70" strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-3 text-blue-100">Application Guide</p>
                         </div>
                      </div>
                   )}

                   {/* 6. Advisor Intelligence Box */}
                   <div className="bg-blue-600/10 border border-blue-500/10 p-8 rounded-[45px] relative overflow-hidden mx-4 shadow-inner">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full" />
                      <div className="relative z-10 flex items-center gap-3 mb-4 text-blue-400 justify-end">
                         <span className="text-[11px] font-black uppercase tracking-widest italic">Saban Pro Advisor</span>
                         <Sparkles size={16} className="animate-pulse" />
                      </div>
                      <p className="text-[15px] font-bold leading-relaxed opacity-70 italic text-right truncate-4-lines">
                         {product.description || "מפרט טכני מלא יופיע כאן ברגע שיוזן במערכת המנהל..."}
                      </p>
                   </div>

                   {/* 7. Action Matrix */}
                   <div className="pt-6 pb-14 px-4">
                      <div className="w-full bg-white text-slate-900 py-8 rounded-[45px] font-black text-[13px] uppercase tracking-[0.5em] flex items-center justify-center gap-5 italic shadow-[0_25px_50px_rgba(0,0,0,0.4)] border-b-[8px] border-slate-200 active:scale-95 transition-all hover:bg-blue-50">
                         ADD TO COMMAND <ShoppingCart size={26} className="text-blue-600" />
                      </div>
                   </div>
                </div>

                {/* Note 25 Navigation Bar */}
                <div className="h-16 bg-[#020617] border-t border-white/5 flex items-center justify-center px-12 relative z-50">
                   <div className="w-32 h-1.5 bg-slate-700 rounded-full" />
                </div>
             </div>
             <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Samsung Note 25 Physical Mockup</p>
          </div>
        </div>
      </div>
      
      <footer className="py-24 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[3em] italic text-slate-900 leading-none">Saban OS Neural Design Suite V79.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .truncate-4-lines { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }`}</style>
    </div>
  );
}

// --- Internal Helper Components ---

function InputGroup({ label, value, type = "text", onChange, placeholder, disabled }: any) {
  return (
    <div className="space-y-3 text-right">
       <label className="text-[10px] font-black text-slate-500 uppercase mr-3 tracking-widest italic block text-right leading-none">{label}</label>
       <input 
          disabled={disabled} 
          type={type} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-full bg-slate-900 border-2 border-white/5 p-5 rounded-[22px] font-black text-xl text-white outline-none focus:border-blue-600 transition-all text-right shadow-inner disabled:opacity-30 italic placeholder:text-slate-700" 
          value={value || ""} 
          placeholder={placeholder} 
       />
    </div>
  );
}

function StatMini({ label, value, color = "text-slate-900" }: any) {
  return (
    <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 shadow-inner text-center min-w-[120px]">
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
       <p className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</p>
    </div>
  );
}

function TechPill({ icon, label, value }: any) {
  return (
    <div className="bg-white/5 border border-white/5 p-5 rounded-[30px] text-center shadow-inner group hover:bg-white/10 transition-all overflow-hidden text-right border-b-2 border-b-blue-500/10">
       <div className="text-blue-500 mx-auto mb-3 flex justify-center drop-shadow-md">{icon}</div>
       <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1.5 leading-none text-center">{label}</p>
       <p className="text-[11px] font-black text-white italic tracking-tighter truncate text-center">{value || "--"}</p>
    </div>
  );
}

function SimAsset({ src, size = "lg" }: { src: string, size?: "sm" | "lg" }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 bg-slate-950 shadow-inner">
       <ImageIcon size={size === "lg" ? 36 : 18} strokeWidth={1} className="opacity-20" />
    </div>
  );
  return <img src={src} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" onError={() => setErr(true)} />;
}
