"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Scale, Package, Search, RefreshCw, Layers, Truck, 
  Image as ImageIcon, Video, Save, Plus, X, Globe,
  CheckCircle2, Loader2, Sparkles, Layout, Palette,
  ChevronRight, ArrowUpRight, Calculator, AlertTriangle,
  Eye, FileText, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Catalog Studio V32.0
 * -------------------------------------
 * - Feature: Real-time UI Card Simulator for VIP Portal.
 * - Integration: Google Assets Search (Image/Video).
 * - Fix: Null-safe filtering and separate DB fetching for stability.
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

  // 1. שליפת נתונים חסינה (ללא Join למניעת 400)
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

  // מיזוג נתונים לוגיסטיים
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

  // 2. חיפוש נכסים בגוגל
  const searchGoogle = async () => {
    if (!editingItem?.product_name) return;
    setIsSearchingGoogle(true);
    setGoogleResults([]);
    try {
      const res = await fetch(`/api/google/search?q=${encodeURIComponent(editingItem.product_name)}&type=${assetType}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGoogleResults(data);
    } catch (err: any) {
      toast.error("חיפוש גוגל נכשל: " + err.message);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // 3. שמירת DNA מוצר
  const handleSave = async () => {
    const toastId = toast.loading("מזריק DNA למערכת...");
    try {
      const { error: invErr } = await supabase.from('inventory').upsert({
        sku: editingItem.sku,
        product_name: editingItem.product_name,
        image_url: editingItem.image_url,
        description: editingItem.description,
        price: editingItem.price
      });

      const { error: weightErr } = await supabase.from('product_weights').upsert({
        sku: editingItem.sku,
        weight_kg: editingItem.weight_kg,
        is_big_bag: editingItem.is_big_bag
      });

      if (invErr || weightErr) throw new Error("Database update failed");

      toast.success("כרטיס מוצר עודכן ב-DNA 🦾", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error("שגיאה בשמירה", { id: toastId });
    }
  };

  // סינון חסין ל-Null (תיקון includeלקוחות)
  const filteredItems = enrichedItems.filter(i => {
    const term = searchTerm.toLowerCase();
    const name = (i.product_name || "").toLowerCase();
    const sku = (i.sku || "").toString().toLowerCase();
    return name.includes(term) || sku.includes(term);
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans pb-20 px-4 md:px-8" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Hero Banner */}
      <div className="bg-slate-900 rounded-[45px] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5 mt-4">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center shadow-2xl text-blue-600 border-4 border-blue-50 shrink-0">
                <Layout size={42} />
              </div>
              <div className="text-right">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mb-3">סטודיו קטלוג ו-DNA</h2>
                <p className="text-blue-300/80 text-xs md:text-sm font-bold uppercase tracking-[0.3em] italic">Visual Identity & Payload Simulator</p>
              </div>
           </div>
           <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-80 group">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input 
                  placeholder="חיפוש מהיר במלאי..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 pr-14 pl-6 py-5 rounded-[22px] font-bold outline-none focus:bg-white/10 focus:ring-4 ring-blue-500/10 transition-all text-sm"
                />
              </div>
              <button 
                onClick={() => setEditingItem({ sku: '', product_name: '', weight_kg: 25, is_big_bag: false, image_url: '', description: '' })}
                className="bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 border-b-4 border-blue-800"
              >
                <Plus size={20}/> מוצר חדש
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Inventory List Side */}
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
                    layout
                    key={item.sku}
                    onClick={() => { setEditingItem(item); setGoogleResults([]); }}
                    className={`w-full p-5 rounded-[32px] border text-right transition-all group flex items-center justify-between relative overflow-hidden ${editingItem?.sku === item.sku ? 'bg-slate-900 border-slate-900 shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-blue-300 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-200 shadow-inner group-hover:scale-110 transition-transform">
                          {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <Package size={24} className="text-slate-300"/>}
                       </div>
                       <div>
                          <p className={`font-black text-base leading-none ${editingItem?.sku === item.sku ? 'text-white' : 'text-slate-900'}`}>{item.product_name || "ללא שם"}</p>
                          <div className="flex items-center gap-3 mt-2">
                             <span className={`text-[10px] font-black uppercase italic ${editingItem?.sku === item.sku ? 'text-blue-400' : 'text-slate-400'}`}>SKU: {item.sku}</span>
                             <span className={`text-[10px] font-black uppercase italic flex items-center gap-1 ${editingItem?.sku === item.sku ? 'text-emerald-400' : 'text-slate-300'}`}><Scale size={10}/> {item.weight_kg}kg</span>
                          </div>
                       </div>
                    </div>
                    <ChevronRight size={22} className={editingItem?.sku === item.sku ? 'text-blue-500' : 'text-slate-200'} />
                  </motion.button>
                ))}
             </div>
          </div>
        </div>

        {/* Studio Panel */}
        <div className="lg:col-span-8 space-y-8">
           <AnimatePresence mode="wait">
             {editingItem ? (
               <motion.div 
                 key="studio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="grid grid-cols-1 xl:grid-cols-2 gap-10"
               >
                  {/* Editor Card */}
                  <div className="bg-white rounded-[50px] border border-slate-200 shadow-2xl p-8 md:p-12 space-y-10 overflow-y-auto max-h-[850px] scrollbar-hide relative">
                     <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Palette size={28}/></div>
                           <h3 className="text-2xl font-black italic uppercase text-slate-900">עורך ה-DNA</h3>
                        </div>
                        <button onClick={() => setEditingItem(null)} className="p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X size={24}/></button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">שם המוצר בקטלוג</label>
                           <input 
                              value={editingItem.product_name || ""}
                              onChange={e => setEditingItem({...editingItem, product_name: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black outline-none focus:border-blue-600 focus:bg-white transition-all text-right"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">זיהוי (SKU)</label>
                           <input 
                              value={editingItem.sku || ""}
                              onChange={e => setEditingItem({...editingItem, sku: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black outline-none focus:border-blue-600 focus:bg-white transition-all text-right"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">משקל יחידה (KG)</label>
                           <div className="relative">
                              <input 
                                 type="number"
                                 value={editingItem.weight_kg || ""}
                                 onChange={e => setEditingItem({...editingItem, weight_kg: parseFloat(e.target.value)})}
                                 className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black outline-none focus:border-blue-600 focus:bg-white transition-all text-right"
                              />
                              <Calculator className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">תצורת אריזה</label>
                           <select 
                              value={editingItem.is_big_bag ? "true" : "false"}
                              onChange={e => setEditingItem({...editingItem, is_big_bag: e.target.value === "true"})}
                              className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black outline-none focus:border-blue-600 focus:bg-white transition-all text-right appearance-none"
                           >
                              <option value="false">שק / יחידה סטנדרטית</option>
                              <option value="true">בלה / משטח / BIG BAG</option>
                           </select>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">תיאור שיווקי (מוזרק למוח)</label>
                        <textarea 
                           rows={4}
                           value={editingItem.description || ""}
                           onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                           className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-3xl font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-right leading-relaxed scrollbar-hide"
                           placeholder="ספר למוח למה המוצר הזה טוב ללקוח..."
                        />
                     </div>

                     {/* Google Search Integrated UI */}
                     <div className="bg-slate-900 rounded-[40px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
                        <div className="flex justify-between items-center relative z-10">
                           <h4 className="font-black text-xs uppercase tracking-widest italic text-blue-400 flex items-center gap-2">
                             <Globe size={16}/> סריקת נכסים דיגיטליים
                           </h4>
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
                           חפש "{editingItem.product_name}" ברשת
                        </button>

                        <div className="grid grid-cols-3 gap-4 max-h-[220px] overflow-y-auto scrollbar-hide p-1 relative z-10">
                           {googleResults.map((res, i) => (
                             <motion.button 
                               initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                               key={i}
                               onClick={() => setEditingItem({...editingItem, image_url: res.link})}
                               className="aspect-square rounded-[22px] overflow-hidden border-4 border-transparent hover:border-blue-500 transition-all relative group shadow-lg"
                             >
                                <img src={res.link} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><CheckCircle2 size={28}/></div>
                             </motion.button>
                           ))}
                        </div>
                     </div>

                     <button 
                        onClick={handleSave}
                        className="w-full bg-emerald-500 text-white py-8 rounded-[35px] font-black text-2xl flex items-center justify-center gap-5 shadow-2xl border-b-[10px] border-emerald-700 active:scale-95 transition-all uppercase italic tracking-tighter"
                     >
                        <Save size={32}/> הזרק DNA לביצוע בשטח
                     </button>
                  </div>

                  {/* LIVE SIMULATOR (Visual Card) */}
                  <div className="space-y-8 flex flex-col items-center">
                     <div className="flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-slate-200 shadow-sm">
                        <Smartphone size={16} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] italic">Real-time UI Simulator</span>
                     </div>
                     
                     <motion.div 
                        layout
                        className="bg-slate-900 rounded-[65px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-white/5 sticky top-10 w-full max-w-[420px]"
                     >
                        <div className="relative aspect-square bg-slate-800">
                           <AnimatePresence mode="wait">
                             <motion.div 
                                key={editingItem.image_url} 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="w-full h-full"
                             >
                               {editingItem.image_url ? (
                                 <img src={editingItem.image_url} className="w-full h-full object-cover opacity-80" />
                               ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-6">
                                    <ImageIcon size={80} strokeWidth={1} />
                                    <p className="font-black text-[10px] uppercase tracking-[0.5em] opacity-40 italic text-center px-10 leading-relaxed">Select media from Google assets to visualize</p>
                                 </div>
                               )}
                             </motion.div>
                           </AnimatePresence>
                           
                           <div className="absolute top-10 left-10 bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-[10px] shadow-2xl animate-pulse tracking-widest uppercase border border-white/20">LIVE VIEW</div>
                           
                           <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
                              <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-5">{editingItem.product_name || "שם מוצר לדוגמה"}</h2>
                              <div className="flex items-center gap-4">
                                 <span className="bg-white/10 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic border border-white/10 tracking-widest">SKU {editingItem.sku || "0000"}</span>
                                 <span className="bg-blue-600/30 text-blue-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic border border-blue-500/30 tracking-widest flex items-center gap-2"><ShieldCheck size={12}/> Saban Approved</span>
                              </div>
                           </div>
                        </div>

                        <div className="p-12 space-y-10">
                           <div className="grid grid-cols-2 gap-6">
                              <div className="bg-white/5 border border-white/5 p-8 rounded-[35px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
                                 <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3 tracking-widest">משקל DNA</p>
                                 <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{editingItem.weight_kg || "0"} <span className="text-xs uppercase text-blue-500">kg</span></p>
                              </div>
                              <div className="bg-white/5 border border-white/5 p-8 rounded-[35px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
                                 <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3 tracking-widest">סוג אריזה</p>
                                 <p className="text-xl font-black text-blue-400 italic uppercase tracking-tighter leading-none mt-1">{editingItem.is_big_bag ? "BIG BAG" : "STANDARD"}</p>
                              </div>
                           </div>

                           <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[45px] relative overflow-hidden shadow-inner">
                              <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full" />
                              <div className="relative z-10 flex items-center justify-between mb-5">
                                 <span className="text-[11px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-2"><Sparkles size={16}/> Saban Intelligence</span>
                                 <Eye size={16} className="text-blue-500/40" />
                              </div>
                              <p className="text-white text-[15px] font-bold leading-relaxed text-right opacity-80 italic">
                                 {editingItem.description || "התיאור השיווקי שתכתוב יופיע כאן וישפיע על המוח בפורטל ה-VIP..."}
                              </p>
                           </div>

                           <button className="w-full bg-white text-slate-900 py-7 rounded-[35px] font-black text-xs uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-5 border-b-8 border-slate-200 active:scale-95 transition-all italic ring-8 ring-white/5 hover:bg-blue-50">
                              הוסף לפקודה <ArrowUpRight size={22} className="text-blue-600" />
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
                  <h3 className="text-4xl font-black text-slate-900 italic uppercase mb-6 tracking-tighter">מוכן לעיצוב ה-DNA</h3>
                  <p className="text-slate-400 max-w-md font-bold text-base leading-relaxed uppercase tracking-widest italic opacity-60">
                    בחר מוצר מרשימת המלאי כדי להתחיל לערוך את כרטיס המדיה שלו. תוכל למשוך תמונות/סרטונים מגוגל ולראות בסימולטור החי איך הלקוח יראה את זה בפורטל המבצעי.
                  </p>
                  <div className="mt-12 flex gap-4">
                     {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-slate-100 rounded-full" />)}
                  </div>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      <footer className="py-16 border-t border-slate-200 opacity-20 text-center">
         <p className="text-[11px] font-black uppercase tracking-[0.8em] italic text-slate-900">Saban Visual Intelligence & Logistic Studio V32.0</p>
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
