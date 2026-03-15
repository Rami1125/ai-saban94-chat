"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight, Menu,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, Map, Navigation, 
  MousePointerClick, Save, PlayCircle, X, Share2, Volume2, Info, AlertTriangle
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ai-Saban OS V17.5 - VIP Dynamic Portal
 * -------------------------------------------
 * Path: app/vip/[id]/page.tsx
 * Logic: Dynamic ID detection for personalized magic links.
 */

const LOGO_PATH = "/ai.png";
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

// מאגר פרופילי לקוחות (בשלב הבא יימשך מה-DB)
const CLIENT_PROFILES: any = {
  "601992": {
    name: "בר אורניל (אורניל/אבי לוי)",
    project: "סטרומה 4, הרצליה",
    phone: "054-5998111",
    lastContainerChange: "2026-03-08",
    specialNotes: "רגישות לניצבים בגבס, מעקב מכולות 8 קוב"
  }
};

const SabanLogo = ({ size = "lg" }: { size?: "sm" | "lg" }) => (
  <div className="flex items-center gap-2 md:gap-3">
    <div className="relative shrink-0">
      <div className={`${size === "lg" ? "w-14 h-14 md:w-16 md:h-16" : "w-10 h-10"} bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-blue-50 overflow-hidden`}>
        <img src={LOGO_PATH} alt="Ai-ח.סבן" className="w-full h-full object-cover" />
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
    </div>
    {size === "lg" && (
      <div className="text-right">
        <h1 className="font-black text-lg md:text-2xl text-slate-900 leading-none italic tracking-tighter">Ai-ח.סבן</h1>
        <p className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1 text-right">VIP Agent OS</p>
      </div>
    )}
  </div>
);

const BotAvatar = () => (
  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-100 shadow-md shrink-0 mt-1 ring-2 ring-white bg-white">
    <img src={LOGO_PATH} alt="Saban AI" className="w-full h-full object-cover" />
  </div>
);

const OrderSummaryModal = ({ cart, client, onClose }: { cart: any[], client: any, onClose: () => void }) => {
  const handleShare = () => {
    new Audio(SUCCESS_SOUND).play().catch(() => {});
    const items = cart.map((item, i) => `• *${item.product_name}* | כמות: ${item.qty}`).join('\n');
    const text = encodeURIComponent(
      `🏗️ *אישור הזמנה לביצוע - ח. סבן*\n` +
      `-----------------------------------\n` +
      `👤 *לקוח:* ${client.name}\n` +
      `🏗️ *פרויקט:* ${client.project}\n` +
      `📱 *איש קשר:* בר (${client.phone})\n\n` +
      `*פירוט פריטים:*\n${items}\n\n` +
      `*הנחיות:* נא לאשר העמסה לבוקר. 🦾\n` +
      `-----------------------------------\n` +
      `_נוצר ע"י השותף הדיגיטלי Ai-ח.סבן_`
    );
    setTimeout(() => window.open(`https://wa.me/972508860896?text=${text}`, '_blank'), 400);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, y: 30 }} className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="text-right">
            <h2 className="text-2xl font-black italic uppercase leading-none">סיכום הזמנה</h2>
            <p className="text-blue-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Executive Delivery Draft</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={28}/></button>
        </div>
        <div className="p-8 space-y-8 text-right">
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 p-5 rounded-[22px] border border-slate-100">
                <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md">{item.qty}</span>
                <p className="font-black text-slate-900 text-lg flex-1 mr-4">{item.product_name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleShare} className="w-full bg-[#25D366] text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-xl border-b-8 border-green-700 active:scale-95 transition-all">
            <Share2 size={28} /> אשר ושלח לביצוע
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;
  const galleryRegex = /\[GALLERY:\s*([\s\S]*?)\]/i;
  const gMatch = text.match(galleryRegex);
  const urls = gMatch ? gMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 0) : null;
  const clean = text.replace(galleryRegex, '').replace(/\[QUICK_ADD:.*?\]/g, '').replace(/\[SET_QTY:.*?\]/g, '').trim();
  const lines = clean.split('\n');

  return (
    <div className="space-y-4">
      {urls && (
        <div className="my-4 space-y-3">
          <div className="h-60 md:h-72 bg-white rounded-[30px] border border-slate-200 shadow-xl overflow-hidden p-4 flex items-center justify-center ring-4 ring-blue-50/50">
            <img src={urls[0]} className="h-full object-contain" alt="Product" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 justify-end px-2">
            {urls.slice(1).map((u, i) => (
              <img key={i} src={u} className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-slate-100 bg-white p-1 shadow-sm" alt="thumb" />
            ))}
          </div>
        </div>
      )}
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-xl md:text-2xl pt-2 border-r-[5px] border-blue-600 pr-4 my-4 tracking-tighter italic text-right">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[18px] md:text-[21px] leading-relaxed text-slate-900 font-bold text-right">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-900 font-black underline decoration-blue-200 decoration-4 underline-offset-8">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      })}
      {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
        <button key={i} onClick={() => onAdd(match[1])} className="flex items-center gap-4 bg-blue-700 text-white px-8 md:px-12 py-5 md:py-7 rounded-[30px] font-black text-lg md:text-xl shadow-2xl hover:bg-blue-800 active:scale-95 w-full justify-center ring-4 md:ring-8 ring-blue-50/50 transition-all">
          <ShoppingCart size={28} /> הוסף {match[1]} לסל לביצוע
        </button>
      ))}
    </div>
  );
};

export default function VipClientPortal() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (id && CLIENT_PROFILES[id as string]) {
      const profile = CLIENT_PROFILES[id as string];
      setClient(profile);
      setMessages([{ 
        role: 'assistant', 
        content: `### אהלן בר אחי 🦾\nהמוח של ח. סבן מחובר לפרויקט ב**${profile.project}**. המכולה שלך שם כבר 8 ימים, להכין פינוי? **מה נבצע היום?**` 
      }]);
    } else {
      setMessages([{ role: 'assistant', content: "### שגיאת זיהוי\nלינק הקסם לא תקין או פג תוקף. נא לפנות לראמי." }]);
    }
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAction = async (sku: string, qty = 1) => {
    let { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
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
        body: JSON.stringify({ sessionId: `vip_${id}`, query: q, history: messages.slice(-5) })
      });
      const data = await res.json();
      const qMatch = data.answer.match(/\[SET_QTY:(.*?):(.*?)\]/);
      if (qMatch) handleAction(qMatch[1], parseInt(qMatch[2]));
      const aMatch = data.answer.match(/\[QUICK_ADD:(.*?)\]/);
      if (aMatch) handleAction(aMatch[1]);
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("ניתוק מהמוח"); } finally { setLoading(false); }
  };

  if (!client && id) return <div className="h-screen flex items-center justify-center font-black italic text-slate-400">מזהה לינק קסם...</div>;

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      <AnimatePresence>{showSummary && <OrderSummaryModal cart={cart} client={client} onClose={() => setShowSummary(false)} />}</AnimatePresence>
      
      <aside className={`fixed inset-y-0 right-0 z-50 w-full md:w-[420px] bg-white border-l border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-10 md:p-14 border-b border-slate-100 flex flex-col items-center gap-6 bg-slate-50/50 relative shadow-sm text-center">
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-6 left-6 p-2 bg-slate-200 rounded-full active:scale-90"><X size={24}/></button>
          <SabanLogo />
          <div className="bg-blue-50 px-5 py-2.5 rounded-2xl border border-blue-100 shadow-sm">
            <p className="text-[12px] font-black text-blue-700 uppercase tracking-tighter italic">פרויקט פעיל: {client.project}</p>
          </div>
        </div>
        <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-10 scrollbar-hide bg-slate-50/30">
           <h4 className="text-[13px] md:text-[15px] font-black text-blue-700 uppercase mb-8 flex items-center justify-end gap-3 px-2 tracking-widest">סל ביצוע ({cart.length}) <ShoppingCart size={22}/></h4>
           <AnimatePresence mode="popLayout">
             {cart.map((item) => (
               <motion.div layout initial={{ x: 20, opacity: 0 }} key={item.sku} className="p-6 md:p-8 bg-white rounded-[30px] md:rounded-[40px] border border-slate-100 mb-5 shadow-sm flex justify-between items-center group hover:ring-2 ring-blue-100 transition-all">
                  <button onClick={() => setCart(cart.filter(i => i.sku !== item.sku))} className="text-slate-200 group-hover:text-red-500 transition-colors p-2"><Trash2 size={24}/></button>
                  <div className="text-right flex-1 ml-5">
                    <p className="text-[16px] md:text-[18px] font-black text-slate-900 leading-tight">{item.product_name}</p>
                    <p className="text-[13px] md:text-[15px] font-extrabold mt-2 italic text-blue-600">כמות: {item.qty}</p>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
        <div className="p-10 border-t border-slate-100 bg-white">
           <button disabled={cart.length === 0} onClick={() => {setShowSummary(true); setIsSidebarOpen(false);}} className="w-full bg-slate-950 disabled:bg-slate-300 text-white py-6 md:py-8 rounded-[30px] md:rounded-[40px] font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-5 text-xl md:text-2xl italic active:scale-95 uppercase">סגור הזמנה לביצוע 🦾</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white overflow-hidden lg:rounded-r-[70px]">
        <header className="h-24 md:h-32 border-b border-slate-100 px-6 md:px-20 flex items-center justify-between bg-white/95 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-4 md:gap-10">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-4 bg-slate-50 rounded-2xl relative shadow-sm active:scale-90">
              <Menu size={28} />
              {cart.length > 0 && <span className="absolute -top-1 -left-1 w-6 h-6 bg-blue-600 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">{cart.length}</span>}
            </button>
            <ShieldCheck className="text-emerald-600 hidden md:block" size={48} />
            <div className="text-right">
              <h2 className="text-xl md:text-3xl font-black uppercase italic text-slate-950 leading-none">VIP Executive Arena</h2>
              <div className="text-[10px] md:text-[13px] text-emerald-500 font-black uppercase mt-2.5 tracking-widest flex items-center gap-2 justify-end">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" /> Live Secured Sync
              </div>
            </div>
          </div>
          <SabanLogo size="sm" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-16 space-y-14 md:space-y-20 pb-72 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} key={i} className={`flex gap-3 md:gap-8 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {m.role === 'assistant' && <BotAvatar />}
                <div className={`max-w-[92%] md:max-w-[82%] p-8 md:p-16 rounded-[40px] md:rounded-[70px] shadow-sm border ${m.role === 'user' ? 'bg-white border-slate-200 text-black shadow-xl rounded-tl-none' : 'bg-blue-700/90 backdrop-blur-xl text-white border-blue-800 shadow-blue-400/30 shadow-2xl rounded-tr-none'}`}>
                  <div className={`flex items-center gap-3 mb-8 md:mb-12 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/70'} ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                     <span className="text-[13px] md:text-[15px] font-black uppercase tracking-widest italic">{m.role === 'user' ? 'בר אורניל' : 'Ai-ח.סבן'}</span>
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

        <footer className="p-6 md:p-16 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white/95 pt-36 text-right pointer-events-none">
          <div className="max-w-7xl mx-auto bg-white border-2 border-slate-200 p-4 md:p-6 rounded-[65px] md:rounded-[95px] shadow-[0_50px_100px_-25px_rgba(0,0,0,0.35)] flex items-center gap-4 md:gap-10 ring-[15px] md:ring-[30px] ring-slate-50/50 backdrop-blur-3xl pointer-events-auto transition-all focus-within:ring-blue-100/50">
             <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="בר אחי, מה בונים היום בסטרומה?" className="flex-1 bg-transparent px-6 md:px-14 py-6 md:py-12 outline-none font-black text-[20px] md:text-[32px] text-right text-black placeholder-slate-400" />
             <button onClick={handleSend} disabled={loading} className="w-20 h-20 md:w-32 md:h-32 aspect-square bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center text-white active:scale-90 shadow-2xl transition-all ring-8 md:ring-[15px] ring-blue-100/50"><Send size={38} className="md:size-[64px]" /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}
