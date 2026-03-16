"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Layout, Search, RefreshCw, Layers, Save, 
  Plus, X, Globe, Sparkles, Palette, ChevronRight, 
  Calculator, Package, Image as ImageIcon, ArrowUpRight
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
