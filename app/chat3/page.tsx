"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  MessageSquare, LayoutDashboard, ExternalLink, Clock, Users, 
  ShoppingCart, Image as ImageIcon, ChevronRight,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, Map, Navigation, MousePointerClick, Save, PlayCircle
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V12.0 - Final Production Version
 * -------------------------------------------
 * - Branding: Ai-ח.סבן Premium
 * - UI: Glassmorphism + High Contrast Text
 * - Features: Live Cart, Future Orders, Waze Integration, Gallery, Custom Buttons
 */

const BRANCH_DATA: any = {
  talmid: {
    name: "סניף התלמיד",
    address: "התלמיד 6, הוד השרון",
    phone: "097602010",
    hours: "א'-ה' 06:00-18:00 | ו' 06:00-14:00",
    wazeUrl: "https://waze.com/ul?q=התלמיד+6+הוד+השרון"
  },
  heresh: {
    name: "סניף החרש",
    address: "החרש 10, הוד השרון",
    phone: "097402575",
    hours: "א'-ה' 06:30-16:00 | ו' 06:30-14:00",
    wazeUrl: "https://waze.com/ul?q=החרש+10+הוד+השרון"
  }
};

// --- רכיב לוגו ממותג ---
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

// --- רכיב גלריית מוצרים ---
const ProductGallery = ({ urls }: { urls: string[] }) => {
  const [main, setMain] = useState(urls[0]);
  return (
    <div className="space-y-3 my-5">
      <motion.div className="relative h-64 bg-white rounded-[32px] border border-slate-200 shadow-lg overflow-hidden p-4 flex items-center justify-center">
        <img src={main} className="h-full w-auto object-contain" alt="Product" />
      </motion.div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {urls.map((u, i) => (
          <button key={i} onClick={() => setMain(u)} className={`w-16 h-16 rounded-xl border-2 shrink-0 p-1 bg-white ${main === u ? 'border-blue-600' : 'border-slate-100'}`}>
            <img src={u} className="w-full h-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
};

// --- כרטיס ניווט WAZE ---
const WazeCard = ({ bKey }: { bKey: string }) => {
  const b = BRANCH_DATA[bKey];
  if (!b) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white border-2 border-[#33CCFF]/20 rounded-[35px] overflow-hidden shadow-2xl my-4">
      <div className="bg-[#33CCFF] p-4 flex items-center gap-3 text-white">
        <Navigation size={20} fill="white" />
        <h3 className="font-black text-lg uppercase italic">{b.name}</h3>
      </div>
      <div className="p-6 space-y-4 text-right">
        <p className="text-black font-black text-lg leading-tight">{b.address}</p>
        <p className="text-slate-500 text-xs font-bold leading-relaxed">{b.hours}</p>
        <div className="flex gap-2 pt-2">
          <button onClick={() => window.open(b.wazeUrl)} className="flex-1 bg-[#33CCFF] text-white py-4 rounded-2xl font-black shadow-lg">סע ב-Waze</button>
          <button onClick={() => window.open(`tel:${b.phone}`)} className="w-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Phone size={20}/></button>
        </div>
      </div>
    </motion.div>
  );
};

// --- מפענח טקסט חכם ---
const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;

  const galleryRegex = /\[GALLERY:\s*(.*?)\]/i;
  const gMatch = text.match(galleryRegex);
  const urls = gMatch ? gMatch[1].split(',').map(u => u.trim()) : null;

  const wazeRegex = /[\(\[]WAZE_BRANCH:(.*?)[\)\]]/gi;
  const wMatch = wazeRegex.exec(text);
  const bKey = wMatch ? wMatch[1].trim() : null;

  const buttonRegex = /\[BUTTON:\s*(.*?)\s*\|\s*(.*?)\s*\]/gi;
  const buttons: any[] = [];
  let bM; while ((bM = buttonRegex.exec(text))) buttons.push({ l: bM[1], a: bM[2] });

  const clean = text.replace(galleryRegex, '').replace(wazeRegex, '').replace(buttonRegex, '').replace(/\[QUICK_ADD:.*?\]/g, '').replace(/\[FUTURE_SAVE:.*?\]/g, '').replace(/\[SET_QTY:.*?\]/g, '').trim();
  const lines = clean.split('\n');

  return (
    <div className="space-y-4">
      {urls && <ProductGallery urls={urls} />}
      {bKey && <WazeCard bKey={bKey} />}
      
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-xl pt-2 border-r-4 border-blue-600 pr-3">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[17px] leading-relaxed text-black font-semibold">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-900 font-black underline decoration-blue-200 decoration-2 underline-offset-4">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      })}

      <div className="flex flex-wrap gap-2">
        {buttons.map((b, i) => (
          <button key={i} onClick={() => window.open(b.a.startsWith('tel') ? b.a : b.a, '_blank')} className="bg-white border-2 border-blue-600 text-blue-700 px-6 py-3 rounded-2xl font-black shadow-md hover:bg-blue-50 transition-all">
             {b.l}
          </button>
        ))}
      </div>

      {text.includes("[QUICK_ADD:") && (
        <button onClick={() => onAdd(text.match(/\[QUICK_ADD:(.*?)\]/)![1])} className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-3xl font-black shadow-xl active:scale-95 transition-all">
          <ShoppingCart size={20} /> הוסף לסל לביצוע
        </button>
      )}

      {text.includes("### 📋 סיכום") && (
        <button onClick={() => window.open(`https://wa.me/972508860896?text=${encodeURIComponent(clean)}`)} className="w-full bg-[#25D366] text-white py-5 rounded-[35px] font-black shadow-2xl border-b-8 border-green-700 active:scale-95 transition-all mt-6 text-lg italic uppercase">
           שלח הזמנה סופית לראמי 🦾
        </button>
      )}
    </div>
  );
};

export default function SabanOSFinal() {
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [future, setFuture] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sid = localStorage.getItem('saban_sid') || `sid_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('saban_sid', sid);
      setSessionId(sid);
      (async () => {
        const { data } = await supabase.from('chat_history').select('*').eq('session_id', sid).order('created_at', { ascending: true });
        if (data && data.length > 0) setMessages(data);
        else setMessages([{ role: 'assistant', content: '### אהלן ראמי הבוס\nהמערכת מוכנה לביצוע. **מה נבצע היום?** 🦾' }]);
      })();
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, cart]);

  const handleAction = async (sku: string, qty = 1, isFuture = false) => {
    const { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (p) {
      const target = isFuture ? setFuture : setCart;
      target(prev => {
        const ex = prev.find(i => i.sku === sku);
        if (ex) return prev.map(i => i.sku === sku ? {...i, qty} : i);
        return [...prev, {...p, qty}];
      });
      toast.success(isFuture ? "נשמר להזמנה עתידית" : "התווסף לסל הביצוע");
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

      const fMatch = data.answer.match(/\[FUTURE_SAVE:(.*?)\]/);
      if (fMatch) handleAction(fMatch[1], 1, true);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("תקלה במוח"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar - Management */}
      <aside className="w-[340px] border-l border-slate-200 bg-white hidden lg:flex flex-col shadow-sm z-30">
        <div className="p-10 border-b border-slate-50 flex flex-col items-center gap-6 bg-slate-50/50">
          <SabanLogo />
        </div>

        <div className="flex-1 p-8 overflow-y-auto space-y-10 scrollbar-hide">
           <section>
             <h4 className="text-[11px] font-black text-blue-600 uppercase mb-6 flex items-center gap-3 tracking-widest">סל הזמנה פעיל ({cart.length})</h4>
             {cart.map((item, idx) => (
               <motion.div key={idx} layout className="p-5 bg-white rounded-[28px] border border-slate-100 mb-3 shadow-sm flex justify-between items-center group">
                  <div className="text-right">
                    <p className="text-[13px] font-black text-slate-900">{item.product_name}</p>
                    <p className="text-[11px] text-blue-600 font-bold mt-1 italic">כמות: {item.qty || 1}</p>
                  </div>
                  <button onClick={() => setCart(cart.filter(i => i.sku !== item.sku))} className="text-slate-300 group-hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
               </motion.div>
             ))}
           </section>

           <section>
             <h4 className="text-[11px] font-black text-orange-500 uppercase mb-6 flex items-center gap-3 tracking-widest">הזמנות עתידיות ({future.length})</h4>
             {future.map((item, idx) => (
               <motion.div key={idx} layout className="p-5 bg-orange-50/50 rounded-[28px] border border-orange-100 mb-3 shadow-sm flex justify-between items-center group">
                  <div className="text-right">
                    <p className="text-[13px] font-black text-orange-950">{item.product_name}</p>
                    <p className="text-[11px] text-orange-600 font-bold">שמור לעתיד</p>
                  </div>
                  <button onClick={() => setFuture(future.filter(i => i.sku !== item.sku))} className="text-orange-200 group-hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
               </motion.div>
             ))}
           </section>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white">
           <button onClick={() => toast.success("מכין סיכום עבודה...")} className="w-full bg-slate-950 text-white py-5 rounded-[30px] font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 italic">
              סגור הזמנה לביצוע 🦾
           </button>
        </div>
      </aside>

      {/* Main Chat Content */}
      <main className="flex-1 flex flex-col relative bg-white overflow-hidden shadow-2xl lg:rounded-r-[50px]">
        <header className="h-20 border-b border-slate-100 px-12 flex items-center justify-between bg-white/95 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <ShieldCheck className="text-emerald-600 font-black" size={28} />
            <div>
              <h2 className="text-lg font-black uppercase italic text-slate-950 leading-none">Executive Saban AI</h2>
              <div className="text-[10px] text-emerald-500 font-black uppercase mt-1 tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live System Active
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all cursor-pointer"><Search size={22}/></div>
             <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all cursor-pointer"><Phone size={22}/></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-14 pb-48 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] p-10 rounded-[45px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-black shadow-md' : 'bg-blue-700/90 backdrop-blur-md text-white border-blue-800 shadow-blue-200/40 shadow-2xl'
                }`}>
                  <div className={`flex items-center gap-2 mb-5 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/60'}`}>
                     {m.role === 'user' ? <User size={14} /> : <Zap size={14} fill="currentColor" />}
                     <span className="text-[11px] font-black uppercase tracking-[0.2em]">{m.role === 'user' ? 'ראמי הבוס' : 'Ai-ח.סבן'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end animate-pulse"><div className="bg-white p-6 rounded-[35px] border border-blue-100 flex items-center gap-4 shadow-xl"><Loader2 className="animate-spin text-blue-600" size={24}/><span className="text-xs font-black text-blue-700 uppercase italic">המוח בונה הצעה לביצוע...</span></div></div>}
          <div ref={scrollRef} />
        </div>

        {/* Input Composer */}
        <footer className="p-10 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-24">
          <div className="max-w-5xl mx-auto bg-white border-2 border-slate-200 p-3 rounded-[55px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] flex items-center gap-4 ring-12 ring-slate-50/30 backdrop-blur-xl">
             <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="כתוב פקודה לביצוע ראמי..." 
              className="flex-1 bg-transparent px-10 py-6 outline-none font-black text-[20px] text-right text-black placeholder-slate-400" 
            />
            <button 
              onClick={handleSend} disabled={loading}
              className="w-20 h-20 bg-blue-700 hover:bg-blue-800 rounded-[45px] flex items-center justify-center text-white transition-all active:scale-90 shadow-2xl shadow-blue-400/50"
            >
              <Send size={38} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
