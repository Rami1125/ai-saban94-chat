"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { supabase } from "@/lib/supabase"; 
import { 
  Send, Zap, ShoppingCart, Loader2, User, ShieldCheck, 
  Image as ImageIcon, X, PlayCircle, Clock, Hammer, Calculator,
  ArrowRight, Sparkles, Smartphone, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

/**
 * Saban OS V46.0 - Main Customer Chat
 * -------------------------------------------
 * - Connected: Real-time VIP Profile (id from URL).
 * - Designer: Stitched Elite UI components.
 * - Integration: Syncs with Firebase Live Cart & Admin Dashboard.
 */

const LOGO_PATH = "/ai.png";
const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "saban-os-v1";

export default function UnifiedVipChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. אתחול נתונים (פרופיל + סל חי)
  useEffect(() => {
    async function init() {
      // שליפת פרופיל לקוח
      const { data } = await supabase.from('vip_profiles').select('*').eq('id', id).maybeSingle();
      setClient(data);

      // חיבור אנונימי לסל
      await signInAnonymously(auth);
      const cartCol = collection(db, 'artifacts', appId, 'users', id, 'cart');
      onSnapshot(cartCol, (snap) => setCartCount(snap.size));
      
      setMessages([{ 
        role: 'assistant', 
        content: `### המוח הלוגיסטי של ח. סבן פעיל 🦾\nאהלן ${data?.nickname || 'אחי'}, אני מסונכרן לביצוע ב**${data?.main_project || 'שטח'}**. מה נבצע היום?` 
      }]);
    }
    init();
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // 2. הזרקה לסל מתוך כרטיס המוצר
  const addToCart = async (sku: string) => {
    const toastId = toast.loading("מזריק לסל...");
    try {
      const { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).single();
      const cartRef = doc(db, 'artifacts', appId, 'users', id, 'cart', sku);
      await setDoc(cartRef, { sku, name: p.product_name, qty: 1, img: p.image_url, price: p.price || 0 });
      toast.success(`${p.product_name} שמור בסל 🦾`, { id: toastId });
    } catch (e) { toast.error("תקלה בסנכרון", { id: toastId }); }
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
    } catch (e) { toast.error("נתק ב-DNA"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      
      <main className="flex-1 flex flex-col relative bg-white max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        {/* Header */}
        <header className="h-20 border-b flex items-center justify-between px-8 bg-white/95 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-slate-950 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl border-2 border-white ring-8 ring-slate-50">
                 <Zap size={22} fill="currentColor" />
              </div>
              <div className="text-right">
                 <h2 className="text-lg font-black italic leading-none uppercase tracking-tighter">{client?.full_name || 'Saban OS'}</h2>
                 <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-1 italic flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live VIP Portal
                 </p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => window.location.href='/cart'} className="relative p-2 bg-slate-50 rounded-xl">
                 <ShoppingCart size={20} />
                 {cartCount > 0 && <span className="absolute -top-1 -left-1 bg-blue-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">{cartCount}</span>}
              </button>
              <img src={LOGO_PATH} alt="Logo" className="h-8 object-contain" />
           </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 pb-48 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[95%] p-6 md:p-10 rounded-[45px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-slate-900 shadow-md' : 'bg-blue-700 text-white border-blue-800 shadow-2xl rounded-tr-none'
                }`}>
                  <div className={`flex items-center gap-3 mb-6 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/50'}`}>
                     {m.role === 'user' ? <User size={14}/> : <ShieldCheck size={14}/>}
                     <span className="text-[10px] font-black uppercase tracking-widest">{m.role === 'user' ? (client?.nickname || 'ראמי הבוס') : 'AI MASTER'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={addToCart} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end pr-4 animate-pulse"><Loader2 className="animate-spin text-blue-600" size={24} /></div>}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <footer className="p-6 bg-gradient-to-t from-white via-white to-transparent absolute bottom-0 w-full">
          <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-2 rounded-[45px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] flex items-center gap-3 ring-[15px] ring-slate-50/50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="מה בונים היום אחי?..." 
              className="flex-1 bg-transparent px-8 py-5 outline-none font-black text-xl text-right text-slate-900 placeholder:text-slate-200" 
            />
            <button onClick={handleSend} className="w-16 h-16 bg-blue-600 rounded-[35px] flex items-center justify-center text-white active:scale-90 transition-all shadow-xl hover:bg-blue-700">
              <Send size={28} />
            </button>
          </div>
        </footer>
      </main>

      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

// --- המפענח המשודרג (V46.0) ---
function SmartMessageRenderer({ text, onAdd }: any) {
  if (!text) return null;

  const galleryMatch = text.match(/\[GALLERY:\s*([\s\S]*?)\]/i);
  const urls = galleryMatch ? galleryMatch[1].split(',').map((u:string) => u.trim()) : [];
  const skuMatch = text.match(/\[QUICK_ADD:(.*?)\]/);
  const sku = skuMatch ? skuMatch[1] : null;

  const cleanText = text
    .replace(/\[GALLERY:.*?\]/gi, '')
    .replace(/\[QUICK_ADD:.*?\]/gi, '')
    .trim();

  return (
    <div className="space-y-6">
      {urls.length > 0 && (
         <div className="flex gap-3 h-52">
            <div className="flex-[2] bg-slate-900 rounded-[30px] overflow-hidden"><img src={urls[0]} className="w-full h-full object-cover" /></div>
            {urls[1] && <div className="flex-1 bg-slate-900 rounded-[22px] overflow-hidden"><img src={urls[1]} className="w-full h-full object-cover" /></div>}
         </div>
      )}

      <div className="space-y-4">
        {cleanText.split('\n').map((line: string, i: number) => {
          if (!line.trim()) return null;
          if (line.startsWith('###')) return <h3 key={i} className="text-xl font-black italic border-r-4 border-blue-400 pr-3 my-4">{line.replace('###', '')}</h3>;
          return <p key={i} className="text-[17px] leading-relaxed font-bold text-right">{line}</p>;
        })}
      </div>

      {sku && (
        <button onClick={() => onAdd(sku)} className="w-full bg-white text-blue-700 py-6 rounded-[35px] font-black text-xs uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-5 border-b-8 border-slate-100 active:scale-95 transition-all italic">
           הוסף להזמנה <ShoppingCart size={20} />
        </button>
      )}
    </div>
  );
}
