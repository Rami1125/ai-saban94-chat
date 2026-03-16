"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Scale, Package, Search, RefreshCw, Layers, Truck, 
  Image as ImageIcon, Video, Save, Plus, X, Globe,
  CheckCircle2, Loader2, Sparkles, Layout, Palette,
  ChevronRight, ArrowUpRight, Calculator, AlertTriangle,
  Eye, FileText, Smartphone, ShieldCheck, Clock, Droplets, Hammer, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Catalog Studio Elite V33.0
 * -------------------------------------------
 * - Fix: All imports verified (Loader2, ShieldCheck, etc.)
 * - Fix: Stable multi-table fetching (No 400 Joins)
 * - Features: 3-Image layout, YouTube Player, Professional Specs (Drying, Coverage, Method)
 */

export default function CatalogStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States לעורך
  const [editingItem, setEditingItem] = useState<any>(null);
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [assetType, setAssetType] = useState<'image' | 'video'>('image');

  // 1. שליפת נתונים חסינה
  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, weightRes] = await Promise.all([
        supabase.from('inventory').select('*'),
        supabase.from('product_weights').select('*')
      ]);

      setItems(invRes.data || []);
      setWeights(weightRes.data || []);
    } catch (err: any) {
      toast.error("שגיאה בסנכרון נתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // מיזוג נתונים לוגיסטיים ב-Frontend
  const enrichedItems = useMemo(() => {
    return items.map(item => {
      const w = weights.find(weight => weight.sku === item.sku);
      return {
        ...item,
        weight_kg: w?.weight_kg || 25,
        is_big_bag: w?.is_big_bag || false
      };
    });
  }, [items, weights]);

  // 2. חישוב מזהה יוטיוב מהלינק
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 3. חיפוש נכסים בגוגל
  const searchGoogle = async () => {
    if (!editingItem?.product_name) return;
    setIsSearchingGoogle(true);
    setGoogleResults([]);
    try {
      const res = await fetch(`/api/google/search?q=${encodeURIComponent(editingItem.product_name)}&type=${assetType}`);
      const data = await res.json();
      setGoogleResults(data);
    } catch (err: any) {
      toast.error("חיפוש נכשל");
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // 4. שמירת DNA מוצר משודרג
  const handleSave = async () => {
    const toastId = toast.loading("מזריק DNA משודרג...");
    try {
      const { error: invErr } = await supabase.from('inventory').upsert({
        sku: editingItem.sku,
        product_name: editingItem.product_name,
        image_url: editingItem.image_url,
        image_url_2: editingItem.image_url_2, // תמונה קטנה 1
        image_url_3: editingItem.image_url_3, // תמונה קטנה 2
        video_url: editingItem.video_url,     // לינק יוטיוב
        description: editingItem.description,
        drying_time: editingItem.drying_time,
        coverage_info: editingItem.coverage_info,
        application_method: editingItem.application_method,
        price: editingItem.price
      });

      const { error: weightErr } = await supabase.from('product_weights').upsert({
        sku: editingItem.sku,
        weight_kg: editingItem.weight_kg,
        is_big_bag: editingItem.is_big_bag
      });

      if (invErr || weightErr) throw new Error("Save Failed");

      toast.success("כרטיס מוצר Elite עודכן 🦾", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error("שגיאה בשירה");
    }
  };

  const filteredItems = enrichedItems.filter(i => {
    const term = searchTerm.toLowerCase();
    return (i.product_name || "").toLowerCase().includes(term) || (i.sku || "").toString().includes(term);
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans pb-20 px-4 md:px-8" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-slate-900 rounded-[45px] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5 mt-4">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center shadow-2xl text-blue-600 border-4 border-blue-50 shrink-0">
                <Palette size={42} />
              </div>
              <div className="text-right">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-3">Saban Catalog Studio</h2>
                <p className="text-blue-300/80 text-xs md:text-sm font-bold uppercase tracking-[0.3em] italic">High-Fidelity Visual & Technical DNA</p>
              </div>
           </div>
           <div className="flex gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-80 group">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input 
                  placeholder="חיפוש מק''ט או שם..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 pr-14 pl-6 py-5 rounded-[22px] font-bold outline-none focus:bg-white/10 transition-all text-sm"
                />
              </div>
              <button 
                onClick={() => setEditingItem({ sku: '', product_name: '', weight_kg: 25, is_big_bag: false })}
                className="bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 border-b-4 border-blue-800"
              >
                <Plus size={20}/> מוצר חדש
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* List Side */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[850px]">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 italic uppercase text-xs flex items-center gap-3 tracking-widest">
                  <Layers size={18} className="text-blue-600"/> מאגר המלאי ({filteredItems.length})
                </h3>
                <button onClick={fetchData} className="p-2 hover:bg-white rounded-xl transition-all">
                  <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-[#FBFCFD]">
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-white animate-pulse rounded-[28px] border border-slate-100" />)}
                  </div>
                ) : filteredItems.map(item => (
                  <motion.button 
                    layout key={item.id || item.sku}
                    onClick={() => { setEditingItem(item); setGoogleResults([]); }}
                    className={`w-full p-5 rounded-[32px] border text-right transition-all group flex items-center justify-between relative overflow-hidden ${editingItem?.sku === item.sku ? 'bg-slate-900 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 hover:border-blue-300'}`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner group-hover:scale-110 transition-transform">
                          {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <Package size={24} className="text-slate-300"/>}
                       </div>
                       <div>
                          <p className={`font-black text-base leading-none ${editingItem?.sku === item.sku ? 'text-white' : 'text-slate-900'}`}>{item.product_name || "ללא שם"}</p>
                          <p className={`text-[10px] font-black uppercase italic mt-2 ${editingItem?.sku === item.sku ? 'text-blue-400' : 'text-slate-400'}`}>SKU: {item.sku}</p>
                       </div>
                    </div>
                    <ChevronRight size={22} className={editingItem?.sku === item.sku ? 'text-blue-500' : 'text-slate-200'} />
                  </motion.button>
                ))}
             </div>
          </div>
        </div>

        {/* Editor Side */}
        <div className="lg:col-span-8 space-y-8">
           <AnimatePresence mode="wait">
             {editingItem ? (
               <motion.div 
                 key="studio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="grid grid-cols-1 xl:grid-cols-2 gap-10"
               >
                  {/* Form Card */}
                  <div className="bg-white rounded-[50px] border border-slate-200 shadow-2xl p-8 md:p-12 space-y-10 overflow-y-auto max-h-[850px] scrollbar-hide">
                     <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Palette size={28}/></div>
                           <h3 className="text-2xl font-black italic uppercase text-slate-900">Elite Card Editor</h3>
                        </div>
                        <button onClick={() => setEditingItem(null)} className="p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24}/></button>
                     </div>

                     {/* Basic Info */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">שם המוצר</label>
                           <input value={editingItem.product_name || ""} onChange={e => setEditingItem({...editingItem, product_name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black outline-none focus:border-blue-600 focus:bg-white transition-all text-right" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">מק"ט (SKU)</label>
                           <input value={editingItem.sku || ""} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black outline-none focus:border-blue-600 focus:bg-white transition-all text-right" />
                        </div>
                     </div>

                     {/* Technical Specs - NEW */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50/30 p-6 rounded-[35px] border border-blue-50 shadow-inner">
                        <div className="space-y-3">
                           <label className="text-[9px] font-black uppercase text-blue-400 mr-2 italic flex items-center gap-2"><Clock size={12}/> זמן ייבוש</label>
                           <input value={editingItem.drying_time || ""} onChange={e => setEditingItem({...editingItem, drying_time: e.target.value})} placeholder="למשל: 24 שעות" className="w-full bg-white border border-blue-100 p-4 rounded-xl font-bold text-xs text-right outline-none focus:ring-4 ring-blue-500/10" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black uppercase text-blue-400 mr-2 italic flex items-center gap-2"><Calculator size={12}/> כושר כיסוי</label>
                           <input value={editingItem.coverage_info || ""} onChange={e => setEditingItem({...editingItem, coverage_info: e.target.value})} placeholder="למשל: 1.5 ק''ג למ''ר" className="w-full bg-white border border-blue-100 p-4 rounded-xl font-bold text-xs text-right outline-none focus:ring-4 ring-blue-500/10" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black uppercase text-blue-400 mr-2 italic flex items-center gap-2"><Hammer size={12}/> שיטת יישום</label>
                           <input value={editingItem.application_method || ""} onChange={e => setEditingItem({...editingItem, application_method: e.target.value})} placeholder="למשל: הברשה / מאלג'" className="w-full bg-white border border-blue-100 p-4 rounded-xl font-bold text-xs text-right outline-none focus:ring-4 ring-blue-500/10" />
                        </div>
                     </div>

                     {/* Media Links */}
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest flex items-center gap-2"><Video size={16} className="text-rose-500"/> לינק יוטיוב למדריך</label>
                           <input value={editingItem.video_url || ""} onChange={e => setEditingItem({...editingItem, video_url: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black outline-none focus:border-rose-500 transition-all text-left" />
                        </div>
                     </div>

                     {/* Google Assets Selector */}
                     <div className="bg-slate-900 rounded-[40px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
                        <div className="flex justify-between items-center relative z-10">
                           <h4 className="font-black text-xs uppercase tracking-widest italic text-blue-400 flex items-center gap-2"><Globe size={16}/> סריקת מדיה בגוגל</h4>
                           <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/5">
                              <button onClick={() => setAssetType('image')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${assetType === 'image' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>IMAGES</button>
                           </div>
                        </div>
                        <button onClick={searchGoogle} disabled={isSearchingGoogle || !editingItem.product_name} className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-4 relative z-10">
                           {isSearchingGoogle ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20} className="text-blue-600" />}
                           חפש נכסים לכרטיס
                        </button>
                        <div className="grid grid-cols-3 gap-4 max-h-[220px] overflow-y-auto scrollbar-hide p-1 relative z-10">
                           {googleResults.map((res, i) => (
                             <button key={i} onClick={() => {
                               if (!editingItem.image_url) setEditingItem({...editingItem, image_url: res.link});
                               else if (!editingItem.image_url_2) setEditingItem({...editingItem, image_url_2: res.link});
                               else setEditingItem({...editingItem, image_url_3: res.link});
                             }} className="aspect-square rounded-[22px] overflow-hidden border-4 border-transparent hover:border-blue-500 transition-all relative group shadow-lg bg-white/5">
                                <img src={res.link} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><Plus size={28}/></div>
                             </button>
                           ))}
                        </div>
                        <button onClick={() => setEditingItem({...editingItem, image_url:'', image_url_2:'', image_url_3:''})} className="text-[9px] font-black text-slate-500 uppercase tracking-widest relative z-10 hover:text-white transition-colors">נקה תמונות</button>
                     </div>

                     <button onClick={handleSave} className="w-full bg-emerald-500 text-white py-8 rounded-[35px] font-black text-2xl flex items-center justify-center gap-5 shadow-2xl border-b-[10px] border-emerald-700 active:scale-95 transition-all uppercase italic tracking-tighter">
                        <Save size={32}/> הזרק DNA לביצוע
                     </button>
                  </div>

                  {/* LIVE SIMULATOR */}
                  <div className="space-y-6 flex flex-col items-center">
                     <div className="flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-slate-200 shadow-sm">
                        <Smartphone size={16} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] italic">VIP Portal Simulator</span>
                     </div>
                     
                     <motion.div layout className="bg-slate-900 rounded-[65px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5 sticky top-10 w-full max-w-[440px]">
                        
                        {/* Images Section */}
                        <div className="p-8">
                           <div className="flex gap-4 h-64">
                              {/* Main Image */}
                              <div className="flex-[2] bg-slate-800 rounded-[35px] overflow-hidden relative border border-white/10 group">
                                 {editingItem.image_url ? <img src={editingItem.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={48}/></div>}
                                 <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase shadow-lg animate-pulse tracking-widest">Main</div>
                              </div>
                              {/* Small Images */}
                              <div className="flex-1 flex flex-col gap-4">
                                 <div className="flex-1 bg-slate-800 rounded-[25px] overflow-hidden border border-white/10">
                                    {editingItem.image_url_2 ? <img src={editingItem.image_url_2} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={20}/></div>}
                                 </div>
                                 <div className="flex-1 bg-slate-800 rounded-[25px] overflow-hidden border border-white/10">
                                    {editingItem.image_url_3 ? <img src={editingItem.image_url_3} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={20}/></div>}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* YouTube Player Section - NEW */}
                        {getYoutubeId(editingItem.video_url) && (
                          <div className="px-8 pb-8">
                             <div className="aspect-video bg-black rounded-[30px] overflow-hidden border border-white/10 shadow-xl group relative">
                                <iframe 
                                   className="w-full h-full"
                                   src={`https://www.youtube.com/embed/${getYoutubeId(editingItem.video_url)}?autoplay=0&controls=1&modestbranding=1`}
                                   title="YouTube video player"
                                   frameBorder="0"
                                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                   allowFullScreen
                                />
                                <div className="absolute top-4 left-4 bg-rose-600 text-white px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                   <Play size={10} fill="currentColor"/> Video Guide
                                </div>
                             </div>
                          </div>
                        )}

                        <div className="px-10 pb-10 space-y-8">
                           <div className="text-right">
                              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">{editingItem.product_name || "שם המוצר יופיע כאן"}</h2>
                              <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">SKU {editingItem.sku || "0000"}</span>
                           </div>

                           {/* Technical Matrix */}
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 border border-white/5 p-6 rounded-[30px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
                                 <p className="text-[9px] font-black text-slate-500 uppercase italic mb-2 tracking-widest">זמן ייבוש</p>
                                 <p className="text-xl font-black text-white italic tracking-tighter flex items-center justify-center gap-2">
                                    <Clock size={16} className="text-blue-500"/> {editingItem.drying_time || "--"}
                                 </p>
                              </div>
                              <div className="bg-white/5 border border-white/5 p-6 rounded-[30px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
                                 <p className="text-[9px] font-black text-slate-500 uppercase italic mb-2 tracking-widest">כושר כיסוי</p>
                                 <p className="text-xl font-black text-blue-400 italic tracking-tighter leading-none">
                                    {editingItem.coverage_info || "--"}
                                 </p>
                              </div>
                           </div>

                           {/* Saban OS Approved Stamp */}
                           <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[35px] relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full" />
                              <div className="relative z-10 flex items-center justify-between mb-4">
                                 <span className="text-[10px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-2"><Sparkles size={14}/> Saban Specialist Advice</span>
                                 <ShieldCheck size={18} className="text-emerald-500" />
                              </div>
                              <p className="text-white text-sm font-bold leading-relaxed text-right opacity-80 italic">
                                 "שיטת יישום מומלצת: {editingItem.application_method || 'נא להגדיר שיטת יישום בדף המנהל'}. שים לב להנחיות המוח הלוגיסטי."
                              </p>
                           </div>

                           <button className="w-full bg-white text-slate-900 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-4 border-b-8 border-slate-200 active:scale-95 transition-all italic">
                              הוסף להזמנה <ArrowUpRight size={20} className="text-blue-600" />
                           </button>
                        </div>
                     </motion.div>
                  </div>
               </motion.div>
             ) : (
               <div className="h-[850px] bg-white rounded-[60px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-20 shadow-inner group">
                  <div className="w-36 h-36 bg-slate-50 rounded-[50px] flex items-center justify-center text-slate-200 mb-10 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                     <Palette size={80} strokeWidth={1} />
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 italic uppercase mb-6 tracking-tighter tracking-tight">Catalog Designer Elite</h3>
                  <p className="text-slate-400 max-w-md font-bold text-base leading-relaxed uppercase tracking-widest italic opacity-60">
                    בחר מוצר כדי להתחיל לערוך את ה-DNA המקצועי שלו. המערכת תציג ללקוח את הכרטיס המלא כולל סרטוני הדרכה ומפרטי יישום.
                  </p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      <footer className="py-16 border-t border-slate-200 opacity-20 text-center uppercase text-[10px] font-black tracking-[0.8em]">Saban Visual Intel & Tech Studio V33.0</footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
