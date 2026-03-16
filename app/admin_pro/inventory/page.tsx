"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Scale, Package, Search, RefreshCw, Layers, Truck, 
  Image as ImageIcon, Video, Save, Plus, X, Globe,
  CheckCircle2, Loader2, Sparkles, Layout, Palette,
  ChevronRight, ArrowUpRight, Calculator, AlertTriangle,
  Eye, Smartphone, ShieldCheck, Clock, Hammer, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Catalog Studio Elite V35.0
 * -------------------------------------------
 * Fixes:
 * - Null-safe filtering (Fixed 'includeלקוחות' crash).
 * - Removed broken external placeholder URLs.
 * - Added robust Array validation for all .map() calls.
 * - Integrated Technical DNA fields.
 */

export default function CatalogStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [assetType, setAssetType] = useState<'image' | 'video'>('image');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, weightRes] = await Promise.all([
        supabase.from('inventory').select('*'),
        supabase.from('product_weights').select('*')
      ]);
      setItems(Array.isArray(invRes.data) ? invRes.data : []);
      setWeights(Array.isArray(weightRes.data) ? weightRes.data : []);
    } catch (err) {
      toast.error("שגיאה בסנכרון מול ה-Database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const enrichedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map(item => {
      const w = Array.isArray(weights) ? weights.find(weight => weight.sku === item.sku) : null;
      return { 
        ...item, 
        weight_kg: w?.weight_kg || 25, 
        is_big_bag: w?.is_big_bag || false 
      };
    });
  }, [items, weights]);

  const searchGoogle = async () => {
    if (!editingItem?.product_name) return;
    setIsSearchingGoogle(true);
    setGoogleResults([]);
    try {
      const res = await fetch(`/api/google/search?q=${encodeURIComponent(editingItem.product_name)}&type=${assetType}`);
      const data = await res.json();
      setGoogleResults(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("חיפוש נכסים נכשל");
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem.sku) {
      toast.error("חובה להזין מק\"ט");
      return;
    }
    const toastId = toast.loading("מזריק DNA משודרג...");
    try {
      const { error: invErr } = await supabase.from('inventory').upsert({
        sku: editingItem.sku,
        product_name: editingItem.product_name || "",
        image_url: editingItem.image_url || "",
        image_url_2: editingItem.image_url_2 || "",
        image_url_3: editingItem.image_url_3 || "",
        video_url: editingItem.video_url || "",
        description: editingItem.description || "",
        drying_time: editingItem.drying_time || "",
        coverage_info: editingItem.coverage_info || "",
        application_method: editingItem.application_method || ""
      });

      const { error: weightErr } = await supabase.from('product_weights').upsert({
        sku: editingItem.sku,
        weight_kg: editingItem.weight_kg || 25,
        is_big_bag: editingItem.is_big_bag || false
      });

      if (invErr || weightErr) throw new Error("Database Write Failed");
      toast.success("DNA עודכן בהצלחה! 🦾", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error("שגיאה בשמירה - בדוק הרשאות טבלה", { id: toastId });
    }
  };

  const filteredItems = enrichedItems.filter(i => {
    const term = (searchTerm || "").toLowerCase();
    const name = (i.product_name || "").toLowerCase();
    const sku = (i.sku || "").toString().toLowerCase();
    return name.includes(term) || sku.includes(term);
  });

  const getYoutubeId = (url: string) => {
    const match = (url || "").match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans pb-20 px-4 md:px-8" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0F172A] rounded-[45px] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5 mt-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center shadow-2xl text-blue-600 shrink-0">
                <Palette size={42} />
              </div>
              <div className="text-right">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-3 text-white">Saban Catalog Studio</h2>
                <p className="text-blue-300/80 text-xs font-bold uppercase tracking-[0.3em] italic">Visual Identity & Spec Management</p>
              </div>
           </div>
           <div className="flex gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  placeholder="חיפוש מק''ט או שם..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 pr-14 pl-6 py-5 rounded-[22px] font-bold outline-none focus:bg-white/10 transition-all text-sm"
                />
              </div>
              <button onClick={() => setEditingItem({ sku: '', product_name: '', weight_kg: 25, is_big_bag: false })} className="bg-blue-600 hover:bg-blue-500 px-8 py-5 rounded-[22px] font-black text-xs uppercase shadow-xl flex items-center gap-3 transition-all active:scale-95">
                <Plus size={20}/> מוצר חדש
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Inventory List */}
        <div className="lg:col-span-4 h-[850px]">
          <div className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-right">
                <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-3 tracking-widest leading-none">
                   <Layers size={18} className="text-blue-600"/> מאגר המלאי ({filteredItems.length})
                </h3>
                <button onClick={fetchData} className="p-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-[#FBFCFD]">
                {filteredItems.map(item => (
                  <button 
                    key={item.sku}
                    onClick={() => { setEditingItem(item); setGoogleResults([]); }}
                    className={`w-full p-5 rounded-[32px] border text-right transition-all group flex items-center justify-between ${editingItem?.sku === item.sku ? 'bg-[#0F172A] border-[#0F172A] shadow-2xl' : 'bg-white border-slate-100 hover:border-blue-300'}`}
                  >
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner group-hover:scale-110 transition-transform">
                          {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <Package size={20} className="text-slate-300"/>}
                       </div>
                       <div>
                          <p className={`font-black text-base leading-none ${editingItem?.sku === item.sku ? 'text-white' : 'text-slate-900'}`}>{item.product_name || "ללא שם"}</p>
                          <p className={`text-[10px] font-black uppercase mt-2 ${editingItem?.sku === item.sku ? 'text-blue-400' : 'text-slate-400'}`}>SKU: {item.sku}</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className={editingItem?.sku === item.sku ? 'text-blue-500' : 'text-slate-200'} />
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
             {editingItem ? (
               <motion.div key="studio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {/* Editor Form */}
                  <div className="bg-white rounded-[50px] border border-slate-200 shadow-2xl p-8 md:p-10 space-y-8 overflow-y-auto max-h-[850px] scrollbar-hide">
                     <div className="flex justify-between items-center border-b pb-6">
                        <div className="flex items-center gap-4 text-right">
                           <Palette className="text-blue-600"/>
                           <h3 className="text-xl font-black uppercase italic leading-none">Elite Designer</h3>
                        </div>
                        <button onClick={() => setEditingItem(null)} className="p-3 bg-slate-50 rounded-2xl"><X size={20}/></button>
                     </div>

                     <div className="grid grid-cols-2 gap-6 text-right" dir="rtl">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic">שם מוצר</label><input value={editingItem.product_name || ""} onChange={e => setEditingItem({...editingItem, product_name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none focus:bg-white border-2 border-transparent focus:border-blue-600 text-right" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic">מק"ט</label><input value={editingItem.sku || ""} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none focus:bg-white border-2 border-transparent focus:border-blue-600 text-right" /></div>
                     </div>

                     <div className="grid grid-cols-3 gap-4 bg-blue-50/50 p-5 rounded-[30px]" dir="rtl">
                        <div className="space-y-1"><label className="text-[9px] font-black text-blue-600 uppercase italic flex items-center gap-1 justify-end"><Clock size={10}/> ייבוש</label><input value={editingItem.drying_time || ""} onChange={e => setEditingItem({...editingItem, drying_time: e.target.value})} className="w-full bg-white p-3 rounded-xl font-bold text-xs text-right" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-blue-600 uppercase italic flex items-center gap-1 justify-end"><Calculator size={10}/> כיסוי</label><input value={editingItem.coverage_info || ""} onChange={e => setEditingItem({...editingItem, coverage_info: e.target.value})} className="w-full bg-white p-3 rounded-xl font-bold text-xs text-right" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-blue-600 uppercase italic flex items-center gap-1 justify-end"><Hammer size={10}/> יישום</label><input value={editingItem.application_method || ""} onChange={e => setEditingItem({...editingItem, application_method: e.target.value})} className="w-full bg-white p-3 rounded-xl font-bold text-xs text-right" /></div>
                     </div>

                     <div className="bg-[#0F172A] rounded-[35px] p-6 space-y-4">
                        <div className="flex justify-between items-center text-right"><h4 className="text-blue-400 font-black text-xs uppercase italic tracking-widest flex items-center gap-2"><Globe size={14}/> Google Asset Search</h4></div>
                        <button onClick={searchGoogle} disabled={isSearchingGoogle} className="w-full bg-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3">
                           {isSearchingGoogle ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} className="text-blue-600"/>}
                           חפש נכסי מדיה ברשת
                        </button>
                        <div className="grid grid-cols-3 gap-3 max-h-[180px] overflow-y-auto scrollbar-hide">
                           {googleResults.map((res, i) => (
                             <button key={i} onClick={() => {
                               if (!editingItem.image_url) setEditingItem({...editingItem, image_url: res.link});
                               else if (!editingItem.image_url_2) setEditingItem({...editingItem, image_url_2: res.link});
                               else setEditingItem({...editingItem, image_url_3: res.link});
                             }} className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-lg bg-slate-800"><img src={res.link} className="w-full h-full object-cover" /></button>
                           ))}
                        </div>
                     </div>

                     <button onClick={handleSave} className="w-full bg-emerald-500 text-white py-6 rounded-[30px] font-black text-xl shadow-xl border-b-8 border-emerald-700 active:scale-95 transition-all uppercase italic">הזרק DNA לביצוע 🦾</button>
                  </div>

                  {/* Simulator Area */}
                  <div className="flex flex-col items-center">
                     <div className="bg-[#0F172A] rounded-[60px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5 sticky top-10 w-full max-w-[420px]">
                        <div className="p-8">
                           <div className="flex gap-3 h-56">
                              <div className="flex-[2] bg-slate-800 rounded-[30px] overflow-hidden relative border border-white/10">
                                 {editingItem.image_url ? <img src={editingItem.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={40}/></div>}
                              </div>
                              <div className="flex-1 flex flex-col gap-3">
                                 <div className="flex-1 bg-slate-800 rounded-[20px] overflow-hidden border border-white/10">
                                    {editingItem.image_url_2 ? <img src={editingItem.image_url_2} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={16}/></div>}
                                 </div>
                                 <div className="flex-1 bg-slate-800 rounded-[20px] overflow-hidden border border-white/10">
                                    {editingItem.image_url_3 ? <img src={editingItem.image_url_3} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={16}/></div>}
                                 </div>
                              </div>
                           </div>
                        </div>
                        
                        {getYoutubeId(editingItem.video_url) && (
                          <div className="px-8 pb-6">
                             <div className="aspect-video bg-black rounded-[25px] overflow-hidden border border-white/5 shadow-2xl">
                                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(editingItem.video_url)}?modestbranding=1`} frameBorder="0" allowFullScreen />
                             </div>
                          </div>
                        )}

                        <div className="px-10 pb-10 space-y-6 text-right" dir="rtl">
                           <div>
                              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">{editingItem.product_name || "שם מוצר"}</h2>
                              <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">SKU {editingItem.sku || "0000"}</span>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 p-5 rounded-[25px] text-center border border-white/5"><p className="text-[8px] font-black text-slate-500 uppercase italic mb-1 tracking-widest">זמן ייבוש</p><p className="text-lg font-black text-white italic tracking-tighter"><Clock size={12} className="inline ml-1 text-blue-500"/>{editingItem.drying_time || "--"}</p></div>
                              <div className="bg-white/5 p-5 rounded-[25px] text-center border border-white/5"><p className="text-[8px] font-black text-slate-500 uppercase italic mb-1 tracking-widest">כושר כיסוי</p><p className="text-lg font-black text-blue-400 italic tracking-tighter">{editingItem.coverage_info || "--"}</p></div>
                           </div>
                           <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[30px] relative overflow-hidden">
                              <div className="relative z-10 flex items-center justify-between mb-3"><span className="text-[9px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-2"><Sparkles size={12}/> Technical DNA</span><ShieldCheck size={16} className="text-emerald-500" /></div>
                              <p className="text-white text-xs font-bold leading-relaxed text-right opacity-80 italic">"יישום מומלץ: {editingItem.application_method || 'נא להגדיר'}"</p>
                           </div>
                           <button className="w-full bg-white text-slate-900 py-6 rounded-[28px] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 border-b-8 border-slate-200 active:scale-95 italic">הוסף להזמנה <ArrowUpRight size={18} className="text-blue-600"/></button>
                        </div>
                     </div>
                  </div>
               </motion.div>
             ) : (
               <div className="h-[850px] bg-white rounded-[60px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-20 shadow-inner group">
                  <div className="w-32 h-32 bg-slate-50 rounded-[45px] flex items-center justify-center text-slate-200 mb-8 border-4 border-white shadow-xl group-hover:scale-110 transition-transform"><Palette size={64} /></div>
                  <h3 className="text-3xl font-black text-slate-900 italic uppercase mb-4 tracking-tighter">Saban Catalog Studio</h3>
                  <p className="text-slate-400 max-w-sm font-bold text-sm leading-relaxed uppercase tracking-widest italic opacity-60">בחר מוצר מרשימת המלאי כדי להתחיל לעצב את כרטיס המדיה שלו ולראות בסימולטור איך הלקוח רואה את זה בשטח.</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
      <footer className="py-12 border-t border-slate-200 opacity-20 text-center uppercase text-[10px] font-black tracking-[0.8em] text-slate-900">Saban Catalog Studio V35.0</footer>
    </div>
  );
}
