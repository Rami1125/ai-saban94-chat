"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Zap, Save, X, Image as ImageIcon, Video, 
  Layers, Tag, BrainCircuit, Monitor, 
  Gauge, Clock, Hammer, ShoppingCart, ChevronRight, 
  ShieldCheck, ArrowUpRight, Search, Loader2, Plus, 
  RefreshCw, Info, Maximize2, Trash2, Edit3, Sparkles, 
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

export default function ProductDNAStudio() {
  const [mounted, setMounted] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [designItem, setDesignItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('product_name', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      toast.error("שגיאה בטעינת נתונים: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // פונקציה לניקוי נתונים לפני שליחה למניעת שגיאות 400
  const sanitizePayload = (item: any) => {
    const { price, ...rest } = item; // הסרת המחיר כפי שביקשת
    return {
      ...rest,
      product_name: rest.product_name || 'מוצר חדש',
      stock_quantity: Number(rest.stock_quantity) || 0,
      category: rest.category || 'כללי',
      sku: String(rest.sku || ''),
      updated_at: new Date().toISOString()
    };
  };

  const handleSave = async () => {
    if (!designItem) return;
    
    setIsSaving(true);
    try {
      const payload = sanitizePayload(designItem);
      
      const { error } = await supabase
        .from('inventory')
        .upsert(payload, { onConflict: 'sku' });

      if (error) throw error;

      toast.success("המוצר נשמר בהצלחה בטבלת המלאי");
      fetchData();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("שגיאת שמירה: ודא שכל השדות תקינים");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.includes(searchTerm)
    );
  }, [inventory, searchTerm]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            SABAN DNA STUDIO
          </h1>
          <p className="text-slate-400 text-sm mt-1">ניהול מלאי ועיצוב מוצר V73.1</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text"
              placeholder="חיפוש מהיר..."
              className="bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2 text-sm focus:ring-2 ring-blue-500 outline-none w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setDesignItem({ sku: Date.now().toString(), product_name: '', stock_quantity: 0 })}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 transition-all font-bold"
          >
            <Plus size={18} /> מוצר חדש
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inventory List */}
        <div className="lg:col-span-4 space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            filteredInventory.map(item => (
              <motion.div 
                key={item.sku}
                layoutId={item.sku}
                onClick={() => setDesignItem(item)}
                className={`p-4 rounded-3xl cursor-pointer border transition-all ${
                  designItem?.sku === item.sku 
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-100">{item.product_name || 'ללא שם'}</h3>
                    <p className="text-xs text-slate-500 mt-1">מק"ט: {item.sku}</p>
                  </div>
                  <div className="bg-slate-800 px-2 py-1 rounded-lg text-[10px] font-bold">
                    מלאי: {item.stock_quantity}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Editor Side */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {designItem ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[40px] p-8 relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Edit3 className="text-blue-400" /> עריכת מוצר
                  </h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2 rounded-2xl flex items-center gap-2 transition-all disabled:opacity-50"
                    ) : (
                      <Save size={18} /> שמירה
                    )}
                    </button>
                    <button onClick={() => setDesignItem(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">שם המוצר</label>
                    <input 
                      className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all"
                      value={designItem.product_name}
                      onChange={(e) => setDesignItem({...designItem, product_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">מק"ט (SKU)</label>
                    <input 
                      className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all"
                      value={designItem.sku}
                      onChange={(e) => setDesignItem({...designItem, sku: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">קטגוריה</label>
                    <input 
                      className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all"
                      value={designItem.category}
                      onChange={(e) => setDesignItem({...designItem, category: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">כמות במלאי</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all"
                      value={designItem.stock_quantity}
                      onChange={(e) => setDesignItem({...designItem, stock_quantity: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[40px] text-slate-600">
                <BrainCircuit size={48} className="mb-4 opacity-20" />
                <p className="font-bold">בחר מוצר מהרשימה כדי להתחיל לעצב</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
