"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Package, ShoppingCart, Smartphone, 
  Wifi, WifiOff, RefreshCw, ChevronRight, 
  Info, Filter, LayoutGrid, List, Menu,
  X, Camera, Share2, Star, Zap, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V84.0 - PWA Mobile Suite
 * -------------------------------------------
 * - Data Source: Google Sheets (CSV Export Link)
 * - UI: Ultra-Premium Mobile Shell
 * - Features: Offline caching, SKU search, VIP styling.
 */

// החלף את הלינק הזה בלינק ה-Export CSV של הגליון שלך (File > Share > Publish to web > CSV)
const SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT.../pub?output=csv";

export default function SabanPWA() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // 1. בדיקת חיבור לרשת
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // 2. טעינת נתונים (מ-Cache מקומי או מהרשת)
    fetchData();

    // 3. רישום Service Worker ל-PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ננסה למשוך מה-Sheets, אם נכשל נחפש ב-LocalStorage
      const res = await fetch(SHEETS_CSV_URL);
      const text = await res.text();
      const parsedData = parseCSV(text);
      
      setInventory(parsedData);
      localStorage.setItem('saban_inventory_cache', JSON.stringify(parsedData));
      if (isOnline) toast.success("המלאי סונכרן מהגליון 🦾");
    } catch (e) {
      const cache = localStorage.getItem('saban_inventory_cache');
      if (cache) {
        setInventory(JSON.parse(cache));
        toast.info("עובד במצב Offline (נתונים שמורים)");
      }
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim());
      return obj;
    }).filter(i => i.sku);
  };

  const filteredItems = useMemo(() => {
    return inventory.filter(i => 
      (i.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.sku || "").toString().includes(searchTerm)
    );
  }, [inventory, searchTerm]);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-right select-none overflow-x-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      {/* --- Mobile Header --- */}
      <header className="sticky top-0 z-50 bg-[#0F172A] text-white p-6 pb-8 rounded-b-[40px] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
                <img src="/ai.png" alt="S" className="w-full h-full object-contain" />
             </div>
             <div>
                <h1 className="font-black italic tracking-tighter text-lg leading-none">SABAN OS</h1>
                <div className="flex items-center gap-1.5 mt-1">
                   {isOnline ? (
                     <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                        <Wifi size={10} /> Online Sync
                     </span>
                   ) : (
                     <span className="flex items-center gap-1 text-[8px] font-bold text-rose-400 uppercase tracking-widest">
                        <WifiOff size={10} /> Offline Mode
                     </span>
                   )}
                </div>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="p-3 bg-white/5 rounded-xl">
                {viewMode === 'grid' ? <List size={20}/> : <LayoutGrid size={20}/>}
             </button>
             <button onClick={fetchData} className="p-3 bg-white/5 rounded-xl active:rotate-180 transition-transform duration-500">
                <RefreshCw size={20} />
             </button>
          </div>
        </div>

        <div className="relative group">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
           <input 
             placeholder="חפש מוצר או מק''ט..." 
             value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-white/10 border border-white/10 pr-14 pl-6 py-4 rounded-2xl font-bold outline-none focus:bg-white/20 transition-all text-white placeholder:text-slate-500 shadow-inner" 
           />
        </div>
      </header>

      {/* --- Main Catalog --- */}
      <main className="p-6 pb-32">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
             {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-[35px]" />)}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "space-y-4"}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div 
                  key={item.sku} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelectedProduct(item)}
                  className={`bg-white rounded-[35px] border border-slate-100 shadow-sm overflow-hidden active:scale-95 transition-all ${viewMode === 'list' ? 'flex items-center p-4 gap-4' : ''}`}
                >
                   <div className={viewMode === 'grid' ? "aspect-square relative overflow-hidden bg-slate-50" : "w-20 h-20 shrink-0 relative rounded-2xl overflow-hidden bg-slate-50"}>
                      <ProductImage src={item.image_url} />
                      {item.price > 0 && (
                        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-lg">
                           ₪{item.price}
                        </div>
                      )}
                   </div>
                   <div className={viewMode === 'grid' ? "p-4 text-right" : "flex-1 text-right"}>
                      <p className="font-black text-slate-800 text-sm leading-tight line-clamp-2 italic">{item.product_name}</p>
                      <p className="text-[9px] font-bold text-blue-500 uppercase mt-1 tracking-widest">SKU {item.sku}</p>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* --- Product Detail Sheet --- */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-end"
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[50px] max-h-[92vh] overflow-y-auto scrollbar-hide shadow-2xl pb-10"
            >
              <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto my-6" />
              
              <div className="p-8 space-y-8">
                 <div className="relative aspect-square w-full rounded-[40px] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group">
                    <ProductImage src={selectedProduct.image_url} />
                    <button onClick={() => setSelectedProduct(null)} className="absolute top-6 left-6 p-4 bg-slate-900/10 backdrop-blur-xl rounded-2xl text-slate-900"><X size={24}/></button>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <span className="bg-blue-600/10 text-blue-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/10 italic">Premium Grade</span>
                       <ShieldCheck className="text-emerald-500" size={20} />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{selectedProduct.product_name}</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em]">Identification: {selectedProduct.sku}</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <DetailPill label="Price" value={`₪${selectedProduct.price}`} icon={<Zap size={14}/>} color="text-blue-600" />
                    <DetailPill label="Category" value={selectedProduct.category || "General"} icon={<Package size={14}/>} />
                 </div>

                 <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Technical DNA Description</h4>
                    <p className="text-slate-600 font-bold leading-relaxed italic text-lg">
                       {selectedProduct.description || "אין תיאור מורחב למוצר זה במערכת."}
                    </p>
                 </div>

                 <div className="flex gap-4">
                    <button className="flex-1 bg-[#25D366] text-white py-6 rounded-[30px] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 italic">
                       <Share2 size={24} /> שתף מוצר
                    </button>
                    <button className="w-20 h-20 bg-slate-900 text-white rounded-[30px] flex items-center justify-center shadow-xl active:scale-95">
                       <Star size={28} />
                    </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Navigation Bar --- */}
      <nav className="fixed bottom-6 left-6 right-6 z-40 bg-white/80 backdrop-blur-2xl border-2 border-white/50 p-4 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] flex justify-between items-center ring-8 ring-slate-50/50">
         <NavBtn icon={<LayoutGrid size={24}/>} active />
         <NavBtn icon={<Camera size={24}/>} />
         <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center text-white shadow-2xl -translate-y-6 border-[6px] border-[#F8FAFC] active:scale-90 transition-all">
            <Plus size={32} />
         </div>
         <NavBtn icon={<ShoppingCart size={24}/>} />
         <NavBtn icon={<Info size={24}/>} />
      </nav>

      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

// --- Internal Components ---

function ProductImage({ src }: { src: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48} strokeWidth={1}/></div>;
  return <img src={src} className="w-full h-full object-cover" alt="Product" onError={() => setErr(true)} />;
}

function DetailPill({ label, value, icon, color }: any) {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-[30px] shadow-sm flex flex-col items-center text-center">
       <div className={`${color || 'text-slate-400'} mb-2`}>{icon}</div>
       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-sm font-black text-slate-900 italic tracking-tight">{value}</p>
    </div>
  );
}

function NavBtn({ icon, active }: any) {
  return (
    <button className={`p-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg scale-110' : 'text-slate-400 hover:bg-slate-50'}`}>
       {icon}
    </button>
  );
}
