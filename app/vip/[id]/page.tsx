"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight, Menu,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, Map, Navigation, 
  MousePointerClick, Save, PlayCircle, X, Share2, Volume2, Info, AlertTriangle, Smartphone, Monitor, Clock
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ai-Saban OS V20.0 - VIP Mobile App Elite
 * -------------------------------------------
 * - Splash Screen: Real app start simulation.
 * - Device Detection: Fixed typography for mobile.
 * - Dynamic Logic: Time-based greetings & DNA sync.
 * - Events: Enter for Desktop, Touch for Mobile.
 */

const LOGO_PATH = "/ai.png";
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

const VIP_PROFILES: any = {
  "601992": {
    id: "601992",
    name: "בר אורניל",
    fullName: "בר אורניל (אורניל/אבי לוי)",
    project: "סטרומה 4, הרצליה",
    phone: "054-5998111"
  }
};

// --- רכיב Splash Screen - פתיחה ויזואלית ---
const AppSplash = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
  >
    <motion.div
      initial={{ scale: 0.1, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 100 }}
      className="w-48 h-48 bg-white rounded-[50px] shadow-[0_0_80px_rgba(255,255,255,0.15)] flex items-center justify-center p-6 relative"
    >
      <img src={LOGO_PATH} alt="Saban" className="w-full h-full object-contain" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-0 bg-blue-500/10 rounded-[50px]"
      />
    </motion.div>
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="mt-12 flex flex-col items-center"
    >
      <h1 className="text-white font-black text-2xl tracking-[0.3em] italic">Ai-ח.סבן</h1>
      <div className="mt-4 flex gap-1.5">
        {[0, 0.2, 0.4].map((d, i) => (
          <motion.div 
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: d }}
            className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
          />
        ))}
      </div>
    </motion.div>
  </motion.div>
);

export default function VipMobileApp() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const client = useMemo(() => VIP_PROFILES[id as string], [id]);

  // זיהוי מכשיר ומימדים
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    setTimeout(() => setLoading(false), 2800); // משך ה-Splash
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // ברכה אישית לפי זמן
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "בוקר טוב";
    if (h < 17) return "צהריים טובים";
    return "ערב טוב";
  }, []);

  useEffect(() => {
    if (!loading && client) {
      setMessages([{ 
        role: 'assistant', 
        content: `### ${greeting}, ${client.name} אחי 🦾\nהמערכת מזהה אותך ב**${client.project}**. הכל מוכן להעמסה לביצוע. **מה נשלח היום?**` 
      }]);
    }
  }, [loading, client]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isBotTyping]);

  const handleAction = async (sku: string, qty = 1) => {
    let { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (p) {
      setCart(prev => {
        const ex = prev.find(i => i.sku === p?.sku);
        if (ex) return prev.map(i => i.sku === p?.sku ? {...i, qty} : i);
        return [...prev, {...p, qty}];
      });
      toast.success(`${p.product_name} בסל`, { position: "top-center" });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isBotTyping) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsBotTyping(true);

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: `app_vip_${id}`, query: q, history: messages.slice(-4) })
      });
      const data = await res.json();
      
      const qMatch = data.answer.match(/\[SET_QTY:(.*?):(.*?)\]/);
      if (qMatch) handleAction(qMatch[1], parseInt(qMatch[2]));
      
      const aMatch = data.answer.match(/\[QUICK_ADD:(.*?)\]/);
      if (aMatch) handleAction(aMatch[1]);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("תקלה במוח"); } finally { setIsBotTyping(false); }
  };

  if (!client) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white italic font-black">זיהוי מזהה לקוח...</div>;

  return (
    <div className="flex h-[100dvh] bg-[#F1F3F5] text-slate-900 font-sans overflow-hidden select-none" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      <AnimatePresence>{loading && <AppSplash onComplete={() => setLoading(false)} />}</AnimatePresence>

      {/* Mobile Drawer (Cart) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] lg:hidden" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25 }} className="fixed inset-y-0 right-0 w-[85%] bg-white z-[110] shadow-2xl flex flex-col lg:hidden rounded-l-[40px]">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50 rounded-tl-[40px]">
                <div className="text-right">
                  <h3 className="font-black text-blue-700 italic">הסל שלי</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{client.project}</p>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white rounded-2xl shadow-sm border"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map(item => (
                  <div key={item.sku} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center group">
                    <button onClick={() => setCart(cart.filter(c => c.sku !== item.sku))} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                    <div className="text-right">
                      <p className="font-black text-[13px] leading-tight text-slate-800">{item.product_name}</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">כמות: {item.qty}</p>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <div className="text-center py-20 opacity-20 italic font-black text-sm uppercase tracking-widest">אין פריטים בסל</div>}
              </div>
              <div className="p-6 border-t bg-white rounded-bl-[40px]">
                <button onClick={() => {setShowSummary(true); setIsSidebarOpen(false);}} disabled={cart.length === 0} className="w-full bg-slate-900 text-white py-5 rounded-[22px] font-black shadow-xl disabled:opacity-30 active:scale-95 transition-all">סגור הזמנה לביצוע 🦾</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main App Canvas */}
      <main className="flex-1 flex flex-col relative bg-white lg:max-w-4xl lg:mx-auto lg:shadow-[0_0_100px_rgba(0,0,0,0.05)]">
        
        {/* Navigation Header */}
        <header className="h-16 md:h-20 border-b border-slate-100 flex items-center justify-between px-5 md:px-10 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-50 rounded-2xl relative active:scale-90 transition-transform">
              <Menu size={22} className="text-slate-700" />
              {cart.length > 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">{cart.length}</span>}
            </button>
            <div className="text-right">
              <h2 className="text-sm font-black text-slate-950 leading-none">VIP Portal</h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">Secured AI Sync</span>
              </div>
            </div>
          </div>

          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg border p-1.5 ring-2 ring-blue-50 overflow-hidden">
             <img src={LOGO_PATH} alt="Saban" className="w-full h-full object-contain" />
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-40 scrollbar-hide bg-[#FDFDFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden border bg-white flex-shrink-0 mt-1 shadow-sm ring-1 ring-slate-100">
                    <img src={LOGO_PATH} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[88%] p-4 md:p-6 rounded-[28px] shadow-sm border ${
                  m.role === 'user' 
                  ? 'bg-white border-slate-200 text-slate-900 rounded-tr-none' 
                  : 'bg-blue-600 text-white border-blue-500 shadow-blue-100 shadow-xl rounded-tl-none'
                }`}>
                  <div className={`flex items-center gap-2 mb-2 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/70'}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest">{m.role === 'user' ? client.name : 'Ai-ח.סבן'}</span>
                  </div>
                  <div className="text-[15px] md:text-[17px] leading-relaxed font-bold text-right">
                    <SmartAppRenderer text={m.content} onAdd={handleAction} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isBotTyping && (
            <div className="flex justify-end pr-11">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity }} className="bg-white px-4 py-2.5 rounded-2xl shadow-md border border-blue-50 flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={16}/>
                <span className="text-[10px] font-black text-blue-800 uppercase italic">המוח מעבד...</span>
              </motion.div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Docking Station */}
        <footer className="fixed bottom-0 left-0 right-0 p-5 lg:relative lg:p-10 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto bg-white border-2 border-slate-100 p-2 rounded-[30px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] flex items-center gap-2 pointer-events-auto ring-8 ring-slate-50/50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder={`${client.name}, מה בונים היום?`} 
              className="flex-1 bg-transparent px-5 py-4 outline-none font-black text-[16px] text-right text-slate-900 placeholder-slate-300 italic" 
            />
            <button 
              onClick={handleSend} disabled={isBotTyping}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-[22px] flex items-center justify-center text-white active:scale-90 transition-all shadow-lg"
            >
              <Send size={24} />
            </button>
          </div>
        </footer>
      </main>

      {/* Full Order Summary Overlay */}
      <AnimatePresence>
        {showSummary && <AppSummaryModal cart={cart} client={client} onClose={() => setShowSummary(false)} />}
      </AnimatePresence>
    </div>
  );
}

// --- מפענח טקסט אפליקטיבי ---
function SmartAppRenderer({ text, onAdd }: any) {
  const galleryRegex = /\[GALLERY:\s*([\s\S]*?)\]/i;
  const gMatch = text.match(galleryRegex);
  const urls = gMatch ? gMatch[1].split(',').map((u:any) => u.trim()) : null;
  const clean = text.replace(galleryRegex, '').replace(/\[QUICK_ADD:.*?\]/g, '').trim();
  const lines = clean.split('\n');

  return (
    <div className="space-y-4">
      {urls && (
        <div className="space-y-2 mb-4">
          <div className="h-44 md:h-56 bg-white rounded-3xl overflow-hidden border shadow-inner flex items-center justify-center ring-4 ring-white/10">
             <img src={urls[0]} className="h-full object-contain p-2" alt="prod" />
          </div>
        </div>
      )}
      {lines.map((line:any, i:any) => {
        if (line.startsWith('###')) return <h3 key={i} className="text-lg md:text-xl font-black underline decoration-blue-400/30 decoration-4 underline-offset-4 mt-4 text-right italic">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-right leading-relaxed text-[15px] md:text-[16px]">
            {parts.map((p:any, j:any) => p.startsWith('**') ? <span key={j} className="text-blue-300 md:text-blue-200 font-black">{p.slice(2, -2)}</span> : p)}
          </p>
        );
      })}
      {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
        <button key={i} onClick={() => onAdd(match[1])} className="w-full bg-white text-blue-700 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-3 text-sm mt-4 active:scale-95 border border-blue-50">
          <ShoppingCart size={18} /> הוסף {match[1]} לסל לביצוע
        </button>
      ))}
    </div>
  );
}

// --- מודאל סיכום אפליקטיבי ---
function AppSummaryModal({ cart, client, onClose }: any) {
  const handleShare = () => {
    new Audio(SUCCESS_SOUND).play().catch(() => {});
    const items = cart.map((item:any, i:any) => `• *${item.product_name}* | כמות: ${item.qty}`).join('\n');
    const text = encodeURIComponent(
      `🏗️ *סידור עבודה - Ai-ח.סבן*\n` +
      `-----------------------------------\n` +
      `👤 *לקוח:* ${client.fullName}\n` +
      `🏗️ *פרויקט:* ${client.project}\n\n` +
      `*פריטים בסל:*\n${items}\n\n` +
      `*הנחיות:* נא לאשר העמסה לבוקר. 🦾\n` +
      `-----------------------------------\n` +
      `_נוצר ע"י השותף הדיגיטלי של בר_`
    );
    window.open(`https://wa.me/972508860896?text=${text}`, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[45px] w-full max-w-lg overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
          <div className="text-right z-10">
            <h2 className="font-black italic uppercase text-2xl">סיכום ביצוע</h2>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Ready for Dispatch</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/10 rounded-2xl z-10 transition-colors hover:bg-white/20"><X /></button>
        </div>
        <div className="p-8 space-y-6 text-right">
          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {cart.map((item:any, i:any) => (
              <div key={i} className="p-5 bg-slate-50 rounded-[28px] flex justify-between items-center border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                 <span className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md shadow-blue-200">{item.qty}</span>
                 <p className="font-black text-slate-800 text-[14px] leading-tight flex-1 mr-4">{item.product_name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleShare} className="w-full bg-[#25D366] text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(37,211,102,0.3)] border-b-8 border-green-700 active:scale-95 transition-all">
            <Share2 size={26} /> אשר ושלח לווצאפ
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
