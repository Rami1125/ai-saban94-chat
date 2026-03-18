"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { supabase } from "@/lib/supabase"; 
import { 
  Send, Zap, ShoppingCart, Loader2, User, ShieldCheck, 
  Image as ImageIcon, X, Clock, Hammer, Calculator,
  Smartphone, Trash2, CheckCircle2,
  Plus, Minus, ShoppingBag, Award, Activity, Bug
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

/**
 * Saban OS V52.0 - Unified VIP Chat (Reinforced UI & Diagnostics)
 * --------------------------------------------------------
 * - Fix: High Z-index for Quantity Button.
 * - UX: Scaled down text sizes for mobile efficiency.
 * - Tool: Bottom Diagnostic Bar (The "Malshinon").
 * - Interaction: Optimized for Touch & Mouse.
 */

const LOGO_PATH = "/ai.png";
const appId = "saban-os-v1";

const initFirebase = () => {
  if (typeof window === 'undefined') return null;
  const configRaw = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!configRaw) return null;
  try {
    const config = JSON.parse(configRaw);
    const app = !getApps().length ? initializeApp(config) : getApp();
    return { db: getFirestore(app), auth: getAuth(app) };
  } catch (e) { return null; }
};

const fb = initFirebase();

export default function UnifiedVipChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // States
  const [cartCount, setCartCount] = useState(0);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [productToOrder, setProductToOrder] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [lastAction, setLastAction] = useState("System Ready");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    async function init() {
      const { data } = await supabase.from('vip_profiles').select('*').eq('id', id).maybeSingle();
      setClient(data);
      if (fb) {
        await signInAnonymously(fb.auth);
        onSnapshot(collection(fb.db, 'artifacts', appId, 'users', id, 'cart'), (s) => {
          setCartCount(s.size);
          setLastAction(`Cart Synced: ${s.size} items`);
        });
      }
      setMessages([{ role: 'assistant', content: `### חדר מצב Saban OS פעיל 🦾\nשלום ${data?.nickname || 'אחי'}, המוח מוכן להזרים פקודות לביצוע ב**${data?.main_project || 'שטח'}**.` }]);
    }
    init();
  }, [id, mounted]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const triggerOrder = async (sku: string) => {
    setLoading(true);
    setLastAction(`Fetching SKU: ${sku}`);
    const { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    setLoading(false);
    if (p) {
      setProductToOrder(p);
      setQty(1);
      setIsQtyModalOpen(true);
      setLastAction(`Modal Open: ${p.product_name}`);
    } else {
      toast.error("מוצר לא אותר");
    }
  };

  const finalizeAddToStore = async () => {
    if (!fb || !id || !productToOrder) return;
    setLastAction("Injecting to Cloud...");
    const toastId = toast.loading(`מעדכן סל...`);
    try {
      const ref = doc(fb.db, 'artifacts', appId, 'users', id, 'cart', productToOrder.sku);
      await setDoc(ref, {
        sku: productToOrder.sku,
        product_name: productToOrder.product_name,
        price: productToOrder.price || 0,
        qty: qty,
        image_url: productToOrder.image_url,
        added_at: new Date().toISOString()
      });
      setIsQtyModalOpen(false);
      setLastAction("Success: Item Injected");
      toast.success(`${productToOrder.product_name} בסל! 🦾`, { id: toastId });
    } catch (e) { 
      setLastAction("Error: Injection Failed");
      toast.error("תקלה בסנכרון", { id: toastId }); 
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    setLastAction("AI Thinking...");
    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, query: q, history: messages.slice(-5), customerId: id })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      setLastAction("Response Received");
    } catch (e) { setLastAction("Brain Interrupted"); } finally { setLoading(false); }
  };

  if (!mounted) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden touch-manipulation" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* --- Quantity Selection Modal --- */}
      <AnimatePresence>
        {isQtyModalOpen && productToOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[45px] w-full max-w-sm overflow-hidden shadow-2xl border border-white/10">
               <div className="bg-[#020617] p-8 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="text-right z-10">
                     <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">כמות לביצוע</h3>
                     <p className="text-blue-400 text-[8px] font-bold uppercase mt-1 tracking-widest flex items-center gap-1 justify-end"><Award size={10}/> SABAN LOGISTICS</p>
                  </div>
                  <button onClick={() => setIsQtyModalOpen(false)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-white"><X size={20}/></button>
               </div>
               
               <div className="p-8 space-y-8 text-center">
                  <div className="flex items-center gap-4 justify-center">
                     <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-lg">
                        <SafeImage src={productToOrder.image_url} isThumb />
                     </div>
                     <div className="text-right">
                        <h4 className="text-lg font-black text-slate-900 leading-tight">{productToOrder.product_name}</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">SKU: {productToOrder.sku}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 py-6 bg-slate-50 rounded-[30px] shadow-inner">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-md border border-slate-200 active:scale-90 transition-all"><Minus size={20}/></button>
                     <span className="text-5xl font-black italic text-slate-900 tracking-tighter w-20">{qty}</span>
                     <button onClick={() => setQty(qty + 1)} className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md active:scale-90 transition-all"><Plus size={20}/></button>
                  </div>

                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); finalizeAddToStore(); }}
                    className="w-full bg-blue-600 text-white py-6 rounded-[35px] font-black text-lg uppercase italic tracking-widest shadow-xl flex items-center justify-center gap-4 border-b-8 border-blue-800 active:translate-y-1 transition-all cursor-pointer z-[1100]"
                  >
                    אשר ושגר לסל 🦾
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative bg-white max-w-2xl mx-auto shadow-2xl border-x border-slate-100">
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-6 bg-white/95 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#020617] rounded-2xl flex items-center justify-center text-blue-500 shadow-lg border-2 border-white ring-4 ring-slate-50"><Zap size={20} fill="currentColor" /></div>
              <div className="text-right">
                 <h2 className="text-sm font-black italic uppercase leading-none">{client?.full_name || 'VIP Client'}</h2>
                 <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-1 flex items-center gap-1 italic"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Saban Online</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.location.href='/cart'} className={`relative p-3 rounded-2xl transition-all shadow-md flex items-center gap-2 ${cartCount > 0 ? 'bg-blue-600 text-white animate-bounce' : 'bg-slate-50 text-slate-400'}`}>
                 <ShoppingBag size={18} />
                 {cartCount > 0 && <span className="font-black text-xs italic">{cartCount}</span>}
              </motion.button>
              <img src={LOGO_PATH} alt="S" className="h-7 object-contain" />
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 pb-40 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[92%] p-6 md:p-8 rounded-[40px] shadow-sm border ${m.role === 'user' ? 'bg-white border-slate-200 text-slate-900 rounded-tl-none' : 'bg-[#020617] text-white border-white/5 rounded-tr-none'}`}>
                  <div className={`flex items-center gap-2 mb-6 opacity-30 ${m.role === 'user' ? 'text-slate-500' : 'text-blue-300'}`}>
                     <span className="text-[8px] font-black uppercase tracking-widest italic">{m.role === 'user' ? 'VIP REQUEST' : 'OS INTELLIGENCE'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={triggerOrder} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end pr-4"><div className="bg-[#020617] px-6 py-4 rounded-3xl flex items-center gap-4 border border-white/5 animate-pulse"><Loader2 className="animate-spin text-blue-500" size={16} /><span className="text-[9px] font-black text-blue-400 uppercase italic tracking-widest">DNA...</span></div></div>}
          <div ref={scrollRef} />
        </div>

        {/* --- Diagnostic Bar (The "Malshinon") --- */}
        <div className="absolute bottom-28 left-6 right-6 z-10 flex justify-center">
           <div className="bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl scale-[0.8] opacity-50 hover:opacity-100 transition-all">
              <Bug size={10} className="text-rose-400" />
              <p className="text-[8px] font-mono text-blue-400 uppercase tracking-tighter leading-none">{lastAction}</p>
              <Activity size={10} className="text-emerald-400 animate-pulse" />
           </div>
        </div>

        <footer className="p-4 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-10">
          <div className="max-w-xl mx-auto bg-white border border-slate-100 p-2 rounded-[45px] shadow-xl flex items-center gap-3 ring-8 ring-slate-50/50 backdrop-blur-3xl focus-within:ring-blue-50 transition-all">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="פקודה לביצוע..." 
              className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-lg text-right text-slate-900 placeholder:text-slate-300" 
            />
            <button onClick={handleSend} className="w-14 h-14 bg-[#020617] rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-lg"><Send size={24} /></button>
          </div>
        </footer>
      </main>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

function SmartMessageRenderer({ text, onAdd }: any) {
  if (!text) return null;
  const galleryMatch = text.match(/\[GALLERY:\s*([^\]]+)\]/i);
  const urls = galleryMatch ? galleryMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 5) : [];
  const skuMatch = text.match(/\[QUICK_ADD:\s*([^\]]+)\]/i);
  const sku = skuMatch ? skuMatch[1] : null;

  const cleanText = text.replace(/\[GALLERY:[\s\S]*?\]/gi, '').replace(/\[QUICK_ADD:[\s\S]*?\]/gi, '').trim();
  const lines = cleanText.split('\n');

  return (
    <div className="space-y-4">
      {urls.length > 0 && (
        <div className="my-4 grid grid-cols-12 gap-2 h-40">
           <div className="col-span-8 bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-lg"><SafeImage src={urls[0]} /></div>
           <div className="col-span-4 flex flex-col gap-2">
              {urls.slice(1, 3).map((url, i) => (<div key={i} className="flex-1 bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-sm"><SafeImage src={url} isThumb /></div>))}
           </div>
        </div>
      )}
      <div className="space-y-4 text-right" dir="rtl">
        {lines.map((line, i) => {
          if (!line.trim()) return null;
          if (line.startsWith('###')) return <h3 key={i} className="text-xl font-black text-white italic border-r-4 border-blue-600 pr-3 my-6 uppercase tracking-tight">{line.replace('###', '')}</h3>;
          return <p key={i} className="text-base md:text-lg leading-relaxed font-bold text-white/90">{line}</p>;
        })}
      </div>
      {sku && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onAdd(sku)}
          className="w-full mt-6 bg-white text-slate-950 py-5 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 border-b-4 border-slate-200 active:scale-95 italic cursor-pointer z-20"
        >
          הוסף להזמנה <ShoppingCart size={20} className="text-blue-600" />
        </motion.button>
      )}
    </div>
  );
}

function SafeImage({ src, isThumb = false }: { src: string, isThumb?: boolean }) {
  const [error, setError] = useState(false);
  if (!src || error) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-700">
      <ImageIcon size={isThumb ? 16 : 32} />
    </div>
  );
  return <img src={src} className="w-full h-full object-cover transition-opacity duration-500" alt="Asset" onError={() => setError(true)} />;
}
