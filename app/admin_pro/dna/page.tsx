"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Package, ShoppingCart, Smartphone, 
  Wifi, WifiOff, RefreshCw, ChevronRight, 
  Info, Filter, LayoutGrid, List, Menu,
  X, Camera, Share2, Star, Zap, ShieldCheck,
  Plus, Phone, Loader2, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V86.0 - PWA Mobile Suite (Note 25 Pro Edition)
 * ------------------------------------------------------
 * - API Source: Google Apps Script (Provided Link)
 * - UI Concept: Stitched Glassmorphism (Slate-950)
 * - Hardware Mockup: Infinity Display / Punch-hole
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxb__a0moggMuPt1hUFGJGNwcCN9PMtnNhBq702QuF0qBIV5enXHHf85zFsPAfueRo9/exec";

export default function App() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lastSync, setLastSync] = useState("");

  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    loadFromCache();
    fetchData();

    // רישום PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);

  const loadFromCache = () => {
    const cache = localStorage.getItem('saban_pwa_v86_cache');
    if (cache) {
      setInventory(JSON.parse(cache));
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!navigator.onLine) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const finalData = Array.isArray(data) ? data : (data.data || []);
      
      setInventory(finalData);
      localStorage.setItem('saban_pwa_v86_cache', JSON.stringify(finalData));
      setLastSync(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }));
      toast.success("המלאי סונכרן ל-100% 🦾");
    } catch (e) {
      toast.error("תקלה בעדכון חי - מציג נתונים שמורים");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return inventory.filter(i => 
      (i.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.sku || "").toString().includes(searchTerm) ||
      (i.keywords || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-right select-none overflow-x-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      {/* --- Mobile Header --- */}
      <header className="sticky top-0 z-50 bg-[#0F172A] text-white p-6 pb-10 rounded-b-[50px] shadow-2xl border-b border-white/5">
        <div className="flex justify-between items-center mb-8 pt-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl ring-4 ring-blue-500/10 overflow-hidden">
                <img src="/ai.png" alt="S" className="w-full h-full object-contain" />
             </div>
             <div>
                <h1 className="font-black italic tracking-tighter text-xl leading-none">SABAN OS</h1>
                <div className="flex items-center gap-2 mt-1.5">
                   {isOnline ? (
                     <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Global Live API
                     </span>
                   ) : (
                     <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-400 uppercase tracking-widest">
                        <WifiOff size={10} /> Offline Mode
                     </span>
                   )}
                </div>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="p-3.5 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
                {viewMode === 'grid' ? <List size={22}/> : <LayoutGrid size={22}/>}
             </button>
             <button onClick={fetchData} className="p-3.5 bg-white/5 rounded-2xl border border-white/10 active:rotate-180 transition-transform duration-700">
                <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>

        <div className="relative group">
           <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
           <input 
             placeholder="חפש מוצר, מק''ט או יישום..." 
             value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-white/10 border border-white/10 pr-14 pl-6 py-5 rounded-2xl font-bold outline-none focus:bg-white/20 transition-all text-white placeholder:text-slate-500 shadow-inner text-lg" 
           />
        </div>
      </header>

      {/* --- Main Grid --- */}
      <main className="p-6 pb-40">
        {loading && inventory.length === 0 ? (
          <div className="grid grid-cols-2 gap-5">
             {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-[40px] border border-slate-100" />)}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-5" : "space-y-5"}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div 
                  key={item.sku} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelectedProduct(item)}
                  className={`bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden active:scale-95 transition-all flex flex-col ${viewMode === 'list' ? 'flex-row p-5 gap-6' : ''}`}
                >
                   <div className={viewMode === 'grid' ? "aspect-square relative overflow-hidden bg-slate-50" : "w-24 h-24 shrink-0 relative rounded-3xl overflow-hidden bg-slate-50 shadow-inner"}>
                      <ProductSafeImage src={item.image_url} />
                      {item.price > 0 && (
                        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-2xl">
                           ₪{item.price}
                        </div>
                      )}
                   </div>
                   <div className={viewMode === 'grid' ? "p-5 text-right flex-1" : "flex-1 text-right"}>
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1 block">{item.category || 'Elite Asset'}</span>
                      <p className="font-black text-slate-800 text-sm leading-tight line-clamp-2 italic">{item.product_name}</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase mt-2">SKU {item.sku}</p>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* --- Detail Sheet --- */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-end"
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[60px] max-h-[95vh] overflow-y-auto scrollbar-hide shadow-2xl pb-12"
            >
              <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto my-8 shadow-inner" />
              
              <div className="p-8 md:p-12 space-y-10">
                 <div className="relative aspect-square w-full rounded-[50px] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group">
                    <ProductSafeImage src={selectedProduct.image_url} />
                    <button onClick={() => setSelectedProduct(null)} className="absolute top-8 left-8 p-5 bg-white/90 backdrop-blur-2xl rounded-[24px] text-slate-900 shadow-xl active:scale-90 transition-all"><X size={28}/></button>
                 </div>

                 <div className="space-y-6 text-right">
                    <div className="flex items-center gap-4 justify-end">
                       <span className="bg-blue-600/10 text-blue-600 px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-blue-500/10 italic">Elite DNA Verified</span>
                       <ShieldCheck className="text-emerald-500" size={24} />
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-[0.9] uppercase">{selectedProduct.product_name}</h2>
                    <div className="flex items-center gap-4 justify-end opacity-50 font-bold text-xs uppercase tracking-widest">
                       <span>SKU: {selectedProduct.sku}</span>
                       <span className="h-4 w-[1px] bg-slate-200" />
                       <span>{selectedProduct.category || "General"}</span>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-10 rounded-[50px] border border-slate-100 space-y-6">
                    <div className="flex items-center gap-3 text-blue-500 justify-end">
                       <span className="text-[11px] font-black uppercase tracking-widest italic">Professional Advisor</span>
                       <Zap size={18} className="animate-pulse" />
                    </div>
                    <p className="text-slate-600 font-bold leading-relaxed italic text-xl text-right">
                       {selectedProduct.description || "המוצר מוכן לביצוע. מפרט טכני מלא זמין במערכת Saban OS."}
                    </p>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => shareToWhatsApp(selectedProduct)} className="flex-1 bg-[#25D366] text-white py-7 rounded-[35px] font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 text-xl italic border-b-8 border-green-700">
                       <Share2 size={28} /> שתף לביצוע
                    </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Stitched Nav --- */}
      <nav className="fixed bottom-8 left-8 right-8 z-40 bg-white/80 backdrop-blur-3xl border-2 border-white p-5 rounded-[45px] shadow-2xl flex justify-between items-center ring-[12px] ring-slate-100/50">
         <NavBtn icon={<LayoutGrid size={28}/>} active />
         <div className="w-20 h-20 bg-[#0F172A] rounded-full flex items-center justify-center text-white shadow-xl -translate-y-10 border-[8px] border-[#F8FAFC] active:scale-90 transition-all">
            <Plus size={40} />
         </div>
         <NavBtn icon={<ShoppingCart size={28}/>} />
      </nav>

      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

function ProductSafeImage({ src }: { src: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 bg-white/50 shadow-inner">
       <Package size={48} strokeWidth={1} className="opacity-20" />
    </div>
  );
  return <img src={src} className="w-full h-full object-cover transition-all duration-700" alt="Product" onError={() => setErr(true)} />;
}

function NavBtn({ icon, active }: any) {
  return (
    <button className={`p-4 rounded-[22px] transition-all ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
       {icon}
    </button>
  );
}

const shareToWhatsApp = (p: any) => {
  const text = encodeURIComponent(`🏗️ *מוצר מבית ח. סבן*\n\n📦 *${p.product_name}*\n🔍 מק"ט: ${p.sku}\n💰 מחיר: ₪${p.price}\n\n*נשלח מ-Saban OS Mobile* 🦾`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
};
