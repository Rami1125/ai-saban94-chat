"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { supabase } from "@/lib/supabase"; 
import { 
  Send, Zap, ShoppingCart, Loader2, User, ShieldCheck, 
  Image as ImageIcon, X, PlayCircle, Clock, Hammer, Calculator,
  ArrowRight, Sparkles, Smartphone, Trash2, CheckCircle2,
  AlertTriangle, Layout, ListChecks, ChevronDown, PackageSearch,
  Plus, Minus, ShoppingBag, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

/**
 * Saban OS V50.0 - Unified VIP Chat (The Living Cart)
 * --------------------------------------------------------
 * - Feature: Quantity Selection Modal (Elite UI).
 * - Feedback: Animated Cart Badge & Persistent Cloud Sync.
 * - Architecture: Direct Firebase injection per SKU.
 */

const LOGO_PATH = "/ai.png";
const appId = "saban-os-v1";

// --- Firebase Initialization ---
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
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Cart State
  const [cartCount, setCartCount] = useState(0);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [productToOrder, setProductToOrder] = useState<any>(null);
  const [qty, setQty] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('vip_profiles').select('*').eq('id', id).maybeSingle();
      setClient(data);

      if (fb) {
        await signInAnonymously(fb.auth);
        // המאזין לסל "מעיר" את הממשק
        onSnapshot(collection(fb.db, 'artifacts', appId, 'users', id, 'cart'), (s) => {
          setCartCount(s.size);
        });
      }
      
      setMessages([{ 
        role: 'assistant', 
        content: `### חדר מצב Saban OS פעיל 🦾\nשלום ${data?.nickname || 'אחי'}, המוח מוכן להזרים פקודות לביצוע ב**${data?.main_project || 'שטח'}**. מה נבנה היום?` 
      }]);
    }
    init();
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // פתיחת מודאל כמות
  const triggerOrder = async (sku: string) => {
    setLoading(true);
    const { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    setLoading(false);
    
    if (p) {
      setProductToOrder(p);
      setQty(1);
      setIsQtyModalOpen(true);
    } else {
      toast.error("מוצר לא אותר במלאי המערכת");
    }
  };

  // הזרקה לסל (Cloud Sync)
  const finalizeAddToStore = async () => {
    if (!fb || !id || !productToOrder) return;
    const toastId = toast.loading(`מעדכן סל לביצוע...`);
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
      toast.success(`${productToOrder.product_name} נוסף לסל! 🦾`, { id: toastId });
    } catch (e) { toast.error("תקלה בסנכרון DNA", { id: toastId }); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, query: q, history: messages.slice(-5), customerId: id })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("נתק ב-DNA המערכת"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* --- Quantity Selection Modal --- */}
      <AnimatePresence>
        {isQtyModalOpen && productToOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="bg-white rounded-[55px] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/10">
               <div className="bg-[#020617] p-10 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 blur-[80px] rounded-full" />
                  <div className="text-right z-10">
                     <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">כמות לביצוע</h3>
                     <p className="text-blue-400 text-[10px] font-bold uppercase mt-2 tracking-[0.3em] flex items-center gap-2 justify-end">
                        <Award size={14}/> VIP Logistics Tool
                     </p>
                  </div>
                  <button onClick={() => setIsQtyModalOpen(false)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white"><X size={24}/></button>
               </div>
               
               <div className="p-12 space-y-10 text-center">
                  <div className="flex items-center gap-6 justify-center">
                     <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-50">
                        <img src={productToOrder.image_url} className="w-full h-full object-cover" />
                     </div>
                     <div className="text-right">
                        <h4 className="text-2xl font-black text-slate-900 italic tracking-tight leading-none">{productToOrder.product_name}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">SKU: {productToOrder.sku}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-8 py-8 bg-slate-50 rounded-[40px] shadow-inner">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center text-slate-900 shadow-xl border border-slate-200 active:scale-90 transition-all hover:bg-rose-50"><Minus size={32}/></button>
                     <span className="text-7xl font-black italic text-slate-900 tracking-tighter w-32">{qty}</span>
                     <button onClick={() => setQty(qty + 1)} className="w-20 h-20 bg-slate-900 rounded-[30px] flex items-center justify-center text-white shadow-xl active:scale-90 transition-all hover:bg-blue-600"><Plus size={32}/></button>
                  </div>

                  <button 
                    onClick={finalizeAddToStore}
                    className="w-full bg-blue-600 text-white py-8 rounded-[40px] font-black text-2xl uppercase italic tracking-widest shadow-2xl flex items-center justify-center gap-6 border-b-[12px] border-blue-800 active:scale-95 transition-all"
                  >
                    אשר ושגר לסל 🦾
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative bg-white max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        <header className="h-24 border-b border-slate-100 flex items-center justify-between px-10 bg-white/95 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#020617] rounded-[24px] flex items-center justify-center text-blue-500 shadow-2xl border-2 border-white ring-8 ring-slate-50">
                 <Zap size={28} fill="currentColor" />
              </div>
              <div className="text-right">
                 <h2 className="text-xl font-black italic leading-none uppercase tracking-tighter">{client?.full_name || 'VIP Client Portal'}</h2>
                 <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2 italic">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Saban OS Connected
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.href='/cart'} 
                className={`relative p-4 rounded-3xl transition-all shadow-xl flex items-center gap-3 ${cartCount > 0 ? 'bg-blue-600 text-white animate-bounce' : 'bg-slate-50 text-slate-400 opacity-50'}`}
              >
                 <ShoppingBag size={24} />
                 {cartCount > 0 && (
                   <>
                     <span className="font-black text-sm italic">{cartCount}</span>
                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-ping" />
                   </>
                 )}
              </motion.button>
              <img src={LOGO_PATH} alt="Saban" className="h-10 object-contain hidden md:block" />
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-14 space-y-16 pb-48 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[95%] p-10 md:p-14 rounded-[55px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-slate-900 shadow-xl' : 'bg-[#020617] text-white border-white/5 shadow-2xl rounded-tr-none'
                }`}>
                  <div className={`flex items-center gap-4 mb-10 opacity-30 ${m.role === 'user' ? 'text-slate-500' : 'text-blue-300'}`}>
                     {m.role === 'user' ? <User size={16}/> : <ShieldCheck size={16}/>}
                     <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">{m.role === 'user' ? 'VIP REQUEST' : 'MASTER AI LOGISTICS'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={triggerOrder} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
             <div className="flex justify-end pr-10">
                <div className="bg-[#020617] px-10 py-6 rounded-[40px] flex items-center gap-6 shadow-2xl border border-white/5 animate-pulse">
                   <Loader2 className="animate-spin text-blue-500" size={24} />
                   <span className="text-xs font-black text-blue-400 uppercase italic tracking-[0.3em]">Processing DNA...</span>
                </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        <footer className="p-8 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-24">
          <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-4 rounded-[65px] shadow-[0_50px_100px_rgba(0,0,0,0.2)] flex items-center gap-5 ring-[20px] ring-slate-50/50 backdrop-blur-3xl transition-all focus-within:ring-blue-100/50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="כתוב פקודה או בחן מוצר לביצוע..." 
              className="flex-1 bg-transparent px-8 py-6 outline-none font-black text-2xl text-right text-slate-900 placeholder:text-slate-200" 
            />
            <button onClick={handleSend} className="w-20 h-20 bg-[#020617] rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl">
              <Send size={34} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

// --- המפענח המקצועי V50.0 ---
function SmartMessageRenderer({ text, onAdd }: any) {
  if (!text) return null;

  // חילוץ נתונים
  const galleryMatch = text.match(/\[GALLERY:\s*([^\]]+)\]/i);
  const urls = galleryMatch ? galleryMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 5) : [];

  const skuMatch = text.match(/\[QUICK_ADD:\s*([^\]]+)\]/i);
  const sku = skuMatch ? skuMatch[1] : null;

  const cleanText = text
    .replace(/\[GALLERY:[\s\S]*?\]/gi, '')
    .replace(/\[QUICK_ADD:[\s\S]*?\]/gi, '')
    .replace(/\[VIDEO:[\s\S]*?\]/gi, '')
    .trim();

  const lines = cleanText.split('\n');
  const title = lines.find(l => l.includes('###'))?.replace('###', '').trim();

  return (
    <div className="space-y-6">
      {urls.length > 0 && (
        <div className="my-6 grid grid-cols-12 gap-3 h-[280px]">
           <div className="col-span-8 bg-slate-900 rounded-[35px] overflow-hidden border border-white/10 shadow-2xl">
              <img src={urls[0]} className="w-full h-full object-cover" alt="Main" />
           </div>
           <div className="col-span-4 flex flex-col gap-3">
              {urls.slice(1, 3).map((url, i) => (
                <div key={i} className="flex-1 bg-slate-900 rounded-[22px] overflow-hidden border border-white/10 shadow-lg">
                   <img src={url} className="w-full h-full object-cover grayscale opacity-60" alt="Thumb" />
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="space-y-6">
        {lines.map((line, i) => {
          if (!line.trim()) return null;
          if (line.startsWith('###')) return <h3 key={i} className="text-3xl font-black text-white italic border-r-8 border-blue-600 pr-6 my-10 uppercase tracking-tighter leading-none">{line.replace('###', '')}</h3>;
          return <p key={i} className="text-[20px] md:text-[22px] leading-relaxed font-bold text-white/95 text-right tracking-tight">{line}</p>;
        })}
      </div>

      {sku && (
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAdd(sku)}
          className="w-full mt-10 bg-white text-slate-950 py-8 rounded-[45px] font-black text-[13px] uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-center gap-6 border-b-8 border-slate-200 active:scale-95 italic ring-[15px] ring-white/5"
        >
          הוסף להזמנה <ShoppingCart size={28} className="text-blue-600" />
        </motion.button>
      )}
    </div>
  );
}
