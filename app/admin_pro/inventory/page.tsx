"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { Scale, Package, Search, Save, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from "sonner";

export default function WeightsCenter() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  async function fetchInventory() {
    setLoading(true);
    const { data } = await supabase.from('product_weights').select('*');
    setItems(data || []);
    setLoading(false);
  }

  async function updateWeight(sku: string, weight: number) {
    const { error } = await supabase.from('product_weights').update({ weight_kg: weight }).eq('sku', sku);
    if (!error) toast.success("המשקל עודכן ב-DNA הלוגיסטי");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-6xl mx-auto">
      
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 rounded-[40px] flex items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full" />
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shrink-0 shadow-xl border-4 border-amber-500/20 text-orange-600"><Scale size={44}/></div>
        <div className="text-white">
          <h3 className="font-black text-3xl italic tracking-tighter leading-none mb-3">בקרת עומס (חוק ה-12 טון)</h3>
          <p className="text-white/80 text-sm font-bold leading-relaxed max-w-2xl">כאן נקבע ה-DNA של המוח לחישוב חריגות משקל למשאיות 'חכמת'. הקפד על דיוק כדי למנוע דו"חות ובלאי משאיות. כל שינוי משפיע על הבלמים בשטח.</p>
        </div>
      </div>

      <div className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="relative w-full md:w-[400px] group">
             <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
             <input placeholder="חפש מק''ט או מוצר..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-slate-200 pr-14 pl-6 py-4 rounded-2xl font-bold shadow-sm outline-none focus:ring-4 ring-blue-500/10 transition-all italic" />
           </div>
           <button onClick={fetchInventory} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
           </button>
        </div>
        
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.filter(i => i.sku.includes(search)).map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              key={item.sku} className="bg-slate-50 p-8 rounded-[35px] border border-slate-100 relative group hover:border-blue-200 hover:bg-white transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-blue-600 border border-slate-100 group-hover:scale-110 transition-transform"><Layers size={28}/></div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded-lg italic">SKU: {item.sku}</div>
              </div>
              
              <h4 className="font-black text-slate-900 italic mb-6 text-lg">מוצר לוגיסטי {item.sku}</h4>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic tracking-widest">משקל לביצוע (ק"ג)</label>
                <div className="flex gap-3">
                  <input 
                    type="number"
                    defaultValue={item.weight_kg} 
                    onBlur={e => updateWeight(item.sku, parseFloat(e.target.value))} 
                    className="flex-1 bg-white border-2 border-slate-100 p-5 rounded-[22px] font-black text-2xl outline-none focus:border-blue-500 focus:ring-4 ring-blue-500/10 transition-all text-center" 
                  />
                  <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center font-black text-xs shadow-inner ${item.is_big_bag ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {item.is_big_bag ? 'בלה' : 'שק'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
