"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Save, X, Package, Clock, Gauge, Hammer, ShoppingCart,
  ShieldCheck, Sparkles, Youtube, Image as ImageIcon, Tag,
  FileText, Dna, Zap, ChevronRight, RefreshCw, Search,
  Loader2, Plus, Maximize2, Monitor, Smartphone as MobileIcon,
  PlayCircle, Layers, BrainCircuit, Smartphone, Layout, 
  ArrowUpRight, Info, Award, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V76.0 - Product DNA Designer Studio (Executive Note 25 Edition)
 * -------------------------------------------------------------------
 * - Fix: Solved ReferenceErrors (BrainCircuit, ShoppingCart).
 * - Tool: Integrated Live Simulator for VIP Experience.
 * - Logic: Direct real-time injection to inventory columns.
 */

const CATEGORIES = ['צבעים', 'ציפויים', 'כלי עבודה', 'דבקים', 'אביזרים', 'גבס', 'בטון ומלט'];

export default function ProductDNAStudio() {
  const [mounted, setMounted] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [designItem, setDesignItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

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
    } catch (e: any) {
      toast.error("סנכרון מלאי נכשל");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDNA = async () => {
    if (!designItem?.sku) return toast.error("חובה להזין מק\"ט");
    setIsSaving(true);
    const toastId = toast.loading("מזריק DNA Elite למערכת...");
    
    try {
      const { error } = await supabase.from('inventory').upsert({
        ...designItem,
        last_trained: new Date().toISOString()
      });

      if (error) throw error;
      toast.success("המוצר סונכרן לביצוע בשטח! 🦾", { id: toastId });
      fetchData();
    } catch (e: any) {
      toast.error("שגיאה בעדכון: " + e.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const currentKws = designItem.keywords ? designItem.keywords.split(',').map((k:any) => k.trim()) : [];
      if (!currentKws.includes(keywordInput.trim())) {
        const newKws = [...currentKws, keywordInput.trim()].join(', ');
        setDesignItem({ ...designItem, keywords: newKws });
      }
      setKeywordInput('');
    }
  };

  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => 
      (i.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.sku || "").toString().includes(searchTerm)
    );
  }, [inventory, searchTerm]);

  // רכיב טיפול בתמונות שבורות (404)
  const ProductImage = ({ src, size = "md" }: { src: string, size?: "sm" | "md" | "lg" }) => {
    const [err, setErr] = useState(false);
    const s = size === "lg" ? "w-full h-full" : size === "md" ? "w-20 h-20" : "w-16 h-16";
    if (!src || err) return (
      <div className={`${s} bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-700 border border-white/5`}>
        <ImageIcon size={size === "lg" ? 48 : 24} strokeWidth={1} />
        {size === "lg" && <p className="text-[10px] font-black uppercase mt-2 opacity-20 italic">No Asset</p>}
      </div>
    );
    return <img src={src} className={`${s} rounded-2xl object-cover shadow-2xl transition-all duration-500`} onError={() => setErr(true)} />;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      <div className="max-w-[1850px] mx-auto space-y-8">
        
        {/* --- Header Elite --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-full bg-blue-600/5 -skew-x-12 translate-x-16 group-hover:translate-x-8 transition-transform duration-1000" />
          <div className="flex items-center gap-10 relative z-10">
             <div className="w-24 h-24 bg-slate-950 text-blue-500 rounded-[40px] flex items-center justify-center shadow-2xl ring-8 ring-slate-50">
                <BrainCircuit size={48} />
             </div>
             <div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">DNA Designer Studio</h1>
                <p className="text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-[0.5em] flex items-center gap-2 justify-end">
                  Neural Alignment Suite v76.0 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </p>
             </div>
          </div>
          <div className="relative w-full lg:w-96 group z-10">
             <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
             <input 
               placeholder="חפש מוצר לעיצוב..." 
               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-slate-50 border-none pr-16 pl-8 py-5 rounded-[30px] font-black outline-none focus:ring-4 ring-blue-500/10 transition-all shadow-inner text-lg text-right" 
             />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* --- Inventory Sidebar --- */}
          <div className="xl:col-span-3 bg-white rounded-[55px] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[900px]">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-3 tracking-widest leading-none">
                   <Layers size={18} className="text-blue-600"/> מאגר המלאי ({filteredInventory.length})
                </h3>
                <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><RefreshCw size={18} className={loading ? 'animate-spin' : ''}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-[#FBFCFD]">
                {filteredInventory.map(item => (
                  <button 
                    key={item.sku}
                    onClick={() => setDesignItem(item)}
                    className={`w-full p-6 rounded-[35px] border-2 text-right transition-all group flex items-center justify-between ${designItem?.sku === item.sku ? 'bg-[#0F172A] border-[#0F172A] shadow-2xl scale-[1.03]' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-5 overflow-hidden">
                       <ProductImage src={item.image_url} size="sm" />
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

          {/* --- Editor & Simulator Main Area --- */}
          <div className="xl:col-span-9 grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* 1. Designer Workspace */}
            <div className="lg:col-span-7 space-y-8">
               <AnimatePresence mode="wait">
                 {designItem ? (
                   <motion.div key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-slate-950 rounded-[60px] p-10 md:p-14 shadow-2xl border border-slate-800 space-y-12 relative overflow-hidden">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-10 relative z-10 text-right">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner"><Edit3 size={28}/></div>
                            <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">DNA Configuration</h3>
                         </div>
                         <button onClick={() => setDesignItem(null)} className="p-4 bg-slate-900 text-slate-400 rounded-2xl hover:bg-rose-500/20 hover:text-rose-500 transition-all"><X size={24}/></button>
                      </div>

                      <div className="space-y-12">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <DesignField label="שם מוצר רשמי" value={designItem.product_name} onChange={(v:any) => setDesignItem({...designItem, product_name: v})} />
                            <DesignField label="מק''ט (SKU)" value={designItem.sku} disabled />
                            <DesignField label="מחירון (₪)" value={designItem.price} type="number" onChange={(v:any) => setDesignItem({...designItem, price: v})} />
                            <div className="space-y-3 text-right" dir="rtl">
                               <label className="text-[10px] font-black uppercase text-slate-500 mr-3">קטגוריה</label>
                               <select value={designItem.category} onChange={e => setDesignItem({...designItem, category: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 p-5 rounded-[22px] font-black text-xl text-white outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                            </div>
                         </div>

                         <div className="space-y-6 pt-10 border-t border-slate-800 text-right">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 justify-end italic">Media Asset Management <ImageIcon size={14}/></h4>
                            <DesignField label="תמונה ראשית (URL)" value={designItem.image_url} onChange={(v:any) => setDesignItem({...designItem, image_url: v})} />
                            <div className="grid grid-cols-2 gap-4">
                               <DesignField label="תמונה 2" value={designItem.image_url_2} onChange={(v:any) => setDesignItem({...designItem, image_url_2: v})} />
                               <DesignField label="תמונה 3" value={designItem.image_url_3} onChange={(v:any) => setDesignItem({...designItem, image_url_3: v})} />
                            </div>
                            <DesignField label="סרטון YouTube" value={designItem.video_url} onChange={(v:any) => setDesignItem({...designItem, video_url: v})} placeholder="https://..." />
                         </div>

                         <div className="space-y-6 pt-10 border-t border-slate-800 text-right">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 justify-end italic">Technical Intelligence <Zap size={14}/></h4>
                            <div className="grid grid-cols-3 gap-4">
                               <DesignField label="ייבוש" value={designItem.drying_time} onChange={(v:any) => setDesignItem({...designItem, drying_time: v})} placeholder="24 שעות" />
                               <DesignField label="כיסוי" value={designItem.coverage_info} onChange={(v:any) => setDesignItem({...designItem, coverage_info: v})} placeholder="ק''ג/מ''ר" />
                               <DesignField label="שיטה" value={designItem.application_method} onChange={(v:any) => setDesignItem({...designItem, application_method: v})} placeholder="מריחה" />
                            </div>
                            <div className="space-y-3" dir="rtl">
                               <label className="text-[10px] font-black uppercase text-slate-500 mr-3 flex items-center gap-2 justify-end">מילון סלנג שטח <Tag size={12}/></label>
                               <div className="flex gap-2">
                                  <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} placeholder="הקלד מילה והקש Enter" className="flex-1 bg-slate-900 border-2 border-slate-800 p-5 rounded-[22px] font-black text-xl text-white outline-none focus:border-blue-500 shadow-inner" />
                                  <button onClick={addKeyword} className="px-6 bg-blue-600 text-white rounded-2xl font-black active:scale-90 shadow-xl">+</button>
                               </div>
                               <div className="flex flex-wrap gap-2 mt-3">
                                  {(designItem.keywords || "").split(',').filter(Boolean).map((kw: string) => (
                                    <span key={kw} className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-xs font-black uppercase border border-blue-500/20 flex items-center gap-2">
                                       {kw.trim()}
                                       <X size={12} className="cursor-pointer hover:text-rose-500" onClick={() => setDesignItem({...designItem, keywords: designItem.keywords.split(',').filter((k:any) => k.trim() !== kw.trim()).join(', ')})} />
                                    </span>
                                  ))}
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4 pt-10 border-t border-slate-800 text-right">
                            <label className="text-[11px] font-black text-slate-500 uppercase mr-3 tracking-[0.2em] italic">Full Product Specification</label>
                            <textarea 
                               onChange={(e) => setDesignItem({...designItem, description: e.target.value})} 
                               className="w-full bg-slate-900 border-2 border-slate-800 p-8 rounded-[40px] font-bold text-lg text-white outline-none focus:border-blue-500 transition-all h-40 text-right shadow-inner leading-relaxed scrollbar-hide" 
                               value={designItem.description || ""}
                            />
                         </div>
                      </div>

                      <div className="pt-10 flex justify-end gap-6 border-t border-slate-800">
                         <button onClick={() => setDesignItem(null)} className="px-14 py-6 rounded-[35px] font-black text-slate-500 hover:text-white transition-all uppercase text-sm italic tracking-widest">Discard</button>
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
                      <h3 className="text-4xl font-black text-slate-900 italic uppercase mb-6 tracking-tighter leading-none">Designer Ready</h3>
                      <p className="text-slate-400 max-w-md font-bold text-base leading-relaxed uppercase tracking-widest italic opacity-60">בחר מוצר מהמאגר מימין כדי להתחיל את תהליך הזרקת ה-DNA. כל שינוי ישתקף בסימולטור ה-Note 25 בזמן אמת.</p>
                   </div>
                 )}
               </AnimatePresence>
            </div>

            {/* 2. Live Simulator: Samsung Note 25 Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
               <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-full border border-slate-200 shadow-md mb-8">
                  <MobileIcon className="text-blue-500" size={24} />
                  <span className="h-6 w-[2px] bg-slate-100" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic mr-2">SAMSUNG NOTE 25 ELITE</span>
               </div>

               <div className="relative bg-[#020617] rounded-[75px] border-[14px] border-slate-800 shadow-[0_80px_160px_rgba(0,0,0,0.6)] w-full max-w-[420px] aspect-[9/19.5] flex flex-col overflow-hidden group">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-slate-800 rounded-b-[25px] z-50 flex items-center justify-center">
                     <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
                  </div>
                  
                  {/* Status Bar */}
                  <div className="h-10 flex justify-between items-center px-10 pt-4 relative z-40 text-white">
                     <span className="text-[10px] font-black tracking-widest">Saban 5G</span>
                     <span className="text-[10px] font-black tracking-widest">9:41</span>
                  </div>

                  {/* App Content */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-white/5 backdrop-blur-3xl m-3 rounded-[55px] border border-white/5 p-6 space-y-6 text-white text-right" dir="rtl">
                     <div className="flex justify-between items-center pt-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><ChevronRight size={20}/></div>
                        <img src="/ai.png" className="h-8 opacity-90" />
                     </div>

                     {/* Image Collage Stitched Style */}
                     <div className="grid grid-cols-12 gap-2 h-56">
                        <div className="col-span-8 bg-slate-900 rounded-[30px] overflow-hidden border border-white/10 relative shadow-2xl">
                           <ProductImage src={designItem?.image_url} size="lg" />
                        </div>
                        <div className="col-span-4 flex flex-col gap-2">
                           <div className="flex-1 bg-slate-900 rounded-[20px] overflow-hidden border border-white/10">
                              <ProductImage src={designItem?.image_url_2} size="sm" />
                           </div>
                           <div className="flex-1 bg-slate-900 rounded-[20px] overflow-hidden border border-white/10">
                              <ProductImage src={designItem?.image_url_3} size="sm" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 text-right">
                        <div className="flex items-center gap-3 justify-end">
                           <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Elite Series</span>
                           <ShieldCheck size={18} className="text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{designItem?.product_name || "Waiting for DNA..."}</h2>
                        <div className="flex items-center gap-3 opacity-60 justify-end font-bold text-[10px]">
                           <span>SKU: {designItem?.sku || "----"}</span>
                           <span className="h-3 w-[1px] bg-white/20" />
                           <span className="uppercase italic tracking-widest">{designItem?.category || "Industrial Grade"}</span>
                        </div>
                     </div>

                     {/* Tech DNA Matrix */}
                     <div className="grid grid-cols-3 gap-2 py-2">
                        <SmallStat icon={<Clock size={12}/>} label="Drying" value={designItem?.drying_time} />
                        <SmallStat icon={<Gauge size={12}/>} label="Coverage" value={designItem?.coverage_info} />
                        <SmallStat icon={<Hammer size={12}/>} label="Method" value={designItem?.application_method} />
                     </div>

                     {/* Video Player Integrator */}
                     {extractYouTubeId(designItem?.video_url) && (
                        <div className="aspect-video bg-black rounded-[35px] overflow-hidden border border-white/10 relative shadow-inner group">
                           <iframe className="w-full h-full pointer-events-none opacity-50" src={`https://www.youtube.com/embed/${extractYouTubeId(designItem.video_url)}?modestbranding=1&controls=0&mute=1`} frameBorder="0" />
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600/10">
                              <PlayCircle size={48} className="text-white drop-shadow-2xl" />
                              <p className="text-[9px] font-black uppercase tracking-widest mt-2">Guide Active</p>
                           </div>
                        </div>
                     )}

                     {/* Advisor Smart Box */}
                     <div className="bg-blue-600/10 border border-blue-500/10 p-6 rounded-[35px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full" />
                        <div className="flex items-center gap-3 mb-3 text-blue-400 justify-end">
                           <span className="text-[10px] font-black uppercase tracking-widest italic">Saban Pro Advisor</span>
                           <Sparkles size={16} />
                        </div>
                        <p className="text-[14px] font-bold leading-relaxed opacity-70 italic text-right truncate-4-lines">
                           {designItem?.description || "מפרט טכני מלא יופיע כאן ברגע שיוזן במערכת המנהל..."}
                        </p>
                     </div>

                     <div className="pt-4 pb-10">
                        <div className="w-full bg-white text-slate-900 py-6 rounded-[35px] font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 italic shadow-2xl">
                           ADD TO COMMAND <ShoppingCart size={22} className="text-blue-600" />
                        </div>
                     </div>
                  </div>

                  <div className="h-16 bg-[#020617] border-t border-white/5 flex items-center justify-center px-12 relative z-50">
                     <div className="w-32 h-1.5 bg-slate-700 rounded-full" />
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
      
      <footer className="py-24 border-t border-slate-100 opacity-20 text-center uppercase text-[12px] font-black tracking-[3em] italic text-slate-900 leading-none">Saban OS Neural Design Engine V76.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .truncate-4-lines { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }`}</style>
    </div>
  );
}

// --- Internal UI Helpers ---

function DesignField({ label, value, type = "text", onChange, placeholder, disabled }: any) {
  return (
    <div className="space-y-3 text-right" dir="rtl">
       <label className="text-[11px] font-black text-slate-400 uppercase mr-3 tracking-[0.2em] italic block text-right leading-none">{label}</label>
       <input 
          disabled={disabled} type={type} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-full bg-slate-900 border-2 border-slate-800 p-5 rounded-[22px] font-black text-xl text-white outline-none focus:border-blue-500 transition-all text-right shadow-inner disabled:opacity-40 italic" 
          value={value || ""} placeholder={placeholder} 
       />
    </div>
  );
}

function SmallStat({ icon, label, value }: any) {
  return (
    <div className="bg-white/5 border border-white/5 p-4 rounded-[25px] text-center shadow-inner group hover:bg-white/10 transition-all overflow-hidden">
       <div className="text-blue-500 mx-auto mb-2 flex justify-center">{icon}</div>
       <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">{label}</p>
       <p className="text-[10px] font-black text-white italic tracking-tighter truncate">{value || "--"}</p>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-slate-900" }: any) {
  return (
    <div className="bg-white border border-slate-100 px-10 py-8 rounded-[45px] shadow-xl flex flex-col items-center min-w-[200px] border-b-8 border-b-slate-50">
       <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em] italic leading-none justify-center">{icon} {label}</div>
       <span className={`text-5xl font-black italic tracking-tighter leading-none mt-2 ${color}`}>{value}</span>
    </div>
  );
}
