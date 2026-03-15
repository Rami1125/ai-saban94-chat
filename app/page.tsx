"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, Map, Navigation, 
  MousePointerClick, Save, PlayCircle, X, Share2, Volume2 
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V14.2 - Final Elite Production
 * -------------------------------------------
 * - Fix: Robust Gallery parsing for all products.
 * - Branding: Ai-ח.סבן (Logo: /ai.png)
 * - Logic: Dynamic Quantity Sync & Order Summary Modal.
 */

const LOGO_PATH = "/ai.png";
const SUCCESS_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

const SabanLogo = ({ size = "lg" }: { size?: "sm" | "lg" }) => (
  <div className="flex items-center gap-3">
    <div className="relative shrink-0">
      <div className={`${size === "lg" ? "w-16 h-16" : "w-10 h-10"} bg-white rounded-2xl flex items-center justify-center shadow-2xl ring-2 ring-blue-100 overflow-hidden`}>
        <img src={LOGO_PATH} alt="Ai-ח.סבן" className="w-full h-full object-cover" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
    </div>
    {size === "lg" && (
      <div className="text-right">
        <h1 className="font-black text-2xl text-slate-900 leading-none italic tracking-tighter text-right">Ai-ח.סבן</h1>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1.5 text-right">Executive Logistics</p>
      </div>
    )}
  </div>
);

const BotAvatar = () => (
  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-100 shadow-md shrink-0 mt-1 ring-2 ring-white">
    <img src={LOGO_PATH} alt="Bot" className="w-full h-full object-cover" />
  </div>
);

const OrderSummaryModal = ({ cart, onClose }: { cart: any[], onClose: () => void }) => {
  const handleShare = () => {
    new Audio(SUCCESS_SOUND_URL).play().catch(() => {});
    const items = cart.map((item, i) => `${i + 1}. *${item.product_name}* - כמות: ${item.qty}`).join('\n');
    const text = encodeURIComponent(`🏗️ *סידור עבודה - ח. סבן*\n\n${items}\n\n*נשלח ממעבדת הביצוע Ai-ח.סבן* 🦾`);
    setTimeout(() => window.open(`https://wa.me/972508860896?text=${text}`, '_blank'), 400);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[50px] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20">
        <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">סידור עבודה</h2>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={32}/></button>
        </div>
        <div className="p-10 space-y-8 text-right">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 p-6 rounded-[30px] border border-slate-100 group hover:border-blue-200 transition-all">
                <span className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">{item.qty}</span>
                <p className="font-black text-slate-900 text-xl flex-1 mr-6">{item.product_name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleShare} className="w-full bg-[#25D366] text-white py-7 rounded-[35px] font-black text-2xl flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all border-b-8 border-green-700">
            <Share2 size={32} /> שתף לווצאפ של ראמי
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProductGallery = ({ urls }: { urls: string[] }) => {
  const [main, setMain] = useState(urls[0]);
  return (
    <div className="space-y-4 my-6">
      <motion.div key={main} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-72 bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden p-6 flex items-center justify-center ring-8 ring-slate-50">
        <img src={main} className="h-full w-auto object-contain drop-shadow-2xl" alt="Main" />
      </motion.div>
      {urls.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2 justify-end">
          {urls.map((u, i) => (
            <button key={i} onClick={() => setMain(u)} className={`w-20 h-20 rounded-2xl border-4 shrink-0 p-1 bg-white transition-all ${main === u ? 'border-blue-600 scale-95 shadow-inner' : 'border-slate-100 opacity-60'}`}>
              <img src={u} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;

  const galleryRegex = /\[GALLERY:\s*([\s\S]*?)\]/i;
  const gMatch = text.match(galleryRegex);
  const urls = gMatch ? gMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 0) : null;

  const buttonRegex = /\[BUTTON:\s*(.*?)\s*\|\s*(.*?)\s*\]/gi;
  const buttons: any[] = [];
  let bM; while ((bM = buttonRegex.exec(text))) buttons.push({ l: bM[1], a: bM[2] });

  const clean = text
    .replace(galleryRegex, '')
    .replace(buttonRegex, '')
    .replace(/\[QUICK_ADD:.*?\]/g, '')
    .replace(/\[SET_QTY:.*?\]/g, '')
    .trim();
    
  const lines = clean.split('\n');

  return (
    <div className="space-y-5">
      {urls && <ProductGallery urls={urls} />}
      
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-2xl pt-2 border-r-[6px] border-blue-600 pr-5 my-6 tracking-tighter italic text-right">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[20px] leading-relaxed text-black font-bold text-right">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-900 font-black underline decoration-blue-200 decoration-4 underline-offset-8">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      })}

      <div className="flex flex-wrap gap-4 justify-end mt-4">
        {buttons.map((b, i) => (
          <button key={i} onClick={() => window.open(b.a, '_blank')} className="bg-white border-[3px] border-blue-600 text-blue-700 px-10 py-4 rounded-[30px] font-black text-lg shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-3">
             {b.l.includes('🎥') ? <PlayCircle size={24} /> : <MousePointerClick size={24} />}
             {b.l}
          </button>
        ))}
      </div>

      <div className="space-y-4 pt-6 border-t border-black/5">
        {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
          <button key={i} onClick={() => onAdd(match[1])} className="flex items-center gap-5 bg-blue-700 text-white px-12 py-7 rounded-[35px] font-black text-xl shadow-[0_20px_50px_rgba(30,58,138,0.4)] hover:bg-blue-800 transition-all active:scale-95 w-full justify-center ring-8 ring-blue-50/50">
            <ShoppingCart size={30} /> הוסף {match[1]} לסל לביצוע
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
      const sid = localStorage.getItem('saban_sid_v14_final') || `sid_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem('saban_sid_v14_final', sid);
      setSessionId(sid);
      (async () => {
        const { data } = await supabase.from('chat_history').select('*').eq('session_id', sid).order('created_at', { ascending: true });
        if (data && data.length > 0) setMessages(data);
        else setMessages([{ role: 'assistant', content: '### מערכת Ai-ח.סבן פעילה\nברוך הבא ראמי הבוס, המוח הלוגיסטי מחובר לביצוע מלא. **איזו פקודה נריץ היום?** 🦾' }]);
      })();
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, cart]);

  const handleAction = async (sku: string, qty = 1) => {
    let { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (!p) {
        const cleanSku = sku.replace(/-/g, '');
        const { data: altP } = await supabase.from('inventory').select('*').or(`sku.ilike.%${sku}%,sku.ilike.%${cleanSku}%`).limit(1).maybeSingle();
        p = altP;
    }
    if (p) {
      setCart(prev => {
        const ex = prev.find(i => i.sku === p?.sku);
        if (ex) return prev.map(i => i.sku === p?.sku ? {...i, qty} : i);
        return [...prev, {...p, qty}];
      });
      toast.success(`עודכן בסל: ${p.product_name}`, { position: "top-center" });
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
    } catch (e) { toast.error("תקלה בחיבור"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      <AnimatePresence>{showSummary && <OrderSummaryModal cart={cart} onClose={() => setShowSummary(false)} />}</AnimatePresence>
      
      <aside className="w-[420px] border-l border-slate-200 bg-white hidden lg:flex flex-col shadow-sm z-30">
        <div className="p-14 border-b border-slate-100 flex flex-col items-center gap-8 bg-slate-50/50 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-700 via-blue-400 to-emerald-500" />
          <SabanLogo />
        </div>
        <div className="flex-1 p-10 overflow-y-auto space-y-12 scrollbar-hide bg-slate-50/30">
           <section>
             <h4 className="text-[14px] font-black text-blue-700 uppercase mb-8 flex items-center gap-4 tracking-[0.3em] px-2 justify-end">
                סל ביצוע פעיל ({cart.length}) <ShoppingCart size={22}/> 
             </h4>
             <AnimatePresence mode="popLayout">
               {cart.map((item) => (
                 <motion.div layout initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} key={item.sku} className="p-7 bg-white rounded-[40px] border border-slate-100 mb-5 shadow-sm flex justify-between items-center group ring-2 ring-black/5 hover:ring-blue-200 transition-all">
                    <button onClick={() => setCart(cart.filter(i => i.sku !== item.sku))} className="text-slate-200 group-hover:text-red-500 transition-colors p-3"><Trash2 size={24}/></button>
                    <div className="text-right flex-1 ml-4">
                      <p className="text-[17px] font-black text-slate-900 leading-tight">{item.product_name}</p>
                      <motion.p key={item.qty} initial={{ scale: 1.5, color: '#2563eb' }} animate={{ scale: 1, color: '#64748b' }} className="text-[13px] font-bold mt-2 italic text-blue-600">כמות: {item.qty}</motion.p>
                    </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           </section>
        </div>
        <div className="p-12 border-t border-slate-100 bg-white shadow-2xl">
           <button disabled={cart.length === 0} onClick={() => setShowSummary(true)} className="w-full bg-slate-950 disabled:bg-slate-300 text-white py-7 rounded-[40px] font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-5 text-2xl italic active:scale-95 uppercase tracking-tighter">סגור הזמנה לביצוע 🦾</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white overflow-hidden shadow-2xl lg:rounded-r-[80px]">
        <header className="h-32 border-b border-slate-100 px-20 flex items-center justify-between bg-white/95 backdrop-blur-md z-10 shadow-sm">
          <SabanLogo size="sm" />
          <div className="flex items-center gap-8 text-right">
            <div>
              <h2 className="text-3xl font-black uppercase italic text-slate-950 leading-none tracking-tighter">Saban AI Execution</h2>
              <div className="text-[13px] text-emerald-500 font-black uppercase mt-2.5 tracking-[0.4em] flex items-center gap-3 justify-end"><div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" /> Live Secured Sync</div>
            </div>
            <ShieldCheck className="text-emerald-600" size={44} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 space-y-20 pb-72 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-6 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {m.role === 'assistant' && <BotAvatar />}
                <div className={`max-w-[85%] md:max-w-[78%] p-14 rounded-[65px] shadow-sm border ${m.role === 'user' ? 'bg-white border-slate-200 text-black shadow-xl rounded-tl-none' : 'bg-blue-700/90 backdrop-blur-xl text-white border-blue-800 shadow-blue-400/30 shadow-2xl rounded-tr-none'}`}>
                  <div className={`flex items-center gap-4 mb-10 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/70'} ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                     <span className="text-[14px] font-black uppercase tracking-[0.5em]">{m.role === 'user' ? 'ראמי הבוס' : 'Ai-ח.סבן'}</span>
                     {m.role === 'user' ? <User size={22} /> : <Zap size={22} fill="currentColor" />}
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end animate-pulse"><div className="bg-white p-12 rounded-[55px] border border-blue-100 shadow-2xl flex items-center gap-8 ring-4 ring-blue-50"><Loader2 className="animate-spin text-blue-600" size={40}/><span className="text-2xl font-black text-blue-700 uppercase italic tracking-widest">המוח בונה הצעה...</span></div></div>}
          <div ref={scrollRef} />
        </div>

        <footer className="p-14 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-32 text-right">
          <div className="max-w-6xl mx-auto bg-white border-2 border-slate-200 p-6 rounded-[85px] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.35)] flex items-center gap-8 ring-[24px] ring-slate-50/50 backdrop-blur-3xl transition-all focus-within:ring-blue-100/50">
             <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="כתוב פקודת ביצוע ראמי הבוס..." className="flex-1 bg-transparent px-12 py-10 outline-none font-black text-[28px] text-right text-black placeholder-slate-400" />
             <button onClick={handleSend} disabled={loading} className="w-28 h-28 aspect-square bg-blue-700 hover:bg-blue-800 rounded-[60px] flex items-center justify-center text-white transition-all active:scale-90 shadow-[0_30px_60px_rgba(37,99,235,0.5)] ring-[12px] ring-blue-100"><Send size={56} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}
