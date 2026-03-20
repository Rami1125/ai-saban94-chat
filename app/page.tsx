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
 * Saban OS V15.0 - Final Multi-Device Elite
 * -------------------------------------------
 * - Branding: Ai-ח.סבן (Logo: /ai.png)
 * - UI: Responsive Desktop/Mobile Design (Sidebar/Drawer)
 * - Logic: Dynamic Qty, Robust SKU Search, WhatsApp Avatars
 */

const LOGO_PATH = "/ai.png";
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

const SabanLogo = ({ size = "lg" }: { size?: "sm" | "lg" }) => (
  <div className="flex items-center gap-2 md:gap-3">
    <div className="relative shrink-0">
      <div className={`${size === "lg" ? "w-12 h-12 md:w-16 md:h-16" : "w-8 h-8 md:w-10 md:h-10"} bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-blue-50 overflow-hidden`}>
        <img src={LOGO_PATH} alt="Ai-ח.סבן" className="w-full h-full object-cover" />
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
    </div>
    {size === "lg" && (
      <div className="text-right">
        <h1 className="font-black text-lg md:text-2xl text-slate-900 leading-none italic tracking-tighter">Ai-ח.סבן</h1>
        <p className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Logistics AI</p>
      </div>
    )}
  </div>
);

const BotAvatar = () => (
  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-blue-100 shadow-md shrink-0 mt-1 ring-2 ring-white">
    <img src={LOGO_PATH} alt="Bot" className="w-full h-full object-cover" />
  </div>
);

// --- רכיב מודאל סיכום הזמנה ---
const OrderSummaryModal = ({ cart, onClose }: { cart: any[], onClose: () => void }) => {
  const handleShare = () => {
    new Audio(SUCCESS_SOUND).play().catch(() => {});
    const items = cart.map((item, i) => `${i + 1}. *${item.product_name}* - כמות: ${item.qty}`).join('\n');
    const text = encodeURIComponent(`🏗️ *סידור עבודה - ח. סבן*\n\n${items}\n\n*נשלח מהמוח הלוגיסטי Ai-ח.סבן* 🦾`);
    setTimeout(() => window.open(`https://wa.me/972508860896?text=${text}`, '_blank'), 400);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[35px] md:rounded-[50px] w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 p-6 md:p-10 text-white flex justify-between items-center">
          <h2 className="text-xl md:text-3xl font-black italic uppercase">סידור עבודה</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={24}/></button>
        </div>
        <div className="p-6 md:p-10 space-y-6 text-right">
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-hide">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 p-4 md:p-6 rounded-[20px] md:rounded-[30px] border border-slate-100">
                <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm">{item.qty}</span>
                <p className="font-black text-slate-900 text-base md:text-xl flex-1 mr-4">{item.product_name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleShare} className="w-full bg-[#25D366] text-white py-5 md:py-7 rounded-[25px] md:rounded-[35px] font-black text-lg md:text-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all border-b-4 md:border-b-8 border-green-700">
            <Share2 size={24} /> שתף לווצאפ
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- מפענח טקסט ו-UI חכם ---
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
    <div className="space-y-4">
      {urls && (
        <div className="my-4 space-y-3">
          <div className="h-48 md:h-72 bg-white rounded-[25px] md:rounded-[40px] border border-slate-200 shadow-xl overflow-hidden p-4 flex items-center justify-center ring-4 ring-blue-50/50">
            <img src={urls[0]} className="h-full object-contain" alt="Product" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 justify-end">
            {urls.slice(1).map((u, i) => (
              <img key={i} src={u} className="w-12 h-12 md:w-20 md:h-20 rounded-xl border-2 border-slate-100 bg-white p-1" alt="thumb" />
            ))}
          </div>
        </div>
      )}
      
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-xl md:text-2xl pt-2 border-r-[4px] md:border-r-[6px] border-blue-600 pr-3 md:pr-5 my-4 tracking-tighter italic text-right">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[17px] md:text-[20px] leading-relaxed text-black font-bold text-right">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-900 font-black underline decoration-blue-200 decoration-2 md:decoration-4 underline-offset-4 md:underline-offset-8">{p.slice(2, -2)}</strong> : p)}
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

      <div className="space-y-3 pt-6">
        {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
          <button key={i} onClick={() => onAdd(match[1])} className="flex items-center gap-3 md:gap-5 bg-blue-700 text-white px-8 md:px-12 py-5 md:py-7 rounded-[25px] md:rounded-[35px] font-black text-base md:text-xl shadow-2xl hover:bg-blue-800 transition-all active:scale-95 w-full justify-center ring-4 md:ring-8 ring-blue-50/50">
            <ShoppingCart size={24} /> הוסף {match[1]} לסל לביצוע
          </button>
        ))}
      </div>
    </div>
  );
};

// --- קומפוננטת האפליקציה הראשית ---
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
      const sid = localStorage.getItem('saban_sid_v15') || `sid_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem('saban_sid_v15', sid);
      setSessionId(sid);
      (async () => {
        const { data } = await supabase.from('chat_history').select('*').eq('session_id', sid).order('created_at', { ascending: true });
        if (data && data.length > 0) setMessages(data);
        else setMessages([{ role: 'assistant', content: '### מערכת Ai-ח.סבן פעילה\nברוך הבא ראמי, המוח הלוגיסטי מוכן לביצוע פקודות. **איך נתקדם היום?** 🦾' }]);
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
      const res = await fetch('/api/admin_pro/brain', {
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
      
      {/* Sidebar - Desktop fixed, Mobile overlay */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-white border-l border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-8 md:p-12 border-b border-slate-100 flex flex-col items-center gap-4 bg-slate-50/50 relative">
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-6 left-6 p-2 bg-slate-200/50 rounded-full"><X size={20}/></button>
          <SabanLogo />
        </div>
        <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8 scrollbar-hide bg-slate-50/30">
           <h4 className="text-[12px] md:text-[14px] font-black text-blue-700 uppercase mb-6 flex items-center gap-3 px-2">סל ביצוע פעיל ({cart.length}) <ShoppingCart size={20}/></h4>
           <AnimatePresence mode="popLayout">
             {cart.map((item) => (
               <motion.div layout initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} key={item.sku} className="p-5 md:p-7 bg-white rounded-[25px] md:rounded-[40px] border border-slate-100 mb-4 shadow-sm flex justify-between items-center group ring-2 ring-black/5">
                  <button onClick={() => setCart(cart.filter(i => i.sku !== item.sku))} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={20}/></button>
                  <div className="text-right flex-1 ml-4">
                    <p className="text-[14px] md:text-[17px] font-black text-slate-900 leading-tight">{item.product_name}</p>
                    <motion.p key={item.qty} initial={{ scale: 1.5, color: '#2563eb' }} animate={{ scale: 1, color: '#64748b' }} className="text-[12px] md:text-[14px] font-bold mt-2 italic">כמות: {item.qty}</motion.p>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
        <div className="p-8 border-t border-slate-100 bg-white">
           <button disabled={cart.length === 0} onClick={() => {setShowSummary(true); setIsSidebarOpen(false);}} className="w-full bg-slate-950 disabled:bg-slate-300 text-white py-5 md:py-7 rounded-[25px] md:rounded-[40px] font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 text-lg md:text-2xl italic active:scale-95">סגור הזמנה 🦾</button>
        </div>
      </aside>

      {/* Main Execution Arena */}
      <main className="flex-1 flex flex-col relative bg-white overflow-hidden lg:rounded-r-[60px]">
        <header className="h-24 md:h-32 border-b border-slate-100 px-6 md:px-20 flex items-center justify-between bg-white/95 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-4 md:gap-8">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-slate-50 rounded-2xl relative">
              <Menu size={24} />
              {cart.length > 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
            </button>
            <ShieldCheck className="text-emerald-600 hidden md:block" size={44} />
            <div>
              <h2 className="text-xl md:text-3xl font-black uppercase italic text-slate-950 leading-none">Saban AI</h2>
              <div className="text-[10px] md:text-[13px] text-emerald-500 font-black uppercase mt-1.5 tracking-widest flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Sync</div>
            </div>
          </div>
          <SabanLogo size="sm" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-16 space-y-12 md:space-y-20 pb-64 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-3 md:gap-6 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {m.role === 'assistant' && <BotAvatar />}
                <div className={`max-w-[90%] md:max-w-[78%] p-6 md:p-14 rounded-[30px] md:rounded-[65px] shadow-sm border ${m.role === 'user' ? 'bg-white border-slate-200 text-black shadow-xl rounded-tl-none' : 'bg-blue-700/90 backdrop-blur-xl text-white border-blue-800 shadow-blue-400/30 shadow-2xl rounded-tr-none'}`}>
                  <div className={`flex items-center gap-3 mb-6 md:mb-10 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/70'} ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                     <span className="text-[12px] md:text-[14px] font-black uppercase tracking-widest">{m.role === 'user' ? 'ראמי הבוס' : 'Ai-ח.סבן'}</span>
                     {m.role === 'user' ? <User size={18} /> : <Zap size={18} fill="currentColor" />}
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end animate-pulse"><div className="bg-white p-8 rounded-[40px] border border-blue-100 shadow-xl flex items-center gap-6"><Loader2 className="animate-spin text-blue-600" size={28}/><span className="text-lg font-black text-blue-800 uppercase italic">מעבד...</span></div></div>}
          <div ref={scrollRef} />
        </div>

        {/* Input Center */}
        <footer className="p-6 md:p-14 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-24 text-right">
          <div className="max-w-6xl mx-auto bg-white border-2 border-slate-200 p-3 md:p-5 rounded-[50px] md:rounded-[85px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] flex items-center gap-4 md:gap-8 ring-[10px] md:ring-[24px] ring-slate-50/50 backdrop-blur-3xl">
             <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="כתוב פקודה לביצוע ראמי..." className="flex-1 bg-transparent px-4 md:px-12 py-5 md:py-10 outline-none font-black text-[18px] md:text-[28px] text-right text-black" />
             <button onClick={handleSend} disabled={loading} className="w-16 h-16 md:w-28 md:h-28 aspect-square bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center text-white transition-all active:scale-90 shadow-2xl"><Send size={32} className="md:size-[56px]" /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}
