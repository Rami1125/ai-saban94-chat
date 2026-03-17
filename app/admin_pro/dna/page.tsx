"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Save, X, Package, Clock, Gauge, Hammer, ShoppingCart, 
  ShieldCheck, Sparkles, Youtube, Image as ImageIcon, Tag, 
  FileText, Dna, Zap, Monitor, Smartphone as MobileIcon,
  PlayCircle, Maximize2, Plus, BrainCircuit, Search, ChevronRight,
  MoreVertical, Info, Layout, Award, Loader2, RefreshCw, Layers,
  Edit3, Trash2, Smartphone, ArrowUpRight, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V82.0 - DNA Product Designer Studio
 * -------------------------------------------
 * - Workspace: Executive Dark Form (Slate-950) vs Samsung Note 25 Live Simulator.
 * - Hardware: Samsung Note 25 Pro High-Fidelity Mockup (Infinity Edge).
 * - Integration: Connected to Baserow Sync Logic & Supabase.
 */

const CATEGORIES = ['צבעים', 'ציפויים', 'כלי עבודה', 'דבקים', 'אביזרים', 'גבס', 'בטון ומלט'];

export default function ProductDNAStudio() {
  const [mounted, setMounted] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  
  // המוצר שנבחר לעריכה
  const [designItem, setDesignItem] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('inventory').select('*').order('product_name');
      if (error) throw error;
      setInventory(data || []);
    } catch (e) {
      toast.error("סנכרון מלאי נכשל");
    } finally {
      setLoading(false);
    }
  };

  // פונקציית השמירה שמתחברת ל-API ול-Database
  const handleSaveDNA = async () => {
    if (!designItem?.sku) return toast.error("חובה לבחור מוצר");
    setIsSaving(true);
    const toastId = toast.loading("מזריק DNA ומסנכרן ל-Baserow...");
    
    try {
      // 1. עדכון ב-Supabase (מקור האמת)
      const { error } = await supabase.from('inventory').upsert({
        ...designItem,
        last_trained: new Date().toISOString()
      });

      if (error) throw error;

      // 2. קריאה אופציונלית ל-Write-back API לסימולציה של סנכרון Baserow
      await fetch('/api/baserow-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'row_updated',
          row: designItem
        })
      });

      toast.success("ה-DNA הוזרק וסונכרן בהצלחה! 🦾", { id: toastId });
      fetchData();
    } catch (e: any) {
      toast.error("שגיאה בסנכרון: " + e.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && designItem) {
      const current = designItem.keywords ? designItem.keywords.split(',').map((k:any) => k.trim()) : [];
      if (!current.includes(keywordInput.trim())) {
        const updated = [...current, keywordInput.trim()].join(', ');
        setDesignItem({ ...designItem, keywords: updated });
      }
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    const updated = designItem.keywords.split(',').filter((k:any) => k.trim() !== kw.trim()).join(', ');
    setDesignItem({ ...designItem, keywords: updated });
  };

  const youtubeId = useMemo(() => {
    if (!designItem?.video_url) return null;
    const match = designItem.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return (match && match[1].length === 11) ? match[1] : null;
  }, [designItem?.video_url]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => 
      (i.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.sku || "").toString().includes(searchTerm)
    );
  }, [inventory, searchTerm]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-right selection:bg-blue-100" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      <div className="max-w-[1850px] mx-auto space-y-10">
        
        {/* --- Header Studio --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-full bg-blue-600/5 -skew-x-12 translate-x-16 group-hover:translate-x-8 transition-transform duration-1000" />
          <div className="flex items-center gap-10 relative z-10">
             <div className="w-24 h-24 bg-slate-950 text-blue-500 rounded-[40px] flex items-center justify-center shadow-2xl ring-8 ring-slate-50">
                <BrainCircuit size={48} />
             </div>
             <div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">DNA Designer Studio</h1>
                <p className="text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-[0.5em] flex items-center gap-2 justify-end">
                  Saban OS Elite V82.0 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </p>
             </div>
          </div>
          <div className="relative w-full lg:w-96 group z-10">
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
             <input 
               placeholder="חפש מוצר לעיצוב..." 
               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-slate-50 border-none pr-16 pl-8 py-6 rounded-[30px] font-black outline-none focus:ring-4 ring-blue-500/10 transition-all shadow-inner text-lg text-slate-900" 
             />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* --- Sidebar: Inventory --- */}
          <div className="xl:col-span-3 bg-white rounded-[55px] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[900px]">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center px-10">
                <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-3 tracking-widest leading-none italic">
                   <Layers size={18} className="text-blue-600"/> מאגר המלאי ({filteredInventory.length})
                </h3>
                <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 transition-all">
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[#FBFCFD]">
                {filteredInventory.map(item => (
                  <button 
                    key={item.sku}
                    onClick={() => setDesignItem(item)}
                    className={`w-full p-6 rounded-[35px] border-2 text-right transition-all group flex items-center justify-between ${designItem?.sku === item.sku ? 'bg-[#0F172A] border-[#0F172A] shadow-2xl scale-[1.03]' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-5 overflow-hidden">
                       <ProductThumb src={item.image_url} />
                       <div className="text-right truncate">
                          <p className={`font-black text-base leading-tight truncate ${designItem?.sku === item.sku ? 'text-white' : 'text-slate-900'}`}>{item.product_name || "ללא שם"}</p>
                          <p className={`text-[10px] font-black uppercase mt-2 ${designItem?.sku === item.sku ? 'text-blue-400' : 'text-slate-400'}`}>SKU {item.sku}</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className={designItem?.sku === item.sku ? 'text-blue-500 translate-x-1' : 'text-slate-200'} />
                  </button>
                ))}
             </div>
          </div>

          {/* --- Main Area --- */}
          <div className="xl:col-span-9 grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* 1. LEFT COLUMN: The Executive Editor */}
            <div className="lg:col-span-7 space-y-8">
               <AnimatePresence mode="wait">
                 {designItem ? (
                   <motion.div key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-slate-950 rounded-[60px] p-10 md:p-14 shadow-2xl border border-white/5 space-y-12 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
                      
                      <div className="flex justify-between items-center border-b border-white/10 pb-10 relative z-10">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner border border-white/5"><Edit3 size={28}/></div>
                            <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">DNA Configuration</h3>
                         </div>
                         <button onClick={() => setDesignItem(null)} className="p-4 bg-white/5 text-slate-500 rounded-2xl hover:bg-rose-500/20 hover:text-rose-500 transition-all"><X size={24}/></button>
                      </div>

                      <div className="space-y-12 overflow-y-auto max-h-[550px] scrollbar-hide pr-2">
                         {/* Core Info */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <DesignField label="שם מוצר רשמי" value={designItem.product_name} onChange={(v:any) => setDesignItem({...designItem, product_name: v})} />
                            <DesignField label="מק''ט זיהוי (SKU)" value={designItem.sku} disabled />
                            <DesignField label="מחירון יחידה (₪)" value={designItem.price} type="number" onChange={(v:any) => setDesignItem({...designItem, price: v})} />
                            <div className="space-y-3 text-right">
                               <label className="text-[10px] font-black uppercase text-slate-500 mr-3 italic tracking-widest leading-none">קטגוריה</label>
                               <select value={designItem.category} onChange={e => setDesignItem({...designItem, category: e.target.value})} className="w-full bg-slate-900 border-2 border-white/5 p-5 rounded-[22px] font-black text-xl text-white outline-none focus:border-blue-500 appearance-none cursor-pointer shadow-inner">
                                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                            </div>
                         </div>

                         {/* Media Section */}
                         <div className="space-y-6 pt-10 border-t border-white/5 text-right">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 justify-end italic">Media Assets Cluster <ImageIcon size={14}/></h4>
                            <DesignField label="תמונה ראשית (URL)" value={designItem.image_url} onChange={(v:any) => setDesignItem({...designItem, image_url: v})} />
                            <div className="grid grid-cols-2 gap-6">
                               <DesignField label="תמונה 2" value={designItem.image_url_2} onChange={(v:any) => setDesignItem({...designItem, image_url_2: v})} />
                               <DesignField label="תמונה 3" value={designItem.image_url_3} onChange={(v:any) => setDesignItem({...designItem, image_url_3: v})} />
                            </div>
                            <DesignField label="סרטון YouTube" value={designItem.video_url} onChange={(v:any) => setDesignItem({...designItem, video_url: v})} placeholder="https://..." />
                         </div>

                         {/* Technical DNA */}
                         <div className="space-y-6 pt-10 border-t border-white/5 text-right">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 justify-end italic">Technical Intelligence <Zap size={14}/></h4>
                            <div className="grid grid-cols-3 gap-6">
                               <DesignField label="ייבוש" value={designItem.drying_time} onChange={(v:any) => setDesignItem({...designItem, drying_time: v})} placeholder="24 שעות" />
                               <DesignField label="כיסוי" value={designItem.coverage_info} onChange={(v:any) => setDesignItem({...designItem, coverage_info: v})} placeholder="ק''ג/מ''ר" />
                               <DesignField label="יישום" value={designItem.application_method} onChange={(v:any) => setDesignItem({...designItem, application_method: v})} placeholder="מריחה" />
                            </div>
                            <div className="space-y-3" dir="rtl">
                               <label className="text-[10px] font-black uppercase text-slate-500 mr-3 flex items-center gap-2 justify-end">מילון סלנג (DNA Keywords) <Tag size={12}/></label>
                               <div className="flex gap-3">
                                  <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} placeholder="הקלד מילה והקש Enter..." className="flex-1 bg-slate-900 border-2 border-white/5 p-5 rounded-[22px] font-black text-xl text-white outline-none focus:border-blue-500 shadow-inner" />
                                  <button onClick={addKeyword} className="px-8 bg-blue-600 text-white rounded-2xl font-black active:scale-90 shadow-xl">+</button>
                               </div>
                               <div className="flex flex-wrap gap-2 mt-4">
                                  {(designItem.keywords || "").split(',').filter(Boolean).map((kw: string) => (
                                    <span key={kw} className="bg-blue-600/20 text-blue-400 px-5 py-2.5 rounded-xl text-xs font-black uppercase border border-blue-500/20 flex items-center gap-2 shadow-sm">
                                       {kw.trim()}
                                       <X size={14} className="cursor-pointer hover:text-rose-500 transition-colors" onClick={() => removeKeyword(kw)} />
                                    </span>
                                  ))}
                               </div>
                            </div>
                         </div>

                         {/* Description Specifications */}
                         <div className="space-y-4 pt-10 border-t border-white/5 text-right">
                            <label className="text-[11px] font-black text-slate-500 uppercase mr-3 tracking-[0.2em] italic leading-none block">Full Technical Specifications</label>
                            <textarea 
                               onChange={(e) => setDesignItem({...designItem, description: e.target.value})} 
                               className="w-full bg-slate-900 border-2 border-white/5 p-8 rounded-[40px] font-bold text-lg text-white outline-none focus:border-blue-500 transition-all h-48 text-right shadow-inner leading-relaxed scrollbar-hide italic" 
                               value={designItem.description || ""}
                               placeholder="פרט כאן את כל היתרונות והנתונים הטכניים לביצוע מושלם..."
                            />
                         </div>
                      </div>

                      <div className="pt-10 flex justify-end gap-6 border-t border-white/10">
                         <button onClick={() => setDesignItem(null)} className="px-14 py-6 rounded-[35px] font-black text-slate-500 hover:text-white transition-all uppercase text-xs italic tracking-widest">Discard Changes</button>
                         <button onClick={handleSaveDNA} disabled={isSaving} className="px-24 py-7 bg-blue-600 text-white rounded-[40px] font-black text-xl uppercase italic tracking-[0.2em] shadow-2xl flex items-center gap-6 hover:bg-blue-500 transition-all border-b-[12px] border-blue-900 active:scale-95 disabled:opacity-50">
                            {isSaving ? <Loader2 className="animate-spin" size={32}/> : <Save size={32}/>}
                            Inject & Sync DNA 🦾
                         </button>
                      </div>
                   </motion.div>
                 ) : (
                   <div className="h-[900px] bg-white rounded-[70px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-20 shadow-inner group">
                      <div className="w-36 h-36 bg-slate-50 rounded-[50px] flex items-center justify-center text-slate-200 mb-10 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                         <Dna size={80} strokeWidth={1} />
                      </div>
                      <h3 className="text-4xl font-black text-slate-900 italic uppercase mb-6 tracking-tighter leading-none">Studio Ready</h3>
                      <p className="text-slate-400 max-w-md font-bold text-base leading-relaxed uppercase tracking-widest italic opacity-60">בחר מוצר מהמאגר מימין כדי להתחיל את תהליך הזרקת ה-DNA. כל שינוי ישתקף בסימולטור ה-Note 25 בזמן אמת.</p>
                   </div>
                 )}
               </AnimatePresence>
            </div>

            {/* 2. RIGHT COLUMN: Live Samsung Note 25 Simulator */}
            <div className="lg:col-span-5 flex flex-col items-center sticky top-10">
               <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-full border border-slate-200 shadow-md mb-8">
                  <MobileIcon className="text-blue-500" size={24} />
                  <span className="h-6 w-[2px] bg-slate-100" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic mr-2 text-right leading-none">NOTE 25 SIMULATOR</span>
               </div>

               <div className="relative bg-[#020617] rounded-[80px] border-[15px] border-slate-800 shadow-[0_80px_160px_rgba(0,0,0,0.6)] w-full max-w-[420px] aspect-[9/19.5] flex flex-col overflow-hidden group">
                  {/* Punch Hole - Precise Note 25 Mockup */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50 border border-slate-700 shadow-inner ring-1 ring-white/5" />
                  
                  {/* App Layer */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-white/5 backdrop-blur-3xl m-3 rounded-[60px] border border-white/5 p-6 space-y-6 text-white text-right" dir="rtl">
                     <div className="flex justify-between items-center pt-6 px-3">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md"><ChevronRight size={24}/></div>
                        <img src="/ai.png" className="h-9 opacity-90 drop-shadow-xl" alt="Saban" />
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md"><MoreVertical size={20}/></div>
                     </div>

                     {/* Image Collage Stitched UI */}
                     <div className="grid grid-cols-12 gap-3 h-64 mx-2">
                        <div className="col-span-8 bg-slate-900 rounded-[40px] overflow-hidden relative border border-white/10 shadow-2xl group/img">
                           <AssetSimulatorPreview url={designItem?.image_url} size="lg" />
                           <div className="absolute bottom-5 left-5 bg-black/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg"><Maximize2 size={16}/></div>
                        </div>
                        <div className="col-span-4 flex flex-col gap-3">
                           <div className="flex-1 bg-slate-900 rounded-[25px] overflow-hidden border border-white/10 shadow-lg">
                              <AssetSimulatorPreview url={designItem?.image_url_2} size="sm" />
                           </div>
                           <div className="flex-1 bg-slate-900 rounded-[25px] overflow-hidden border border-white/10 shadow-lg">
                              <AssetSimulatorPreview url={designItem?.image_url_3} size="sm" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4 pt-6 px-4 text-right">
                        <div className="flex items-center gap-3 justify-end">
                           <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/20 shadow-sm flex items-center gap-2 leading-none italic uppercase">
                              <Award size={10}/> Elite DNA
                           </span>
                           <ShieldCheck size={22} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                        </div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">{designItem?.product_name || "Waiting for Input..."}</h2>
                        <div className="flex items-center gap-4 opacity-60 justify-end font-bold text-[10px] tracking-widest">
                           <span>SKU: {designItem?.sku || "----"}</span>
                           <span className="h-3 w-[1px] bg-white/20" />
                           <span className="uppercase italic">{designItem?.category || "Industrial Grade"}</span>
                        </div>
                     </div>

                     {/* Tech DNA Grid */}
                     <div className="grid grid-cols-3 gap-3 px-4 py-2">
                        <SmallSimStat icon={<Clock size={16}/>} label="Drying" value={designItem?.drying_time} />
                        <SmallSimStat icon={<Gauge size={16}/>} label="Coverage" value={designItem?.coverage_info} />
                        <SmallSimStat icon={<Hammer size={16}/>} label="Method" value={designItem?.application_method} />
                     </div>

                     {/* Video Player Integrator */}
                     {youtubeId && (
                        <div className="mx-4 aspect-video bg-black rounded-[45px] overflow-hidden border border-white/5 shadow-2xl relative group">
                           <iframe className="w-full h-full pointer-events-none opacity-60 grayscale-[0.4] group-hover:grayscale-0 transition-all duration-700" src={`https://www.youtube.com/embed/${youtubeId}?modestbranding=1&controls=0&mute=1`} frameBorder="0" />
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/10 backdrop-blur-[2px]">
                              <PlayCircle size={64} className="text-white drop-shadow-2xl opacity-80 animate-pulse" strokeWidth={1} />
                              <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-3 text-blue-100 italic">Guide Mode Active</p>
                           </div>
                        </div>
                     )}

                     {/* Advisor Intelligence Box */}
                     <div className="bg-blue-600/10 border border-blue-500/10 p-10 rounded-[50px] relative overflow-hidden mx-4 shadow-inner">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full" />
                        <div className="relative z-10 flex items-center gap-3 mb-5 text-blue-400 justify-end leading-none">
                           <span className="text-[11px] font-black uppercase tracking-widest italic">Saban Pro Advisor</span>
                           <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <p className="text-[16px] font-bold leading-relaxed opacity-70 italic text-right truncate-5-lines">
                           {designItem?.description || "מפרט טכני מלא יופיע כאן ברגע שיוזן במערכת המנהל..."}
                        </p>
                     </div>

                     {/* Bottom Fixed Action Button */}
                     <div className="pt-6 pb-20 px-4">
                        <div className="w-full bg-white text-slate-900 py-8 rounded-[50px] font-black text-[14px] uppercase tracking-[0.6em] flex items-center justify-center gap-5 italic shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-b-[10px] border-slate-200 active:scale-95 transition-all hover:bg-blue-50">
                           ADD TO COMMAND <ShoppingCart size={30} className="text-blue-600" />
                        </div>
                     </div>
                  </div>

                  {/* Note 25 Indicator Bar */}
                  <div className="h-16 bg-[#020617] border-t border-white/5 flex items-center justify-center px-12 relative z-50">
                     <div className="w-32 h-1.5 bg-slate-700 rounded-full shadow-inner" />
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
      
      <footer className="py-40 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[4em] italic text-slate-900 leading-none">Saban OS Neural Design Studio V82.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .truncate-5-lines { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }`}</style>
    </div>
  );
}

// --- Internal UI Helpers ---

function DesignField({ label, value, type = "text", onChange, placeholder, disabled }: any) {
  return (
    <div className="space-y-4 text-right" dir="rtl">
       <label className="text-[11px] font-black text-slate-400 uppercase mr-3 tracking-[0.2em] italic block text-right leading-none">{label}</label>
       <input 
          disabled={disabled} type={type} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-full bg-slate-900 border-2 border-white/5 p-6 rounded-[25px] font-black text-xl text-white outline-none focus:border-blue-500 transition-all text-right shadow-inner disabled:opacity-30 italic placeholder:text-slate-800" 
          value={value || ""} placeholder={placeholder} 
       />
    </div>
  );
}

function AssetSimulatorPreview({ url, size }: { url: string, size: "sm" | "lg" }) {
  const [err, setErr] = useState(false);
  if (!url || err) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 bg-slate-950 shadow-inner border border-white/5">
       <ImageIcon size={size === "lg" ? 48 : 24} strokeWidth={1} className="opacity-10" />
    </div>
  );
  return <img src={url} className="w-full h-full object-cover shadow-2xl transition-all duration-1000 group-hover:scale-105" alt="Preview" onError={() => setErr(true)} />;
}

function ProductThumb({ src }: { src: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100 shrink-0 shadow-inner"><ImageIcon size={20}/></div>;
  return <img src={src} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white shrink-0" alt="Thumb" onError={() => setErr(true)} />;
}

function SmallSimStat({ icon, label, value }: any) {
  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-[35px] text-center shadow-inner group hover:bg-white/10 transition-all overflow-hidden text-right border-b-2 border-b-blue-500/10">
       <div className="text-blue-500 mx-auto mb-3 flex justify-center drop-shadow-md">{icon}</div>
       <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none text-center italic">{label}</p>
       <p className="text-[12px] font-black text-white italic tracking-tighter truncate text-center leading-none">{value || "--"}</p>
    </div>
  );
}
