"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Scale, Package, Search, Save, AlertTriangle, 
  RefreshCw, Layers, Truck, Filter, ArrowUpDown,
  History, Info, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

/**
 * Saban Admin Pro - Inventory & Weights Control
 * -------------------------------------------
 * Logic: Managing the 12-ton truck rule via product weights.
 * DB: Connected to 'product_weights' table.
 */

export default function InventoryWeights() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingSku, setUpdatingSku] = useState<string | null>(null);

  // 1. שליפת נתוני משקלים מה-DB
  const fetchWeights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_weights')
        .select('*')
        .order('sku', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      toast.error("שגיאה בסנכרון משקלים: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWeights(); }, []);

  // 2. עדכון משקל לוגיסטי בזמן אמת
  const updateWeight = async (sku: string, weight: number) => {
    setUpdatingSku(sku);
    try {
      const { error } = await supabase
        .from('product_weights')
        .update({ weight_kg: weight })
        .eq('sku', sku);

      if (error) throw error;
      toast.success(`משקל מק"ט ${sku} עודכן ב-DNA`);
      // עדכון מקומי מהיר
      setItems(prev => prev.map(item => item.sku === sku ? { ...item, weight_kg: weight } : item));
    } catch (err) {
      toast.error("עדכון נכשל");
    } finally {
      setUpdatingSku(null);
    }
  };

  const filteredItems = items.filter(i => 
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 max-w-7xl mx-auto"
    >
      
      {/* Executive Logistics Banner */}
      <div className="bg-slate-900 rounded-[45px] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white rounded-[35px] flex items-center justify-center shadow-xl border-4 border-blue-500/20 text-blue-600">
                <Truck size={48} />
              </div>
              <div className="text-right lg:text-right">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-3">בקרת עומס משאית (12 טון)</h2>
                <p className="text-blue-300/80 text-sm font-bold leading-relaxed max-w-xl">
                  ניהול משקלים קריטי עבור המוח הלוגיסטי. נתונים אלו קובעים מתי המערכת עוצרת את בר או לקוחות VIP אחרים בשטח כדי למנוע חריגות ודו"חות.
                </p>
              </div>
           </div>
           <div className="flex gap-4">
              <div className="bg-white/5 border border-white/10 p-5 rounded-[25px] text-center backdrop-blur-md">
                 <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Total SKUs</p>
                 <p className="text-2xl font-black italic leading-none">{items.length}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[25px] text-center backdrop-blur-md">
                 <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Status</p>
                 <p className="text-2xl font-black italic leading-none text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={20}/> LIVE
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Interface Area */}
      <div className="bg-white rounded-[50px] border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
        
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="relative w-full md:w-[450px] group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                placeholder="חפש מק''ט או מוצר במלאי..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 pr-14 pl-6 py-4 rounded-2xl font-bold shadow-sm outline-none focus:ring-8 ring-blue-500/5 transition-all italic text-lg" 
              />
           </div>
           <div className="flex items-center gap-3">
              <button 
                onClick={fetchWeights}
                className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
              </button>
              <div className="h-10 w-[1px] bg-slate-200 mx-2" />
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 font-black text-[10px] uppercase tracking-widest italic">
                 <AlertTriangle size={14} /> Critical Data
              </div>
           </div>
        </div>

        {/* Inventory Grid */}
        <div className="p-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[40px]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredItems.map((item, i) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ delay: i * 0.02 }}
                    key={item.sku} 
                    className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 relative group hover:border-blue-300 hover:bg-white transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-blue-600 border border-slate-100 group-hover:scale-110 transition-transform">
                        <Layers size={28}/>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded-lg italic inline-block mb-1">SKU Identification</div>
                         <p className="font-black text-slate-900 text-lg">{item.sku}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mr-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 italic tracking-widest">משקל לביצוע (ק"ג)</label>
                           {updatingSku === item.sku && <Loader2 className="animate-spin text-blue-500" size={14} />}
                        </div>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                             <input 
                                type="number"
                                defaultValue={item.weight_kg} 
                                onBlur={(e) => {
                                   const val = parseFloat(e.target.value);
                                   if (val !== item.weight_kg) updateWeight(item.sku, val);
                                }}
                                className="w-full bg-white border-2 border-slate-100 p-5 rounded-[22px] font-black text-3xl outline-none focus:border-blue-500 focus:ring-8 ring-blue-500/5 transition-all text-center" 
                             />
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-200 italic text-sm">KG</span>
                          </div>
                          <div className={`w-18 h-18 rounded-[22px] flex flex-col items-center justify-center font-black text-[10px] uppercase shadow-inner border border-transparent transition-colors ${
                            item.is_big_bag 
                            ? 'bg-blue-100 text-blue-700 border-blue-200' 
                            : 'bg-slate-200 text-slate-500'
                          }`}>
                            <Package size={20} className="mb-1" />
                            {item.is_big_bag ? 'Big Bag' : 'Bag'}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                         <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 italic"><History size={12}/> Last Sync: Live</p>
                         <button className="text-blue-500 hover:text-blue-700 p-2"><Info size={18}/></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="py-32 text-center space-y-6">
               <Scale size={80} className="mx-auto text-slate-100" />
               <div>
                  <p className="text-slate-400 font-black italic uppercase tracking-widest text-lg">לא נמצאו מק"טים תואמים</p>
                  <p className="text-slate-300 text-xs font-bold mt-2">נסה לחפש לפי המק"ט המדויק מהטבלה</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer System Context */}
      <footer className="py-12 border-t border-slate-200 opacity-20 flex justify-between items-center px-10">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Payload Management System V24.0</p>
         <div className="flex gap-1">
            {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
         </div>
      </footer>
    </motion.div>
  );
}
