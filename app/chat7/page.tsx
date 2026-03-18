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
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

/**
 * Saban OS V53.0 - Unified VIP Chat (Stability & Mobile-First Edition)
 * --------------------------------------------------------
 * - Fix: Explicit cleanup for Firebase listeners to prevent channel errors.
 * - Fix: High Z-index (2000) for confirm button.
 * - Style: Compact UI for mobile (Text-sm/base).
 * - Tool: Bottom Diagnostic Bar.
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
    
    let unsubscribeCart: () => void;

    async function init() {
      try {
        const { data } = await supabase.from('vip_profiles').select('*').eq('id', id).maybeSingle();
        setClient(data);
        
        if (fb) {
          await signInAnonymously(fb.auth);
          setLastAction("Auth Success");
          
          // מאזין לסל עם פונקציית ניקוי
          unsubscribeCart = onSnapshot(collection(fb.db, 'artifacts', appId, 'users', id, 'cart'), (s) => {
            setCartCount(s.size);
            setLastAction(`Cart: ${s.size} items`);
          }, (err) => {
            setLastAction("Cart Sync Error");
          });
        }
      } catch (err) {
        setLastAction("Init Failed");
      }

      setMessages([{ 
        role: 'assistant', 
        content: `### חדר מצב Saban OS פעיל 🦾\nשלום ${client?.nickname || 'אחי'}, המוח מוכן להזרים פקודות לביצוע ב**${client?.main_project || 'שטח'}**.` 
      }]);
    }
    
    init();

    return () => {
      if (unsubscribeCart) unsubscribeCart();
    };
  }, [id, mounted]);

  useEffect(() => { 
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [messages, loading]);

  const triggerOrder = async (sku: string) => {
    setLoading(true);
    setLastAction(`Fetching SKU: ${sku}`);
    try {
        const { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
        if (p) {
          setProductToOrder(p);
          setQty(1);
          setIsQtyModalOpen(true);
          setLastAction(`Order: ${p.product_name}`);
        } else {
          toast.error("מוצר לא אותר");
        }
    } catch (e) {
        setLastAction("SKU Fetch Failed");
    } finally {
        setLoading(false);
    }
  };

  const finalizeAddToStore = async () => {
    if (!fb || !id || !productToOrder) return;
    setLastAction("Injecting...");
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
      setLastAction("Sync Success");
      toast.success(`${productToOrder.product_name} בסל! 🦾`, { id: toastId });
    } catch (e) { 
      setLastAction("Injection Error");
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
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        setLastAction("Ready");
      }
    } catch (e) { 
        setLastAction("Brain Link Broken");
        toast.error("נתק זמני ב-DNA");
    } finally { 
        setLoading(false); 
    }
  };

  if (!mounted) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden touch-manipulation" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* --- Quantity Selection Modal --- */}
      <AnimatePresence>
        {isQtyModalOpen && productToOrder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl border border-white/10">
               <div className="bg-[#020617] p-6 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="text-right z-10">
                     <h3 className="text-lg font-black italic uppercase tracking-tighter leading-none">כמות לביצוע</h3>
                     <p className="text-blue-400 text-[8px] font-bold uppercase mt-1 tracking-widest flex items-center gap-1 justify-end">
                        <Award size={10}/> SABAN LOGISTICS
                     </p>
                  </div>
                  <button onClick={() => setIsQtyModalOpen(false)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-white"><X size={20}/></button>
               </div>
               
               <div className="p-6 space-y-6 text-center">
                  <div className="flex items-center gap-4 justify-center">
                     <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shadow-md">
                        <SafeImage src={productToOrder.image_url} isThumb />
                     </div>
                     <div className="text-right">
                        <h4 className="text-base font-black text-slate-900 leading-tight">{productToOrder.product_name}</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">SKU: {productToOrder.sku}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 py-4 bg-slate-50 rounded-3xl shadow-inner">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-md border border-slate-200 active:scale-90 transition-all"><Minus size={18}/></button>
                     <span className="text-4xl font-black italic text-slate-900 tracking-tighter w-16">{qty}</span>
                     <button onClick={() => setQty(qty + 1)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md active:scale-90 transition-all"><Plus size={18}/></button>
                  </div>

                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); finalizeAddToStore(); }}
                    className="w-full bg-blue-600 text-white py-5 rounded-[28px] font-black text-base uppercase italic tracking-widest shadow-xl flex items-center justify-center gap-4 border-b-8 border-blue-800 active:translate-y-1 transition-all cursor-pointer relative z-[2100]"
                  >
                    אשר ושגר לסל 🦾
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative bg-white max-w-2xl mx-auto shadow-2xl border-x border-slate-100">
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-5 bg-white/95 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#020617] rounded-2xl flex items-center justify-center text-blue-500 shadow-lg border-2 border-white ring-4 ring-slate-50"><Zap size={18} fill="currentColor" /></div>
              <div className="text-right">
                 <h2 className="text-xs font-black italic uppercase leading-none truncate max-w-[120px]">{client?.full_name || 'VIP Portal'}</h2>
                 <p className="text-[7px] text-emerald-500 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1 italic">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Saban OS
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.location.href='/cart'} className={`relative p-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 ${cartCount > 0 ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                 <ShoppingBag size={16} />
                 {cartCount > 0 && <span className="font-black text-[10px] italic">{cartCount}</span>}
              </motion.button>
              <img src={LOGO_PATH} alt="S" className="h-6 object-contain" />
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-40 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence mode="popLayout">
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[90%] p-5 md:p-7 rounded-[35px] shadow-sm border ${m.role === 'user' ? 'bg-white border-slate-200 text-slate-900 rounded-tl-none' : 'bg-[#020617] text-white border-white/5 rounded-tr-none'}`}>
                  <div className={`flex items-center gap-2 mb-4 opacity-30 ${m.role === 'user' ? 'text-slate-500' : 'text-blue-300'}`}>
                     <span className="text-[7px] font-black uppercase tracking-widest italic">{m.role === 'user' ? 'VIP CLIENT' : 'LOGISTICS BRAIN'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={triggerOrder} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end pr-4"><div className="bg-slate-900 px-5 py-3 rounded-2xl flex items-center gap-3 animate-pulse shadow-xl"><Loader2 className="animate-spin text-blue-500" size={14} /><span className="text-[8px] font-black text-blue-400 uppercase italic tracking-widest">DNA...</span></div></div>}
          <div ref={scrollRef} className="h-10" />
        </div>

        {/* --- Bottom Diagnostic (Malshinon) --- */}
        <div className="absolute bottom-24 left-0 right-0 z-10 flex justify-center pointer-events-none">
           <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl scale-[0.75] opacity-40">
              <Bug size={8} className="text-rose-400" />
              <p className="text-[7px] font-mono text-blue-300 uppercase tracking-tighter">{lastAction}</p>
              <Activity size={8} className="text-emerald-400" />
           </div>
        </div>

        <footer className="p-4 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-10">
          <div className="max-w-xl mx-auto bg-white border border-slate-100 p-1.5 rounded-[40px] shadow-2xl flex items-center gap-2 ring-6 ring-slate-50/50 focus-within:ring-blue-50 transition-all">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="פקודה לביצוע..." 
              className="flex-1 bg-transparent px-5 py-3 outline-none font-bold text-base text-right text-slate-900 placeholder:text-slate-200" 
            />
            <button onClick={handleSend} className="w-12 h-12 bg-[#020617] rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-lg hover:bg-blue-600"><Send size={20} /></button>
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
        <div className="my-3 grid grid-cols-12 gap-2 h-36">
           <div className="col-span-8 bg-slate-900 rounded-2xl overflow-hidden border border-white/5 shadow-md relative">
              <SafeImage src={urls[0]} />
           </div>
           <div className="col-span-4 flex flex-col gap-2">
              {urls.slice(1, 3).map((url, i) => (<div key={i} className="flex-1 bg-slate-900 rounded-xl overflow-hidden border border-white/5 shadow-sm"><SafeImage src={url} isThumb /></div>))}
           </div>
        </div>
      )}
      <div className="space-y-3 text-right" dir="rtl">
        {lines.map((line, i) => {
          if (!line.trim()) return null;
          if (line.startsWith('###')) return <h3 key={i} className="text-base font-black text-white italic border-r-4 border-blue-600 pr-3 my-4 uppercase tracking-tight">{line.replace('###', '')}</h3>;
          return <p key={i} className="text-sm md:text-base leading-relaxed font-bold text-white/90">{line}</p>;
        })}
      </div>
      {sku && (
        <motion.button 
          whileTap={{ scale: 0.97 }} 
          onClick={(e) => { e.preventDefault(); onAdd(sku); }}
          className="w-full mt-4 bg-white text-slate-950 py-4 rounded-[25px] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border-b-4 border-slate-200 cursor-pointer relative z-20"
        >
          הוסף להזמנה <ShoppingCart size={16} className="text-blue-600" />
        </motion.button>
      )}
    </div>
  );
}

function SafeImage({ src, isThumb = false }: { src: string, isThumb?: boolean }) {
  const [error, setError] = useState(false);
  if (!src || error) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-700">
      <ImageIcon size={isThumb ? 14 : 28} />
    </div>
  );
  return <img src={src} className="w-full h-full object-cover transition-opacity duration-500" alt="Asset" onError={() => setError(true)} />;
}
