"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, Map, Navigation, MousePointerClick, Save, PlayCircle, X, Share2
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V12.6 - Order Summary Edition
 * -------------------------------------------
 * - Feature: Order Summary Modal with WhatsApp Sharing.
 * - Fix: Live cart synchronization and real SKU integration.
 * - Branding: Ai-ח.סבן Logistics.
 */

const SabanLogo = () => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 ring-4 ring-blue-50 transform -rotate-3">
        <Zap size={24} fill="white" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
    </div>
    <div className="text-right">
      <h1 className="font-black text-xl text-slate-900 leading-none italic tracking-tighter">Ai-ח.סבן</h1>
      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">LTD Logistics</p>
    </div>
  </div>
);

// --- רכיב מודאל סיכום הזמנה ---
const OrderSummaryModal = ({ cart, onClose }: { cart: any[], onClose: () => void }) => {
  const generateWhatsAppMsg = () => {
    const items = cart.map((item, i) => `${i + 1}. *${item.product_name}* - כמות: ${item.qty}`).join('\n');
    const text = encodeURIComponent(`🏗️ *ח. סבן - סידור עבודה מוכן*\n\n${items}\n\n*נשלח מהמוח הלוגיסטי Ai-ח.סבן* 🦾`);
    window.open(`https://wa.me/972508860896?text=${text}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20"
      >
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black italic uppercase leading-none">סידור עבודה</h2>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-2">Order Summary Ready</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 scrollbar-hide text-right">
            {cart.map((item, i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">{item.qty}</span>
                <p className="font-black text-slate-800 text-sm">{item.product_name}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={generateWhatsAppMsg}
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-6 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-100 transition-all active:scale-95 border-b-8 border-green-700"
            >
              <Share2 size={24} /> שתף לווצאפ של ראמי
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProductGallery = ({ urls }: { urls: string[] }) => {
  const [main, setMain] = useState(urls[0]);
  return (
    <div className="space-y-3 my-5">
      <motion.div className="relative h-72 bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden p-4 flex items-center justify-center">
        <img src={main} className="h-full w-auto object-contain drop-shadow-2xl" alt="Product" />
      </motion.div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
        {urls.map((u, i) => (
          <button key={i} onClick={() => setMain(u)} className={`w-18 h-18 rounded-xl border-2 shrink-0 p-1 bg-white transition-all ${main === u ? 'border-blue-600 scale-95 shadow-inner' : 'border-slate-100'}`}>
            <img src={u} className="w-full h-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
};

const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;

  const galleryRegex = /\[GALLERY:\s*(.*?)\]/i;
  const gMatch = text.match(galleryRegex);
  const urls = gMatch ? gMatch[1].split(',').map(u => u.trim()) : null;

  const buttonRegex = /\[BUTTON:\s*(.*?)\s*\|\s*(.*?)\s*\]/gi;
  const buttons: any[] = [];
  let bM; while ((bM = buttonRegex.exec(text))) buttons.push({ l: bM[1], a: bM[2] });

  const clean = text
    .replace(galleryRegex, '')
    .replace(/[\(\[]WAZE_BRANCH:.*?[\)\]]/gi, '')
    .replace(buttonRegex, '')
    .replace(/\[QUICK_ADD:.*?\]/g, '')
    .replace(/\[FUTURE_SAVE:.*?\]/g, '')
    .replace(/\[SET_QTY:.*?\]/g, '')
    .trim();
  
  const lines = clean.split('\n');
  const isOrderSummary = text.includes("סיכום הזמנה") || text.includes("### 📋 סיכום");

  return (
    <div className="space-y-4">
      {urls && <ProductGallery urls={urls} />}
      
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-2xl pt-2 border-r-4 border-blue-600 pr-4 my-4">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[18px] leading-relaxed text-black font-semibold text-right">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-900 font-black underline decoration-blue-200 decoration-4 underline-offset-8">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      })}

      <div className="flex flex-wrap gap-3 justify-end mt-4">
        {buttons.map((b, i) => (
          <button key={i} onClick={() => window.open(b.a, '_blank')} className="bg-white border-2 border-blue-600 text-blue-800 px-8 py-4 rounded-[22px] font-black shadow-lg hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2">
             {b.l.includes('🎥') ? <PlayCircle size={18} /> : <MousePointerClick size={18} />}
             {b.l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
          <button 
            key={i} 
            onClick={() => onAdd(match[1])} 
            className="flex items-center gap-3 bg-blue-700 text-white px-10 py-5 rounded-[28px] font-black shadow-2xl hover:bg-blue-800 transition-all active:scale-95 w-full justify-center mt-2 ring-4 ring-blue-50"
          >
            <ShoppingCart size={22} /> הוסף {match[1]} לסל לביצוע
          </button>
        ))}
      </div>
    </div>
  );
};

export default function SabanOSFinal() {
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sid = localStorage.getItem('saban_sid_v12') || `sid_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('saban_sid_v12', sid);
      setSessionId(sid);
      (async () => {
        const { data } = await supabase.from('chat_history').select('*').eq('session_id', sid).order('created_at', { ascending: true });
        if (data && data.length > 0) setMessages(data);
        else setMessages([{ role: 'assistant', content: '### אהלן ראמי הבוס\nהמוח של ח. סבן מחובר לביצוע. **איזו פקודה נריץ היום?** 🦾' }]);
      })();
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, cart]);

  const handleAction = async (sku: string, qty = 1) => {
    const { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (p) {
      setCart(prev => {
        const ex = prev.find(i => i.sku === sku);
        if (ex) return prev.map(i => i.sku === sku ? {...i, qty: qty} : i);
        return [...prev, {...p, qty}];
      });
      toast.success(`עודכן בסל: ${p.product_name} (${qty} יח')`, { position: "top-center" });
    } else {
      toast.error(`מק"ט ${sku} לא נמצא במערכת`);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, query: q, history: messages.slice(-5) })
      });
      const data = await res.json();
      
      const qMatch = data.answer.match(/\[SET_QTY:(.*?):(.*?)\]/);
      if (qMatch) handleAction(qMatch[1], parseInt(qMatch[2]));

      const aMatch = data.answer.match(/\[QUICK_ADD:(.*?)\]/);
      if (aMatch) handleAction(aMatch[1]);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("תקלה בחיבור למוח"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <AnimatePresence>
        {showSummary && <OrderSummaryModal cart={cart} onClose={() => setShowSummary(false)} />}
      </AnimatePresence>
      
      <aside className="w-[360px] border-l border-slate-200 bg-white hidden lg:flex flex-col shadow-sm z-30">
        <div className="p-12 border-b border-slate-50 flex flex-col items-center gap-6 bg-slate-50/50">
          <SabanLogo />
        </div>
        <div className="flex-1 p-8 overflow-y-auto space-y-12 scrollbar-hide bg-slate-50/20">
           <section>
             <h4 className="text-[12px] font-black text-blue-700 uppercase mb-6 px-2 tracking-widest flex items-center gap-2"><ShoppingCart size={16}/> סל הזמנה פעיל ({cart.length})</h4>
             <AnimatePresence mode="popLayout">
               {cart.map((item) => (
                 <motion.div layout initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} key={item.sku} className="p-5 bg-white rounded-[32px] border border-slate-100 mb-4 shadow-sm flex justify-between items-center group ring-1 ring-black/5">
                    <div className="text-right">
                      <p className="text-[14px] font-black text-slate-900 leading-tight">{item.product_name}</p>
                      <motion.p key={item.qty} initial={{ scale: 1.4, color: '#2563eb' }} animate={{ scale: 1, color: '#64748b' }} className="text-[11px] font-bold mt-1.5 italic">כמות: {item.qty}</motion.p>
                    </div>
                    <button onClick={() => setCart(cart.filter(i => i.sku !== item.sku))} className="text-slate-200 group-hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
                 </motion.div>
               ))}
             </AnimatePresence>
             {cart.length === 0 && <p className="text-center text-[11px] text-slate-300 italic py-8 font-bold uppercase tracking-widest">הסל ריק</p>}
           </section>
        </div>
        <div className="p-10 border-t border-slate-100 bg-white shadow-2xl">
           <button 
            disabled={cart.length === 0}
            onClick={() => setShowSummary(true)} 
            className="w-full bg-slate-950 disabled:bg-slate-300 text-white py-5 rounded-[32px] font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-lg italic active:scale-95"
           >
             סגור הזמנה לביצוע 🦾
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white overflow-hidden shadow-2xl lg:rounded-r-[60px]">
        <header className="h-24 border-b border-slate-100 px-14 flex items-center justify-between bg-white/95 backdrop-blur-md z-10 shadow-sm text-right">
          <div className="flex items-center gap-5">
            <ShieldCheck className="text-emerald-600 font-black" size={32} />
            <div>
              <h2 className="text-xl font-black uppercase italic text-slate-950 leading-none tracking-tighter">Executive Brain</h2>
              <div className="text-[11px] text-emerald-500 font-black uppercase mt-1 tracking-widest">Live Sync System</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 space-y-16 pb-56 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] p-12 rounded-[55px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-black shadow-md' : 'bg-blue-700/85 backdrop-blur-md text-white border-blue-800 shadow-blue-200/40 shadow-2xl'
                }`}>
                  <div className={`flex items-center gap-2 mb-6 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/60'}`}>
                     {m.role === 'user' ? <User size={16} /> : <Zap size={16} fill="currentColor" />}
                     <span className="text-[12px] font-black uppercase tracking-[0.3em]">{m.role === 'user' ? 'ראמי הבוס' : 'Ai-ח.סבן'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end animate-pulse"><div className="bg-white p-8 rounded-[40px] border border-blue-100 shadow-xl flex items-center gap-4"><Loader2 className="animate-spin text-blue-600" size={28}/><span className="text-sm font-black text-blue-700 uppercase italic">המוח בונה הצעה...</span></div></div>}
          <div ref={scrollRef} />
        </div>

        <footer className="p-12 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-24 text-right">
          <div className="max-w-5xl mx-auto bg-white border-2 border-slate-200 p-4 rounded-[65px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.3)] flex items-center gap-5 ring-[16px] ring-slate-50/50 backdrop-blur-2xl">
             <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="כתוב פקודה לביצוע ראמי..." className="flex-1 bg-transparent px-10 py-7 outline-none font-black text-[22px] text-right text-black placeholder-slate-400" />
             <button onClick={handleSend} disabled={loading} className="w-22 h-22 aspect-square bg-blue-700 hover:bg-blue-800 rounded-[50px] flex items-center justify-center text-white transition-all active:scale-90 shadow-2xl"><Send size={44} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}
