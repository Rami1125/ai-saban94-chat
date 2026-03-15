"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight, Menu,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, Map, Navigation, 
  MousePointerClick, Save, PlayCircle, X, Share2, Volume2, Info, AlertTriangle, Smartphone, Monitor
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ai-Saban OS V18.0 - Adaptive VIP Suite
 * -------------------------------------------
 * - Device Engine: Real-time detection of Mobile vs Desktop.
 * - Event Layer: Keyboard 'Enter' for mouse, Touch events for mobile.
 * - Persona: Personal Agent for Bar Orenil & VIP Clients.
 * - Branding: High-Contrast Executive Design.
 */

const LOGO_PATH = "/ai.png";
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

const VIP_PROFILES: any = {
  "601992": {
    id: "601992",
    name: "בר אורניל (אורניל/אבי לוי)",
    project: "סטרומה 4, הרצליה",
    phone: "054-5998111",
    status: "Priority VIP",
    insights: { containerDay: 8, lastOrder: "מכולה 8 קוב (82001)" }
  }
};

// --- רכיב לוגו מותאם ---
const SabanLogo = ({ isMobile }: { isMobile: boolean }) => (
  <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'} transition-all`}>
    <div className="relative shrink-0">
      <div className={`${isMobile ? 'w-12 h-12' : 'w-20 h-20'} bg-white rounded-2xl flex items-center justify-center shadow-2xl ring-2 ring-blue-50 overflow-hidden`}>
        <img src={LOGO_PATH} alt="Ai-ח.סבן" className="w-full h-full object-cover" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-md" />
    </div>
    <div className="text-right">
      <h1 className={`${isMobile ? 'text-lg' : 'text-3xl'} font-black text-slate-900 leading-none italic tracking-tighter uppercase`}>Ai-ח.סבן</h1>
      <p className={`${isMobile ? 'text-[7px]' : 'text-[11px]'} font-bold text-blue-600 uppercase tracking-widest mt-1`}>
        {isMobile ? 'Mobile Agent' : 'Executive Logistics Suite'}
      </p>
    </div>
  </div>
);

// --- אווטאר WhatsApp ---
const BotAvatar = () => (
  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100 shadow-md shrink-0 mt-1 ring-2 ring-white bg-white">
    <img src={LOGO_PATH} alt="Bot" className="w-full h-full object-cover" />
  </div>
);

// --- מודאל סיכום הזמנה ---
const OrderSummaryModal = ({ cart, client, onClose, isMobile }: { cart: any[], client: any, onClose: () => void, isMobile: boolean }) => {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <motion.div initial={{ scale: 0.9, y: 30 }} className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="text-right">
            <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black italic uppercase leading-none`}>סידור עבודה</h2>
            <p className="text-blue-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Final Executive Summary</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-xl transition-all"><X size={isMobile ? 24 : 32}/></button>
        </div>
        <div className="p-8 space-y-8 text-right">
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 p-5 rounded-[25px] border border-slate-100 shadow-sm">
                <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md">{item.qty}</span>
                <p className="font-black text-slate-900 text-lg flex-1 mr-4">{item.product_name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleShare} className="w-full bg-[#25D366] text-white py-6 rounded-[35px] font-black text-xl flex items-center justify-center gap-4 shadow-xl border-b-8 border-green-700 active:scale-95 transition-all">
            <Share2 size={28} /> {isMobile ? 'שתף לווצאפ' : 'שתף למחלקת הזמנות'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- מפענח טקסט חסין ---
const SmartMessageRenderer = ({ text, onAdd, isMobile }: any) => {
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
          <div className={`${isMobile ? 'h-48' : 'h-80'} bg-white rounded-[35px] border border-slate-200 shadow-xl overflow-hidden p-4 flex items-center justify-center ring-4 ring-blue-50/50`}>
            <img src={urls[0]} className="h-full object-contain drop-shadow-2xl" alt="Product" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 justify-end">
            {urls.slice(1).map((u, i) => (
              <img key={i} src={u} className="w-16 h-16 rounded-xl border-2 border-slate-100 bg-white p-1 shadow-sm" alt="thumb" />
            ))}
          </div>
        </div>
      )}
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-xl md:text-3xl pt-2 border-r-[6px] border-blue-600 pr-5 my-6 tracking-tighter italic text-right leading-none">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className={`${isMobile ? 'text-[18px]' : 'text-[24px]'} leading-relaxed text-black font-bold text-right`}>
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-900 font-black underline decoration-blue-200 decoration-4 underline-offset-4">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      })}
      {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
        <button key={i} onClick={() => onAdd(match[1])} className="flex items-center gap-4 bg-blue-700 text-white px-8 md:px-12 py-5 md:py-8 rounded-[35px] font-black text-lg md:text-2xl shadow-2xl hover:bg-blue-800 active:scale-95 w-full justify-center ring-8 ring-blue-50/50 transition-all">
          <ShoppingCart size={isMobile ? 24 : 32} /> {isMobile ? 'הוסף לסל' : `הוסף ${match[1]} לסל לביצוע`}
        </button>
      ))}
    </div>
  );
};

export default function AdaptiveVipPortal() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- גילוי סוג מכשיר ומימדים ---
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 1024 || /Mobi|Android/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // --- טעינת פרופיל לקוח ---
  useEffect(() => {
    if (id && VIP_PROFILES[id as string]) {
      const profile = VIP_PROFILES[id as string];
      setClient(profile);
      setMessages([{ 
        role: 'assistant', 
        content: `### אהלן בר אחי 🦾\nהמוח של ח. סבן מחובר לביצוע ב**${profile.project}**. המכולה שלך שם כבר 8 ימים, להכין פינוי? **מה נבצע היום?**` 
      }]);
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

  if (!client) return <div className="h-screen flex items-center justify-center bg-slate-50 font-black italic text-slate-400 animate-pulse">מזהה סוכן VIP...</div>;

  return (
    <div className="flex h-screen bg-[#FAFBFC] text-slate-950 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      <AnimatePresence>{showSummary && <OrderSummaryModal cart={cart} client={client} onClose={() => setShowSummary(false)} isMobile={isMobile} />}</AnimatePresence>
      
      {/* Sidebar / Mobile Drawer Layout */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-full lg:w-[450px] bg-white border-l border-slate-200 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} shadow-2xl`}>
        <div className="p-10 lg:p-16 border-b border-slate-100 flex flex-col items-center gap-8 bg-slate-50/50 relative text-center">
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-8 left-8 p-3 bg-white rounded-2xl shadow-md border border-slate-100 active:scale-90 transition-transform"><X size={28}/></button>
          <SabanLogo isMobile={isMobile} />
          <div className="bg-blue-600 text-white px-8 py-3 rounded-2xl shadow-xl shadow-blue-200 w-full transform -rotate-1">
             <p className="text-[12px] font-black uppercase tracking-tighter italic">פרויקט: {client.project}</p>
          </div>
        </div>
        
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto space-y-10 scrollbar-hide bg-slate-50/30">
           <h4 className="text-[14px] font-black text-blue-700 uppercase mb-8 flex items-center justify-end gap-4 px-2 tracking-[0.3em]">סל ביצוע ({cart.length}) <ShoppingCart size={24}/></h4>
           <AnimatePresence mode="popLayout">
             {cart.map((item) => (
               <motion.div layout initial={{ x: 30, opacity: 0 }} key={item.sku} className="p-6 lg:p-10 bg-white rounded-[35px] lg:rounded-[50px] border border-slate-100 mb-6 shadow-sm flex justify-between items-center group ring-2 ring-black/5 hover:ring-2 ring-blue-100 transition-all">
                  <button onClick={() => setCart(cart.filter(i => i.sku !== item.sku))} className="text-slate-200 group-hover:text-red-500 transition-colors p-3 active:scale-90"><Trash2 size={28}/></button>
                  <div className="text-right flex-1 ml-6">
                    <p className="text-[16px] lg:text-[20px] font-black text-slate-900 leading-tight">{item.product_name}</p>
                    <p className="text-[14px] lg:text-[18px] font-extrabold mt-2 italic text-blue-600">כמות: {item.qty}</p>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>
           {cart.length === 0 && <div className="text-center py-20 opacity-30 italic font-black uppercase tracking-widest">הסל ריק - ממתין לפקודה</div>}
        </div>

        <div className="p-10 border-t border-slate-100 bg-white">
           <button disabled={cart.length === 0} onClick={() => {setShowSummary(true); setIsSidebarOpen(false);}} className="w-full bg-slate-950 disabled:bg-slate-300 text-white py-6 lg:py-10 rounded-[35px] lg:rounded-[50px] font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-6 text-xl lg:text-3xl italic active:scale-95 uppercase tracking-tighter">סגור הזמנה לביצוע 🦾</button>
        </div>
      </aside>

      {/* Main Adaptive Arena */}
      <main className="flex-1 flex flex-col relative bg-white overflow-hidden lg:rounded-r-[80px] shadow-inner">
        <header className="h-28 lg:h-36 border-b border-slate-100 px-8 lg:px-24 flex items-center justify-between bg-white/95 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-6 lg:gap-12">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-5 bg-slate-50 rounded-3xl relative shadow-sm active:scale-90 transition-transform">
              <Menu size={32} />
              {cart.length > 0 && <span className="absolute -top-1 -left-1 w-8 h-8 bg-blue-600 text-white text-[12px] font-black rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">{cart.length}</span>}
            </button>
            <ShieldCheck className="text-emerald-600 hidden lg:block" size={56} />
            <div className="text-right">
              <h2 className="text-2xl lg:text-5xl font-black uppercase italic text-slate-950 leading-none tracking-tighter">VIP Arena</h2>
              <div className="text-[11px] lg:text-[14px] text-emerald-500 font-black uppercase mt-3 tracking-[0.4em] flex items-center gap-3 justify-end leading-none">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" /> 
                {isMobile ? 'Mobile Secured' : 'Live Executive Sync'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {isMobile ? <Smartphone className="text-blue-100" size={24} /> : <Monitor className="text-blue-100" size={40} />}
             <SabanLogo isMobile={isMobile} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-24 space-y-16 lg:space-y-24 pb-80 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} key={i} className={`flex gap-4 lg:gap-10 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {m.role === 'assistant' && <BotAvatar />}
                <div className={`max-w-[94%] lg:max-w-[85%] p-8 lg:p-20 rounded-[45px] lg:rounded-[80px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-black shadow-xl rounded-tl-none' : 'bg-blue-700/90 backdrop-blur-2xl text-white border-blue-800 shadow-blue-400/30 shadow-2xl rounded-tr-none'
                }`}>
                  <div className={`flex items-center gap-4 mb-8 lg:mb-14 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/70'} ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                     <span className="text-[14px] lg:text-[18px] font-black uppercase tracking-[0.5em] italic">{m.role === 'user' ? 'בר אורניל' : 'Ai-ח.סבן'}</span>
                     {m.role === 'user' ? <User size={24} /> : <Zap size={24} fill="currentColor" />}
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} isMobile={isMobile} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-end animate-pulse">
              <div className="bg-white p-12 rounded-[50px] border border-blue-100 shadow-2xl flex items-center gap-10 ring-8 ring-blue-50/50">
                <Loader2 className="animate-spin text-blue-600" size={48}/>
                <span className="text-xl lg:text-3xl font-black text-blue-800 uppercase italic tracking-widest">מחשב נתונים...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Floating Adaptive Input */}
        <footer className="p-6 lg:p-20 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white/95 pt-40 text-right pointer-events-none">
          <div className="max-w-7xl mx-auto bg-white border-2 border-slate-200 p-5 lg:p-8 rounded-[70px] lg:rounded-[110px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.4)] flex items-center gap-6 lg:gap-12 ring-[20px] lg:ring-[40px] ring-slate-50/50 backdrop-blur-3xl pointer-events-auto transition-all focus-within:ring-blue-100/50">
             <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                placeholder={isMobile ? "מה בונים היום?" : "בר אחי, מה בונים היום בסטרומה?"} 
                className="flex-1 bg-transparent px-8 lg:px-16 py-8 lg:py-16 outline-none font-black text-[22px] lg:text-[44px] text-right text-black placeholder-slate-400 italic" 
             />
             <button 
                onClick={handleSend} 
                disabled={loading} 
                className="w-24 h-24 lg:w-44 lg:h-44 aspect-square bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center text-white active:scale-90 shadow-2xl transition-all ring-8 lg:ring-[20px] ring-blue-100/50"
             >
                <Send size={isMobile ? 38 : 72} />
             </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
