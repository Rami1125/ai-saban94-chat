"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Scale, Package, Search, RefreshCw, Layers, Truck, 
  AlertTriangle, CheckCircle2, Loader2, History, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Inventory & Weights Control V27.0
 * --------------------------------------------------
 * - Verified columns: sku, weight_kg, is_big_bag.
 * - Live Realtime: Listening to 'product_weights' table changes.
 * - Fix: Robust filtering and empty state handling.
 */

export default function InventoryWeights() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingSku, setUpdatingSku] = useState<string | null>(null);

  // 1. שליפת נתונים ראשונית
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
      toast.error("שגיאה בסנכרון נתונים");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. חיבור Realtime חי (על בסיס האישור ששלחת)
  useEffect(() => {
    fetchWeights();

    const channel = supabase.channel('weights_live_sync')
      .on('postgres_changes', { 
        event: '*', 
        table: 'product_weights' 
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item => item.sku === payload.new.sku ? payload.new : item));
          toast.info(`מק"ט ${payload.new.sku} עודכן מהשטח ⚖️`);
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
          fetchWeights();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 3. עדכון משקל מהממשק
  const updateWeight = async (sku: string, weight: number) => {
    setUpdatingSku(sku);
    try {
      const { error } = await supabase
        .from('product_weights')
        .update({ weight_kg: weight })
        .eq('sku', sku);

      if (error) throw error;
      toast.success(`המשקל עודכן ב-DNA`);
    } catch (err) {
      toast.error("עדכון נכשל");
    } finally {
      setUpdatingSku(null);
    }
  };

  const filteredItems = items.filter(i => 
    (i.sku || "").toString().toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-7xl mx-auto font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Banner */}
      <div className="bg-slate-900 rounded-[45px] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center shadow-xl text-blue-600 border-4 border-blue-50">
                <Truck size={40} />
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">בקרת משקלים (חוק 12 טון)</h2>
                <p className="text-blue-300/80 text-sm font-bold">סנכרון Realtime פעיל מול ה-Database 🦾</p>
              </div>
           </div>
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[25px] flex items-center gap-4 backdrop-blur-md">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              <p className="text-emerald-400 font-black text-sm uppercase tracking-widest leading-none">Sync: Verified</p>
           </div>
        </div>
      </div>

      {/* Interface */}
      <div className="bg-white rounded-[50px] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <div className="relative w-full md:w-96 group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input 
                placeholder="חפש מק''ט..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 pr-14 pl-6 py-4 rounded-2xl font-bold shadow-sm outline-none focus:ring-8 ring-blue-500/5 transition-all italic" 
              />
           </div>
           <button onClick={fetchWeights} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
           </button>
        </div>

        <div className="p-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[40px]" />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-32 text-center space-y-4">
               <Package size={64} className="mx-auto text-slate-200" />
               <p className="text-slate-400 font-black italic uppercase tracking-widest text-sm">אין מק"טים להצגה - בדוק טבלת product_weights</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, i) => (
                  <motion.div 
                    layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                    key={item.sku} className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 relative group hover:border-blue-300 hover:bg-white transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-blue-600 border border-slate-100 group-hover:scale-110 transition-transform">
                        <Layers size={28}/>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic border border-slate-200 px-2 py-1 rounded-lg">SKU ID</span>
                         <p className="font-black text-slate-900 text-lg mt-1">{item.sku}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 mr-2 italic tracking-widest text-right block">משקל לוגיסטי (ק"ג)</label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input 
                            type="number"
                            defaultValue={item.weight_kg} 
                            onBlur={(e) => updateWeight(item.sku, parseFloat(e.target.value))}
                            className="w-full bg-white border-2 border-slate-100 p-5 rounded-[22px] font-black text-2xl outline-none focus:border-blue-500 focus:ring-8 ring-blue-500/5 transition-all text-center" 
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-200 italic text-sm">KG</span>
                        </div>
                        <div className={`w-18 h-18 rounded-[22px] flex flex-col items-center justify-center font-black text-[9px] uppercase shadow-inner border transition-colors ${item.is_big_bag ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-200 text-slate-500'}`}>
                           {item.is_big_bag ? 'בלה' : 'שק'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                       <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 italic"><History size={12}/> Live Pulse Active</p>
                       {updatingSku === item.sku && <Loader2 className="animate-spin text-blue-500" size={18} />}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <footer className="py-12 border-t border-slate-200 opacity-20 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.6em] italic">Saban Payload Monitoring Engine V27.0</p>
      </footer>
    </motion.div>
  );
}
