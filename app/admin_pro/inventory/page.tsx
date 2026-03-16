"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Scale, Package, Search, RefreshCw, Layers, Truck, 
  Image as ImageIcon, Video, Save, Plus, X, Globe,
  CheckCircle2, Loader2, Sparkles, Layout, Palette,
  ChevronRight, ArrowUpRight, Calculator, ShieldCheck, 
  Clock, Hammer, Play, Eye, Smartphone, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Catalog Studio Elite V42.0
 * -------------------------------------------
 * - Hybrid Assets: Supports both Google Search API and manual URL pasting.
 * - Tech DNA: Extended fields for Drying, Coverage, and Application.
 * - Multi-Image: 3-slot image collage system.
 * - YouTube: Internal player for pasted or searched video links.
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
      toast.error("שגיאה בסנכרון נתונים");
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
    if (!editingItem.sku) return toast.error("חובה להזין מק\"ט");
    const toastId = toast.loading("מעדכן DNA Elite...");
    
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

      if (invErr || weightErr) throw new Error("DB Upsert Failed");
      toast.success("ה-DNA הזרק בהצלחה! 🦾", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error("שגיאה בשמירה - בדוק הרשאות טבלה", { id: toastId });
    }
  };

  const filteredItems = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    return enrichedItems.filter(i => {
      const name = (i.product_name || "").toLowerCase();
      const sku = (i.sku || "").toString().toLowerCase();
      return name.includes(term) || sku.includes(term);
    });
  }, [enrichedItems, searchTerm]);

  const getYoutubeId = (url: string) => {
    const match = (url || "").match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ImageFallback = ({ url, className }: { url: string, className: string }) => {
    if (!url) return (
      <div className={`${className} bg-slate-100 flex flex-col items-center justify-center text-slate-300 gap-2 border border-slate-200 shadow-inner`}>
        <ImageIcon size={className.includes('w-14') ? 20 : 40} strokeWidth={1} />
      </div>
    );
    return <img src={url} className={`${className} object-cover`} alt="Product" onError={(e:any) => e.target.src = ''} />;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans pb-20 px-4 md:px-8 text-right" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />

      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-[45px] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5 mt-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center shadow-2xl text-blue-600 shrink-0">
                <Palette size={42} />
              </div>
              <div className="text-right">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-3 text-white">Saban Catalog Studio</h2>
                <p className="text-blue-300/80 text-xs font-bold uppercase tracking-[0.3em]">Elite DNA & Media Management</p>
              </div>
           </div>
           <div className="flex gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-80 group">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input 
                  placeholder="חיפוש מק''ט או שם..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 pr-14 pl-6 py-5 rounded-[22px] font-bold outline-none focus:bg-white/10 transition-all text-sm text-right"
                />
              </div>
              <button onClick={() => setEditingItem({ sku: '', product_name: '', weight_kg: 25, is_big_bag: false })} className="bg-blue-600 hover:bg-blue-500 px-8 py-5 rounded-[22px] font-black text-xs uppercase shadow-xl flex items-center gap-3 transition-all active:scale-95 border-b-4 border-blue-800">
                <Plus size={20}/> מוצר חדש
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* List Side */}
        <div className="lg:col-span-4 h-[900px]">
          <div className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-3 tracking-widest leading-none">
                   <Layers size={18} className="text-blue-600"/> מאגר המלאי ({filteredItems.length})
                </h3>
                <button onClick={fetchData} className="p-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-[#FBFCFD]">
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-[28px] border border-slate-100" />)}
                  </div>
                ) : filteredItems.map(item => (
                  <button 
                    key={item.sku}
                    onClick={() => { setEditingItem(item); setGoogleResults([]); }}
                    className={`w-full p-5 rounded-[32px] border text-right transition-all group flex items-center justify-between ${editingItem?.sku === item.sku ? 'bg-[#0F172A] border-[#0F172A] shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-blue-300'}`}
                  >
                    <div className="flex items-center gap-5">
                       <ImageFallback url={item.image_url} className="w-14 h-14 rounded-2xl overflow-hidden" />
                       <div className="text-right">
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

        {/* Editor Side */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
             {editingItem ? (
               <motion.div key="studio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  
                  {/* Editor Card */}
                  <div className="bg-white rounded-[50px] border border-slate-200 shadow-2xl p-8 md:p-10 space-y-8 overflow-y-auto max-h-[900px] scrollbar-hide text-right relative">
                     <div className="flex justify-between items-center border-b pb-8">
                        <div className="flex items-center gap-4">
                           <Palette className="text-blue-600" size={32}/>
                           <h3 className="text-2xl font-black uppercase italic leading-none text-slate-900">Designer Elite</h3>
                        </div>
                        <button onClick={() => setEditingItem(null)} className="p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X size={24}/></button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic">שם מוצר</label><input value={editingItem.product_name || ""} onChange={e => setEditingItem({...editingItem, product_name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none focus:bg-white border-2 border-transparent focus:border-blue-600 text-right" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic">מק"ט (SKU)</label><input value={editingItem.sku || ""} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-black outline-none focus:bg-white border-2 border-transparent focus:border-blue-600 text-right" /></div>
                     </div>

                     {/* Technical Matrix */}
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-r-4 border-blue-500 pr-3">Technical DNA Matrix</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50/50 p-6 rounded-[35px] border border-blue-100 shadow-inner">
                           <div className="space-y-1"><label className="text-[9px] font-black text-blue-600 uppercase italic flex items-center gap-1 justify-end"><Clock size={10}/> ייבוש</label><input value={editingItem.drying_time || ""} onChange={e => setEditingItem({...editingItem, drying_time: e.target.value})} placeholder="למשל: 24 שעות" className="w-full bg-white p-3 rounded-xl font-bold text-xs text-right outline-none" /></div>
                           <div className="space-y-1"><label className="text-[9px] font-black text-blue-600 uppercase italic flex items-center gap-1 justify-end"><Calculator size={10}/> כיסוי</label><input value={editingItem.coverage_info || ""} onChange={e => setEditingItem({...editingItem, coverage_info: e.target.value})} placeholder="ק''ג למ''ר" className="w-full bg-white p-3 rounded-xl font-bold text-xs text-right outline-none" /></div>
                           <div className="space-y-1"><label className="text-[9px] font-black text-blue-600 uppercase italic flex items-center gap-1 justify-end"><Hammer size={10}/> יישום</label><input value={editingItem.application_method || ""} onChange={e => setEditingItem({...editingItem, application_method: e.target.value})} placeholder="הברשה/מאלג'" className="w-full bg-white p-3 rounded-xl font-bold text-xs text-right outline-none" /></div>
                        </div>
                     </div>

                     {/* Media URL Pasting Section */}
                     <div className="space-y-4 pt-6 border-t">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest flex items-center gap-2 justify-end">Manual Asset Links <LinkIcon size={14}/></h4>
                        <div className="grid grid-cols-1 gap-3">
                           <input value={editingItem.image_url || ""} onChange={e => setEditingItem({...editingItem, image_url: e.target.value})} placeholder="לינק לתמונה ראשית..." className="w-full bg-slate-50 p-4 rounded-xl text-xs font-mono text-left" />
                           <div className="grid grid-cols-2 gap-3">
                              <input value={editingItem.image_url_2 || ""} onChange={e => setEditingItem({...editingItem, image_url_2: e.target.value})} placeholder="לינק תמונה 2..." className="w-full bg-slate-50 p-4 rounded-xl text-xs font-mono text-left" />
                              <input value={editingItem.image_url_3 || ""} onChange={e => setEditingItem({...editingItem, image_url_3: e.target.value})} placeholder="לינק תמונה 3..." className="w-full bg-slate-50 p-4 rounded-xl text-xs font-mono text-left" />
                           </div>
                           <div className="relative">
                              <input value={editingItem.video_url || ""} onChange={e => setEditingItem({...editingItem, video_url: e.target.value})} placeholder="לינק לסרטון יוטיוב..." className="w-full bg-slate-50 p-4 rounded-xl text-xs font-mono text-left pr-10" />
                              <Video size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                           </div>
                        </div>
                     </div>

                     {/* Google Search Engine */}
                     <div className="bg-[#0F172A] rounded-[35px] p-8 space-y-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
                        <div className="flex justify-between items-center relative z-10">
                           <h4 className="text-blue-400 font-black text-xs uppercase italic tracking-widest flex items-center gap-2"><Globe size={16}/> Smart Google Sync</h4>
                           <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/5">
                              <button onClick={() => setAssetType('image')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${assetType === 'image' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>IMAGES</button>
                              <button onClick={() => setAssetType('video')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${assetType === 'video' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>VIDEOS</button>
                           </div>
                        </div>
                        <button 
                          onClick={searchGoogle}
                          disabled={isSearchingGoogle || !editingItem.product_name}
                          className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-4 relative z-10 active:scale-95"
                        >
                           {isSearchingGoogle ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20} className="text-blue-600" />}
                           סרוק את הרשת לנכסים
                        </button>
                        <div className="grid grid-cols-3 gap-4 max-h-[200px] overflow-y-auto scrollbar-hide p-1 relative z-10">
                           {googleResults.map((res, i) => (
                             <button 
                               key={i} 
                               onClick={() => {
                                 if (!editingItem.image_url) setEditingItem({...editingItem, image_url: res.link});
                                 else if (!editingItem.image_url_2) setEditingItem({...editingItem, image_url_2: res.link});
                                 else setEditingItem({...editingItem, image_url_3: res.link});
                               }} 
                               className="aspect-square rounded-[22px] overflow-hidden border-4 border-transparent hover:border-blue-500 transition-all relative group shadow-lg bg-slate-800"
                             >
                                <img src={res.link} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><Plus size={32}/></div>
                             </button>
                           ))}
                        </div>
                        <button onClick={() => setEditingItem({...editingItem, image_url:'', image_url_2:'', image_url_3:''})} className="text-[10px] text-slate-500 font-black uppercase tracking-widest relative z-10 hover:text-white transition-colors">נקה מדיה 🧹</button>
                     </div>

                     <button onClick={handleSave} className="w-full bg-emerald-500 text-white py-8 rounded-[35px] font-black text-2xl flex items-center justify-center gap-5 shadow-2xl border-b-[10px] border-emerald-700 active:scale-95 transition-all uppercase italic tracking-tighter">
                        <Save size={32}/> הזרק DNA לביצוע בשטח
                     </button>
                  </div>

                  {/* Visual Simulator */}
                  <div className="flex flex-col items-center gap-8">
                     <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm">
                        <Smartphone size={20} className="text-slate-400" />
                        <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.4em] italic text-right">Real-time VIP Simulator</span>
                     </div>
                     
                     <motion.div layout className="bg-slate-900 rounded-[70px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.5)] border border-white/5 sticky top-10 w-full max-w-[440px]">
                        
                        {/* Collage Images */}
                        <div className="p-10">
                           <div className="flex gap-4 h-64">
                              <div className="flex-[2] bg-slate-800 rounded-[35px] overflow-hidden relative border border-white/10 group">
                                 <ImageFallback url={editingItem.image_url} className="w-full h-full" />
                                 <div className="absolute top-5 left-5 bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg animate-pulse tracking-widest">Main View</div>
                              </div>
                              <div className="flex-1 flex flex-col gap-4">
                                 <div className="flex-1 bg-slate-800 rounded-[22px] overflow-hidden border border-white/10 shadow-inner">
                                    <ImageFallback url={editingItem.image_url_2} className="w-full h-full" />
                                 </div>
                                 <div className="flex-1 bg-slate-800 rounded-[22px] overflow-hidden border border-white/10 shadow-inner">
                                    <ImageFallback url={editingItem.image_url_3} className="w-full h-full" />
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Video Layer */}
                        {getYoutubeId(editingItem.video_url) && (
                          <div className="px-10 pb-8">
                             <div className="aspect-video bg-black rounded-[35px] overflow-hidden border border-white/10 shadow-2xl relative group">
                                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(editingItem.video_url)}?modestbranding=1&controls=1`} frameBorder="0" allowFullScreen />
                                <div className="absolute top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"><Play size={12} fill="currentColor"/> Guide Player</div>
                             </div>
                          </div>
                        )}

                        <div className="px-12 pb-12 space-y-10 text-right" dir="rtl">
                           <div className="space-y-3">
                              <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{editingItem.product_name || "Product Title"}</h2>
                              <div className="flex items-center gap-4">
                                 <span className="bg-white/10 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">SKU {editingItem.sku || "0000"}</span>
                                 <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2 shadow-sm"><ShieldCheck size={12}/> Saban DNA Verified</span>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-5">
                              <div className="bg-white/5 border border-white/5 p-7 rounded-[40px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
                                 <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3 tracking-widest leading-none">Drying Time</p>
                                 <p className="text-2xl font-black text-white italic tracking-tighter flex items-center justify-center gap-2 leading-none">
                                    <Clock size={18} className="text-blue-500"/> {editingItem.drying_time || "--"}
                                 </p>
                              </div>
                              <div className="bg-white/5 border border-white/5 p-7 rounded-[40px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
                                 <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3 tracking-widest leading-none">Coverage</p>
                                 <p className="text-2xl font-black text-blue-400 italic tracking-tighter leading-none">
                                    {editingItem.coverage_info || "--"}
                                 </p>
                              </div>
                           </div>

                           <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[45px] relative overflow-hidden shadow-inner group">
                              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                              <div className="relative z-10 flex items-center justify-between mb-5">
                                 <span className="text-[11px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-3"><Sparkles size={16} className="animate-pulse"/> Saban Specialist OS</span>
                                 <Eye size={18} className="text-blue-500/40" />
                              </div>
                              <p className="text-white text-[16px] font-bold leading-relaxed text-right opacity-80 italic">
                                 "{editingItem.application_method || 'נא להגדיר שיטת יישום מומלצת כדי להדריך את לקוחות ה-VIP בשטח.'}"
                              </p>
                           </div>

                           <button className="w-full bg-white text-slate-900 py-8 rounded-[40px] font-black text-xs uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-6 border-b-8 border-slate-200 active:scale-95 transition-all italic ring-[15px] ring-white/5 hover:bg-blue-50">
                              הוסף לפקודת עבודה <ArrowUpRight size={26} className="text-blue-600" />
                           </button>
                        </div>
                     </motion.div>
                  </div>
               </motion.div>
             ) : (
               <div className="h-[900px] bg-white rounded-[60px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-20 shadow-inner group">
                  <div className="w-36 h-36 bg-slate-50 rounded-[50px] flex items-center justify-center text-slate-200 mb-10 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                     <Palette size={80} strokeWidth={1} />
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 italic uppercase mb-6 tracking-tighter">Catalog Designer Elite</h3>
                  <p className="text-slate-400 max-w-md font-bold text-base leading-relaxed uppercase tracking-widest italic opacity-60">
                    בחר מוצר כדי להתחיל לערוך את המפרט הטכני והמדיה שלו. תוכל למשוך נכסים מגוגל או להדביק לינקים ידנית. הכל מסונכרן לפורטל ה-VIP בזמן אמת.
                  </p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
      <footer className="py-20 border-t border-slate-200 opacity-20 text-center uppercase text-[11px] font-black tracking-[1em] text-slate-900">Saban Visual Intelligence V42.0</footer>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
