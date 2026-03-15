"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight, Menu,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, Map, Navigation, 
  MousePointerClick, Save, PlayCircle, X, Share2, Volume2 
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ai-Saban OS V16.0 - Final Elite Production
 * -------------------------------------------
 * - Branding: Ai-ח.סבן (Logo: /ai.png)
 * - Multi-Device: Full Mobile Drawer & Desktop Sidebar
 * - Sound: success chime on WhatsApp share
 * - Logic: Dynamic Qty [SET_QTY] & Robust SKU search
 */

const LOGO_PATH = "/ai.png";
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

const BRANCH_DATA: any = {
  talmid: { name: "סניף התלמיד", address: "התלמיד 6, הוד השרון", phone: "097602010", hours: "א'-ה' 06:00-18:00 | ו' 06:00-14:00", wazeUrl: "https://waze.com/ul?q=התלמיד+6+הוד+השרון" },
  heresh: { name: "סניף החרש", address: "החרש 10, הוד השרון", phone: "097402575", hours: "א'-ה' 06:30-16:00 | ו' 06:30-14:00", wazeUrl: "https://waze.com/ul?q=החרש+10+הוד+השרון" }
};

// --- UI Branding Components ---
const SabanLogo = ({ size = "lg" }: { size?: "sm" | "lg" }) => (
  <div className="flex items-center gap-2 md:gap-3">
    <div className="relative shrink-0">
      <div className={`${size === "lg" ? "w-14 h-14 md:w-16 md:h-16" : "w-8 h-8 md:w-10 md:h-10"} bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-blue-50 overflow-hidden`}>
        <img src={LOGO_PATH} alt="Ai-ח.סבן" className="w-full h-full object-cover" />
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
    </div>
    {size === "lg" && (
      <div className="text-right">
        <h1 className="font-black text-lg md:text-2xl text-slate-900 leading-none italic tracking-tighter">Ai-ח.סבן</h1>
        <p className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1">Executive Logistics</p>
      </div>
    )}
  </div>
);

const BotAvatar = () => (
  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-100 shadow-md shrink-0 mt-1 ring-2 ring-white bg-white">
    <img src={LOGO_PATH} alt="Saban AI" className="w-full h-full object-cover" />
  </div>
);

// --- Modals & Overlays ---
const OrderSummaryModal = ({ cart, onClose }: { cart: any[], onClose: () => void }) => {
  const handleShare = () => {
    new Audio(SUCCESS_SOUND).play().catch(() => {});
    const items = cart.map((item, i) => `${i + 1}. *${item.product_name}* - כמות: ${item.qty}`).join('\n');
    const text = encodeURIComponent(`🏗️ *סידור עבודה - ח. סבן*\n\n${items}\n\n*נשלח ממעבדת הביצוע Ai-ח.סבן* 🦾`);
    setTimeout(() => window.open(`https://wa.me/972508860896?text=${text}`, '_blank'), 400);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white rounded-[35px] md:rounded-[50px] w-full max-w-xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
        <div className="bg-slate-900 p-6 md:p-10 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
          <h2 className="text-xl md:text-3xl font-black italic uppercase z-10">סידור עבודה מוכן</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl z-10 transition-colors"><X size={28}/></button>
        </div>
        <div className="p-6 md:p-10 space-y-8 text-right">
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-hide">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 p-5 rounded-[24px] border border-slate-100 group hover:border-blue-200 transition-all">
                <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg">{item.qty}</span>
                <p className="font-black text-slate-900 text-lg md:text-xl flex-1 mr-4">{item.product_name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleShare} className="w-full bg-[#25D366] text-white py-5 md:py-7 rounded-[25px] md:rounded-[35px] font-black text-lg md:text-2xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all border-b-8 border-green-700">
            <Share2 size={28} /> שתף לווצאפ של ראמי
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Product Components ---
const ProductGallery = ({ urls }: { urls: string[] }) => {
  const [main, setMain] = useState(urls[0]);
  return (
    <div className="space-y-4 my-6">
      <motion.div key={main} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-60 md:h-72 bg-white rounded-[30px] md:rounded-[45px] border border-slate-200 shadow-2xl overflow-hidden p-6 flex items-center justify-center ring-4 md:ring-8 ring-blue-50/50">
        <img src={main} className="h-full w-auto object-contain drop-shadow-2xl" alt="Product" />
      </motion.div>
      {urls.length > 1 && (
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide px-2 justify-end">
          {urls.map((u, i) => (
            <button key={i} onClick={() => setMain(u)} className={`w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 md:border-4 shrink-0 p-1 bg-white transition-all ${main === u ? 'border-blue-600 scale-95 shadow-inner' : 'border-slate-100 opacity-60 hover:opacity-100'}`}>
              <img src={u} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const WazeCard = ({ bKey }: { bKey: string }) => {
  const b = BRANCH_DATA[bKey];
  if (!b) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white border-2 border-blue-100 rounded-[35px] md:rounded-[45px] overflow-hidden shadow-2xl my-6 ring-4 ring-blue-50">
      <div className="bg-[#33CCFF] p-5 md:p-6 flex items-center gap-4 text-white shadow-inner">
        <div className="bg-white p-2 md:p-2.5 rounded-2xl shadow-lg text-[#33CCFF]"><Navigation size={24} fill="currentColor"/></div>
        <h3 className="font-black text-lg md:text-2xl italic uppercase tracking-tighter">{b.name}</h3>
      </div>
      <div className="p-6 md:p-8 space-y-6 text-right">
        <p className="text-black font-black text-xl md:text-2xl leading-tight">{b.address}</p>
        <p className="text-slate-500 text-xs md:text-sm font-bold border-y border-slate-50 py-4 leading-relaxed whitespace-pre-line">{b.hours}</p>
        <div className="flex gap-3 pt-2">
          <button onClick={() => window.open(b.wazeUrl)} className="flex-1 bg-[#33CCFF] text-white py-4 md:py-5 rounded-[20px] md:rounded-[25px] font-black text-base md:text-lg shadow-xl active:scale-95 transition-all">סע ב-Waze</button>
          <button onClick={() => window.open(`tel:${b.phone}`)} className="w-20 md:w-24 bg-slate-950 text-white rounded-[20px] md:rounded-[25px] flex items-center justify-center shadow-xl active:scale-95 transition-all"><Phone size={28}/></button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Smart Message Parsing ---
const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;

  const galleryRegex = /\[GALLERY:\s*([\s\S]*?)\]/i;
  const gMatch = text.match(galleryRegex);
  const urls = gMatch ? gMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 0) : null;

  const wazeRegex = /[\(\[]WAZE_BRANCH:(.*?)[\)\]]/gi;
  const wMatch = wazeRegex.exec(text);
  const bKey = wMatch ? wMatch[1].trim() : null;

  const buttonRegex = /\[BUTTON:\s*(.*?)\s*\|\s*(.*?)\s*\]/gi;
  const buttons: any[] = [];
  let bM; while ((bM = buttonRegex.exec(text))) buttons.push({ l: bM[1], a: bM[2] });

  const clean = text
    .replace(galleryRegex, '')
    .replace(/[\(\[]WAZE_BRANCH:.*?[\)\]]/gi, '')
    .replace(buttonRegex, '')
    .replace(/\[QUICK_ADD:.*?\]/g, '')
    .replace(/\[SET_QTY:.*?\]/g, '')
    .trim();
    
  const lines = clean.split('\n');

  return (
    <div className="space-y-4">
      {urls && <ProductGallery urls={urls} />}
      {bKey && <WazeCard bKey={bKey} />}
      
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-xl md:text-2xl pt-2 border-r-[4px] md:border-r-[6px] border-blue-600 pr-3 md:pr-5 my-4 tracking-tighter italic text-right">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[17px] md:text-[20px] leading-relaxed text-black font-bold text-right">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-900 font-black underline decoration-blue-200 decoration-4 underline-offset-4">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      })}

      <div className="flex flex-wrap gap-2 md:gap-4 justify-end mt-4">
        {buttons.map((b, i) => (
          <button key={i} onClick={() => window.open(b.a, '_blank')} className="bg-white border-2 md:border-[3px] border-blue-600 text-blue-700 px-6 md:px-10 py-3 md:py-4 rounded-[20px] md:rounded-[30px] font-black text-sm md:text-lg shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2">
             {b.l.includes('🎥') ? <PlayCircle size={20} /> : <MousePointerClick size={20} />}
             {b.l}
          </button>
        ))}
      </div>

      <div className="space-y-3 pt-6 border-t border-black/5">
        {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
          <button key={i} onClick={() => onAdd(match[1])} className="flex items-center gap-3 md:gap-5 bg-blue-700 text-white px-8 md:px-12 py-5 md:py-7 rounded-[25px] md:rounded-[35px] font-black text-base md:text-xl shadow-2xl hover:bg-blue-800 active:scale-95 w-full justify-center ring-4 md:ring-8 ring-blue-50/50 transition-all">
            <ShoppingCart size={24} /> הוסף {match[1]} לסל לביצוע
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sid = localStorage.getItem('saban_sid_chat3_v16') || `sid_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem('saban_sid_chat3_v16', sid);
      setSessionId(sid);
      (async () => {
        const { data } = await supabase.from('chat_history').select('*').eq('session_id', sid).order('created_at', { ascending: true });
        if (data && data.length > 0) setMessages(data);
        else setMessages([{ role: 'assistant', content: '### מערכת Ai-ח.סבן פעילה\nשלום ראמי, המוח הלוגיסטי מוכן לביצוע. **איך נתקדם היום?** 🦾' }]);
      })();
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

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
    } catch (e) { toast.error("תקלה בחיבור למוח"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      <AnimatePresence>{showSummary && <OrderSummaryModal cart={cart} onClose={() => setShowSummary(false)} />}</AnimatePresence>
      
      {/* Responsive Sidebar/Drawer */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-full md:w-[420px] bg-white border-l border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-10 md:p-14 border-b border-slate-100 flex flex-col items-center gap-6 bg-slate-50/50 relative shadow-sm text-center">
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-6 left-6 p-2 bg-slate-200 rounded-full transition-all active:scale-90 shadow-sm"><X size={24}/></button>
          <SabanLogo />
        </div>
        <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-10 scrollbar-hide bg-slate-50/30">
           <h4 className="text-[13px] md:text-[15px] font-black text-blue-700 uppercase mb-8 flex items-center justify-end gap-3 px-2 tracking-widest">
              סל ביצוע פעיל ({cart.length}) <ShoppingCart size={22}/>
           </h4>
           <AnimatePresence mode="popLayout">
             {cart.map((item) => (
               <motion.div layout initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} key={item.sku} className="p-6 md:p-8 bg-white rounded-[30px] md:rounded-[40px] border border-slate-100 mb-5 shadow-sm flex justify-between items-center group ring-2 ring-black/5 hover:ring-blue-100 transition-all">
                  <button onClick={() => setCart(cart.filter(i => i.sku !== item.sku))} className="text-slate-200 group-hover:text-red-500 transition-colors p-2"><Trash2 size={24}/></button>
                  <div className="text-right flex-1 ml-5">
                    <p className="text-[16px] md:text-[18px] font-black text-slate-900 leading-tight">{item.product_name}</p>
                    <motion.p key={item.qty} initial={{ scale: 1.5, color: '#2563eb' }} animate={{ scale: 1, color: '#2563eb' }} className="text-[13px] md:text-[15px] font-extrabold mt-2 italic">כמות: {item.qty}</motion.p>
                  </div>
               </motion.div>
             ))}
             {cart.length === 0 && <p className="text-center text-[13px] text-slate-300 font-black uppercase opacity-50 py-16 tracking-widest">הסל ריק - ממתין לפקודה</p>}
           </AnimatePresence>
        </div>
        <div className="p-10 border-t border-slate-100 bg-white shadow-2xl">
           <button disabled={cart.length === 0} onClick={() => {setShowSummary(true); setIsSidebarOpen(false);}} className="w-full bg-slate-950 disabled:bg-slate-300 text-white py-6 md:py-8 rounded-[30px] md:rounded-[40px] font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-5 text-xl md:text-2xl italic active:scale-95 uppercase tracking-tighter">סגור הזמנה לביצוע 🦾</button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative bg-white overflow-hidden lg:rounded-r-[70px]">
        <header className="h-24 md:h-32 border-b border-slate-100 px-6 md:px-20 flex items-center justify-between bg-white/95 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-4 md:gap-10">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-4 bg-slate-50 rounded-2xl relative shadow-sm transition-all active:scale-90">
              <Menu size={28} />
              {cart.length > 0 && <span className="absolute -top-1 -left-1 w-6 h-6 bg-blue-600 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">{cart.length}</span>}
            </button>
            <ShieldCheck className="text-emerald-600 hidden md:block" size={48} />
            <div className="text-right">
              <h2 className="text-xl md:text-3xl font-black uppercase italic text-slate-950 leading-none">Execution Arena</h2>
              <div className="text-[10px] md:text-[13px] text-emerald-500 font-black uppercase mt-2.5 tracking-widest flex items-center gap-2 justify-end">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" /> Live Secured Sync
              </div>
            </div>
          </div>
          <SabanLogo size="sm" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-16 space-y-14 md:space-y-20 pb-72 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-3 md:gap-8 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {m.role === 'assistant' && <BotAvatar />}
                <div className={`max-w-[92%] md:max-w-[82%] p-8 md:p-16 rounded-[40px] md:rounded-[70px] shadow-sm border ${m.role === 'user' ? 'bg-white border-slate-200 text-black shadow-xl rounded-tl-none' : 'bg-blue-700/90 backdrop-blur-xl text-white border-blue-800 shadow-blue-400/30 shadow-2xl rounded-tr-none'}`}>
                  <div className={`flex items-center gap-3 mb-8 md:mb-12 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/70'} ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                     <span className="text-[13px] md:text-[15px] font-black uppercase tracking-widest italic">{m.role === 'user' ? 'ראמי הבוס' : 'Ai-ח.סבן'}</span>
                     {m.role === 'user' ? <User size={22} /> : <Zap size={22} fill="currentColor" />}
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end animate-pulse"><div className="bg-white p-10 md:p-12 rounded-[50px] border border-blue-100 shadow-2xl flex items-center gap-8 ring-4 ring-blue-50"><Loader2 className="animate-spin text-blue-600" size={44}/><span className="text-xl md:text-2xl font-black text-blue-800 uppercase italic tracking-widest">המוח מעבד...</span></div></div>}
          <div ref={scrollRef} />
        </div>

        {/* Floating Input Center */}
        <footer className="p-6 md:p-16 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white/95 pt-36 text-right pointer-events-none">
          <div className="max-w-7xl mx-auto bg-white border-2 border-slate-200 p-4 md:p-6 rounded-[65px] md:rounded-[95px] shadow-[0_50px_100px_-25px_rgba(0,0,0,0.35)] flex items-center gap-4 md:gap-10 ring-[15px] md:ring-[30px] ring-slate-50/50 backdrop-blur-3xl pointer-events-auto transition-all focus-within:ring-blue-100/50">
             <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="כתוב פקודה לביצוע ראמי הבוס..." className="flex-1 bg-transparent px-6 md:px-14 py-6 md:py-12 outline-none font-black text-[20px] md:text-[32px] text-right text-black placeholder-slate-400" />
             <button onClick={handleSend} disabled={loading} className="w-20 h-20 md:w-32 md:h-32 aspect-square bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center text-white active:scale-90 shadow-2xl transition-all ring-8 md:ring-[15px] ring-blue-100/50"><Send size={38} className="md:size-[64px]" /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}
