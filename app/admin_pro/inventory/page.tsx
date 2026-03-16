"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Layout, Search, RefreshCw, Layers, Save, 
  Plus, X, Globe, Sparkles, Palette, ChevronRight, 
  Calculator, Package, Image as ImageIcon, ArrowUpRight"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Scale, Package, Search, RefreshCw, Layers, Truck, 
  Image as ImageIcon, Video, Save, Plus, X, Globe,
  CheckCircle2, Loader2, Sparkles, Layout, Palette,
  ChevronRight, ArrowUpRight, Calculator, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Inventory & Catalog Studio V31.0
 * --------------------------------------------------
 * Fixes: 
 * - Fixed Supabase Join 400 Error by separate fetching.
 * - Added missing Loader2 import.
 * - Added Null-safety for search filters.
 */

export default function InventoryCatalogStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States לסטודיו העיצוב
  const [editingItem, setEditingItem] = useState<any>(null);
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [searchType, setSearchType] = useState<'image' | 'video'>('image');

  // 1. שליפת נתונים בטוחה (ללא Join מורכב למניעת 400)
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: invData, error: invErr } = await supabase.from('inventory').select('*');
      const { data: weightData, error: weightErr } = await supabase.from('product_weights').select('*');

      if (invErr || weightErr) throw new Error("Database Fetch Failed");

      setItems(invData || []);
      setWeights(weightData || []);
    } catch (err: any) {
      toast.error("שגיאה בסנכרון המלאי");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // מיזוג נתונים בזמן אמת לצורך תצוגה
  const enrichedItems = useMemo(() => {
    return items.map(item => {
      const weightInfo = weights.find(w => w.sku === item.sku);
      return {
        ...item,
        weight_kg: weightInfo?.weight_kg || 0,
        is_big_bag: weightInfo?.is_big_bag || false
      };
    });
  }, [items, weights]);

  // 2. חיפוש נכסים בגוגל
  const searchGoogleAssets = async () => {
    if (!editingItem?.product_name) return;
    setIsSearchingGoogle(true);
    try {
      const res = await fetch(`/api/google/search?q=${encodeURIComponent(editingItem.product_name)}&type=${searchType}`);
      const data = await res.json();
      setGoogleResults(data);
    } catch (err) {
      toast.error("שגיאה בחיפוש גוגל");
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // 3. שמירת מוצר
  const handleSave = async () => {
    const toastId = toast.loading("מעדכן DNA...");
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

      if (invErr || weightErr) throw new Error("Save Failed");

      toast.success("כרטיס מוצר עודכן ב-DNA של סבן 🦾", { id: toastId });
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error("שגיאה בשמירה", { id: toastId });
    }
  };

  const filteredItems = enrichedItems.filter(i => 
    (i.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.sku || "").toString().includes(searchTerm)
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans pb-20 px-4 md:px-8" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-[45px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-white/5 mt-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6 md:gap-8">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[30px] flex items-center justify-center shadow-xl text-blue-600 border-4 border-blue-50 shrink-0">
                <Palette size={40} />
              </div>
              <div className="text-right">
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">סטודיו קטלוג ו-DNA</h2>
                <p className="text-blue-300/80 text-[10px] md:text-sm font-bold uppercase tracking-widest italic">Inventory Visuals & Logistic Guard</p>
              </div>
           </div>
           <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  placeholder="חיפוש מק''ט או שם..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 pr-12 pl-4 py-4 rounded-2xl font-bold outline-none focus:bg-white/10 transition-all text-sm"
                />
              </div>
              <button 
                onClick={() => setEditingItem({ sku: '', product_name: '', weight_kg: 25, is_big_bag: false })}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <Plus size={18}/> הוסף מוצר
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inventory List */}
        <div className="lg:col-span-4 space-y-4 h-full">
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[800px]">
             <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 italic uppercase text-xs flex items-center gap-2 tracking-widest">
                  <Layers size={16} className="text-blue-600"/> מלאי קיים ({filteredItems.length})
                </h3>
                <button onClick={fetchData} className="p-2 hover:bg-white rounded-xl transition-all">
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />)}
                  </div>
                ) : filteredItems.map(item => (
                  <button 
                    key={item.sku}
                    onClick={() => setEditingItem(item)}
                    className={`w-full p-4 rounded-3xl border text-right transition-all group flex items-center justify-between ${editingItem?.sku === item.sku ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                          {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <Package size={20} className="text-slate-300"/>}
                       </div>
                       <div>
                          <p className={`font-black text-sm leading-none ${editingItem?.sku === item.sku ? 'text-white' : 'text-slate-900'}`}>{item.product_name || "ללא שם"}</p>
                          <p className={`text-[10px] font-bold mt-1.5 uppercase italic ${editingItem?.sku === item.sku ? 'text-blue-400' : 'text-slate-400'}`}>SKU: {item.sku}</p>
                       </div>
                    </div>
                    <ChevronRight size={18} className={editingItem?.sku === item.sku ? 'text-white' : 'text-slate-200'} />
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Studio & Simulator */}
        <div className="lg:col-span-8 space-y-8">
           <AnimatePresence mode="wait">
             {editingItem ? (
               <motion.div 
                 key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full"
               >
                  {/* Editor Panel */}
                  <div className="bg-white rounded-[45px] border border-slate-200 shadow-2xl p-8 md:p-10 space-y-8 overflow-y-auto max-h-[800px] scrollbar-hide">
                     <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                        <h3 className="text-xl font-black italic uppercase text-slate-900 flex items-center gap-3">
                           <Layout className="text-blue-600" /> עורך כרטיס מוצר
                        </h3>
                        <button onClick={() => setEditingItem(null)} className="p-3 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={20}/></button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">שם המוצר</label>
                           <input 
                              value={editingItem.product_name || ""}
                              onChange={e => setEditingItem({...editingItem, product_name: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-black outline-none focus:border-blue-600 transition-all text-sm text-right"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">מק"ט (SKU)</label>
                           <input 
                              value={editingItem.sku || ""}
                              onChange={e => setEditingItem({...editingItem, sku: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-black outline-none focus:border-blue-600 transition-all text-sm text-right"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">משקל יחידה (KG)</label>
                           <input 
                              type="number"
                              value={editingItem.weight_kg || ""}
                              onChange={e => setEditingItem({...editingItem, weight_kg: parseFloat(e.target.value)})}
                              className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-black outline-none focus:border-blue-600 transition-all text-sm text-right"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">סוג אריזה</label>
                           <select 
                              value={editingItem.is_big_bag ? "true" : "false"}
                              onChange={e => setEditingItem({...editingItem, is_big_bag: e.target.value === "true"})}
                              className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl font-black outline-none focus:border-blue-600 transition-all text-sm text-right"
                           >
                              <option value="false">שק / יחידה רגילה</option>
                              <option value="true">בלה / משטח / BIG BAG</option>
                           </select>
                        </div>
                     </div>

                     {/* Google Search Integration */}
                     <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                           <h4 className="font-black text-[10px] uppercase tracking-widest italic text-slate-400">חיפוש נכסים (Google Search)</h4>
                           <div className="flex gap-2">
                              <button onClick={() => setSearchType('image')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${searchType === 'image' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>Images</button>
                              <button onClick={() => setSearchType('video')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${searchType === 'video' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>Video</button>
                           </div>
                        </div>
                        <button 
                          onClick={searchGoogleAssets}
                          disabled={isSearchingGoogle || !editingItem.product_name}
                          className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
                        >
                           {isSearchingGoogle ? <Loader2 className="animate-spin" size={16}/> : <Globe size={16} className="text-blue-500" />}
                           סרוק את הרשת עבור "{editingItem.product_name}"
                        </button>

                        <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[180px] scrollbar-hide p-1">
                           {googleResults.map((res, i) => (
                             <button 
                               key={i}
                               onClick={() => setEditingItem({...editingItem, image_url: res.link})}
                               className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-blue-600 transition-all relative group"
                             >
                                <img src={res.link} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><CheckCircle2 size={24}/></div>
                             </button>
                           ))}
                        </div>
                     </div>

                     <button 
                        onClick={handleSave}
                        className="w-full bg-emerald-500 text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl border-b-8 border-emerald-700 active:scale-95 transition-all uppercase italic"
                     >
                        <Save size={28}/> שמור DNA לביצוע בשטח
                     </button>
                  </div>

                  {/* LIVE SIMULATOR */}
                  <div className="space-y-6">
                     <div className="text-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] italic">Real-time UI Simulator</span>
                     </div>
                     
                     <div className="bg-slate-900 rounded-[55px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/5 sticky top-8">
                        <div className="relative aspect-square bg-slate-800">
                           {editingItem.image_url ? (
                             <img src={editingItem.image_url} className="w-full h-full object-cover opacity-80" />
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                                <ImageIcon size={64}/>
                                <p className="font-black text-[10px] uppercase tracking-[0.3em]">No Media Selected</p>
                             </div>
                           )}
                           <div className="absolute top-8 left-8 bg-blue-600 text-white px-5 py-2 rounded-2xl font-black text-[10px] shadow-2xl animate-pulse tracking-widest uppercase">Live View</div>
                           
                           <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
                              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">{editingItem.product_name || "שם מוצר לדוגמה"}</h2>
                              <div className="flex items-center gap-3">
                                 <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase italic border border-white/10 tracking-widest">SKU {editingItem.sku || "0000"}</span>
                                 <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase italic border border-blue-500/20 tracking-widest">Saban OS Approved</span>
                              </div>
                           </div>
                        </div>

                        <div className="p-10 space-y-8">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center shadow-inner group">
                                 <p className="text-[10px] font-black text-slate-500 uppercase italic mb-2 tracking-widest">משקל DNA</p>
                                 <p className="text-3xl font-black text-white italic tracking-tighter">{editingItem.weight_kg || "0"} <span className="text-xs">KG</span></p>
                              </div>
                              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center shadow-inner">
                                 <p className="text-[10px] font-black text-slate-500 uppercase italic mb-2 tracking-widest">סוג אריזה</p>
                                 <p className="text-xl font-black text-blue-400 italic uppercase tracking-tighter leading-none mt-1">{editingItem.is_big_bag ? "BIG BAG" : "STANDARD"}</p>
                              </div>
                           </div>

                           <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[35px] relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/5 blur-3xl rounded-full" />
                              <div className="relative z-10 flex items-center justify-between mb-4">
                                 <span className="text-[10px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-2"><Sparkles size={14}/> Ai Description DNA</span>
                                 <ChevronRight size={14} className="text-blue-500/40" />
                              </div>
                              <p className="text-white text-sm font-bold leading-relaxed text-right opacity-80 italic">
                                 {editingItem.description || "כאן יופיע תיאור המוצר המבוסס על ספר החוקים. ה-AI יסביר ללקוח בפורטל למה המוצר הזה הוא בדיוק מה שהוא צריך לפרויקט הנוכחי."}
                              </p>
                           </div>

                           <button className="w-full bg-white text-slate-900 py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 border-b-8 border-slate-200 active:scale-95 transition-all italic">
                              הוסף לפקודת עבודה <ArrowUpRight size={20}/>
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
             ) : (
               <div className="h-[800px] bg-white rounded-[50px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-20 shadow-inner">
                  <div className="w-32 h-32 bg-slate-50 rounded-[45px] flex items-center justify-center text-slate-200 mb-8 border-4 border-white shadow-md">
                     <Palette size={64} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 italic uppercase mb-4 tracking-tighter">מוכן לעיצוב ה-DNA</h3>
                  <p className="text-slate-400 max-w-sm font-bold text-sm leading-relaxed uppercase tracking-widest italic">
                    בחר מוצר מרשימת המלאי כדי להתחיל לערוך את הכרטיס שלו. תוכל למשוך תמונות מגוגל ולראות בסימולטור החי איך הלקוח יראה את זה בפורטל ה-VIP.
                  </p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      <footer className="py-12 border-t border-slate-200 opacity-20 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.6em] italic text-slate-900">Saban Visual Intelligence & Logistic Studio V31.0</p>
      </footer>
    </div>
  );
}
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Inventory & Catalog Studio V30.0
 * --------------------------------------------------
 * Simulator: Real-time UI card preview for products.
 * Search: Integrated Google Search for media.
 */

export default function InventoryStudio() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select(`*, product_weights(weight_kg, is_big_bag)`).order('product_name');
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const searchGoogle = async () => {
    if (!editingItem?.product_name) return;
    setIsSearchingGoogle(true);
    try {
      const res = await fetch(`/api/google/search?q=${encodeURIComponent(editingItem.product_name)}`);
      const data = await res.json();
      setGoogleResults(data);
    } catch (e) { toast.error("חיפוש נכשל"); } finally { setIsSearchingGoogle(false); }
  };

  const handleSave = async () => {
    const toastId = toast.loading("מעדכן DNA...");
    try {
      await Promise.all([
        supabase.from('inventory').upsert({ sku: editingItem.sku, product_name: editingItem.product_name, image_url: editingItem.image_url }),
        supabase.from('product_weights').upsert({ sku: editingItem.sku, weight_kg: editingItem.weight_kg })
      ]);
      toast.success("המוצר עודכן בהצלחה", { id: toastId });
      setEditingItem(null);
      fetchInventory();
    } catch (e) { toast.error("שגיאה בשמירה"); }
  };

  const filtered = items.filter(i => (i.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-6 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white flex justify-between items-center shadow-2xl border border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl"><Layout size={32}/></div>
          <div className="text-right">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">סטודיו קטלוג ומשקלים</h2>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest italic">Visual & Logic Studio</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input placeholder="חיפוש..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 pr-12 pl-4 py-4 rounded-xl outline-none focus:bg-white/10" />
          </div>
          <button onClick={() => setEditingItem({ sku: '', product_name: '', weight_kg: 25 })} className="bg-blue-600 px-6 py-4 rounded-xl font-black text-xs uppercase"><Plus size={18}/></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* List */}
        <div className="col-span-4 bg-white rounded-[40px] border border-slate-200 shadow-xl h-[700px] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-xs uppercase tracking-widest italic">מלאי ({filtered.length})</h3>
            <button onClick={fetchInventory}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.map(item => (
              <button key={item.sku} onClick={() => setEditingItem({...item, weight_kg: item.product_weights?.weight_kg})} className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between ${editingItem?.sku === item.sku ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover"/> : <Package size={18} className="text-slate-300"/>}
                  </div>
                  <div>
                    <p className="font-black text-sm leading-none">{item.product_name}</p>
                    <p className={`text-[9px] mt-1 font-bold ${editingItem?.sku === item.sku ? 'text-blue-100' : 'text-slate-400'}`}>SKU: {item.sku}</p>
                  </div>
                </div>
                <ChevronRight size={16}/>
              </button>
            ))}
          </div>
        </div>

        {/* Studio */}
        <div className="col-span-8">
          <AnimatePresence mode="wait">
            {editingItem ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-2 gap-8">
                {/* Editor */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl p-10 space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black italic uppercase">עורך כרטיס</h3>
                    <button onClick={() => setEditingItem(null)} className="p-2 bg-slate-50 rounded-xl"><X/></button>
                  </div>
                  <div className="space-y-4">
                    <input placeholder="שם המוצר" value={editingItem.product_name} onChange={e => setEditingItem({...editingItem, product_name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-black text-sm" />
                    <input placeholder="מק''ט" value={editingItem.sku} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-black text-sm" />
                    <input type="number" placeholder="משקל" value={editingItem.weight_kg} onChange={e => setEditingItem({...editingItem, weight_kg: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl font-black text-sm" />
                    
                    <button onClick={searchGoogle} disabled={isSearchingGoogle} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                      {isSearchingGoogle ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                      חיפוש תמונה בגוגל
                    </button>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {googleResults.slice(0, 6).map((res, i) => (
                        <button key={i} onClick={() => setEditingItem({...editingItem, image_url: res.link})} className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-600 transition-all shadow-sm">
                          <img src={res.link} className="w-full h-full object-cover"/>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleSave} className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl border-b-4 border-emerald-700 active:scale-95 transition-all">שמור DNA לביצוע 🦾</button>
                </div>

                {/* Simulator */}
                <div className="bg-slate-900 rounded-[50px] overflow-hidden shadow-2xl border border-white/5 sticky top-6">
                  <div className="aspect-square bg-slate-800 relative">
                    {editingItem.image_url ? <img src={editingItem.image_url} className="w-full h-full object-cover opacity-80"/> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-4"><ImageIcon size={48}/><p className="text-[10px] font-black uppercase tracking-widest">No Media</p></div>}
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-[10px] shadow-lg animate-pulse">LIVE SIMULATOR</div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
                      <h2 className="text-2xl font-black text-white italic leading-none">{editingItem.product_name || "שם מוצר"}</h2>
                      <p className="text-blue-400 font-bold text-[10px] mt-2 uppercase tracking-widest">SKU: {editingItem.sku || "0000"}</p>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/10">
                        <p className="text-[9px] font-black text-slate-500 uppercase italic">Weight</p>
                        <p className="text-xl font-black text-white">{editingItem.weight_kg || '0'} KG</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/10">
                        <p className="text-[9px] font-black text-slate-500 uppercase italic">Status</p>
                        <p className="text-xl font-black text-blue-400">READY</p>
                      </div>
                    </div>
                    <button className="w-full bg-white text-slate-900 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">הוסף להזמנה <ArrowUpRight size={14}/></button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[700px] bg-white rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6"><Palette size={40}/></div>
                <h3 className="text-xl font-black text-slate-800 italic uppercase">מוכן לעיצוב</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic mt-2">בחר מוצר כדי להתחיל סימולציה</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
