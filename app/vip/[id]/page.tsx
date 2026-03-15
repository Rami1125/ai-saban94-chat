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
 * Ai-Saban OS V19.0 - Mobile App Simulator Edition
 * -------------------------------------------
 * - Splash Screen: Central logo opening simulation.
 * - Dynamic Greetings: Time-based personalized welcome.
 * - Mobile UI: Perfectly scaled text and components.
 * - Persistent DNA: Syncs with Saban logic/inventory.
 */

const LOGO_PATH = "/ai.png";
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

const VIP_PROFILES: any = {
  "601992": {
    id: "601992",
    name: "בר אורניל",
    fullName: "בר אורניל (אורניל/אבי לוי)",
    project: "סטרומה 4, הרצליה",
    phone: "054-5998111",
    status: "Priority VIP"
  }
};

// --- רכיב Splash Screen ---
const SplashScreen = ({ finishLoading }: { finishLoading: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center overflow-hidden"
    >
      <div className="relative">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "backOut" }}
          onAnimationComplete={() => setTimeout(finishLoading, 1500)}
          className="w-40 h-40 md:w-56 md:h-56 bg-white rounded-[40px] shadow-[0_0_100px_rgba(255,255,255,0.2)] flex items-center justify-center p-6 ring-4 ring-blue-500/30"
        >
          <img src={LOGO_PATH} alt="Saban" className="w-full h-full object-contain" />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-16 left-0 right-0 text-center"
        >
          <h2 className="text-white font-black tracking-[0.4em] uppercase text-sm">Ai-ח.סבן</h2>
          <div className="mt-4 flex justify-center gap-1">
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function VipAppPortal() {
  const { id } = useParams();
  const [showSplash, setShowSplash] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- גילוי מכשיר ---
  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 1024);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // --- לוגיקת ברכה אישית לפי זמן ---
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "בוקר טוב";
    if (hour < 17) return "צהריים טובים";
    if (hour < 21) return "ערב טוב";
    return "לילה טוב";
  }, []);

  useEffect(() => {
    if (id && VIP_PROFILES[id as string]) {
      const profile = VIP_PROFILES[id as string];
      setClient(profile);
    }
  }, [id]);

  // אתחול צ'אט לאחר הספלאש
  const handleAppStart = () => {
    setShowSplash(false);
    if (client) {
      setMessages([{ 
        role: 'assistant', 
        content: `### ${getGreeting}, ${client.name} אחי 🦾\nהמוח של ח. סבן מחובר לביצוע ב**${client.project}**. המשאית מוכנה להעמסה. **מה נבצע היום?**` 
      }]);
    }
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAction = async (sku: string, qty = 1) => {
    let { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (p) {
      setCart(prev => {
        const ex = prev.find(i => i.sku === p?.sku);
        if (ex) return prev.map(i => i.sku === p?.sku ? {...i, qty} : i);
        return [...prev, {...p, qty}];
      });
      toast.success(`${p.product_name} נוסף לסל`, { position: "top-center" });
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
    } catch (e) { toast.error("ניתוק מהשרת"); } finally { setLoading(false); }
  };

  if (!client) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden select-none" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      <AnimatePresence>{showSplash && <SplashScreen finishLoading={handleAppStart} />}</AnimatePresence>

      {/* --- Mobile Cart Drawer --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white z-[110] shadow-2xl flex flex-col lg:hidden">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-blue-700 italic">סל הביצוע שלי</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white rounded-xl shadow-sm border"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.map(item => (
                  <div key={item.sku} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div className="text-right">
                      <p className="font-black text-sm">{item.product_name}</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">כמות: {item.qty}</p>
                    </div>
                    <button onClick={() => setCart(cart.filter(c => c.sku !== item.sku))} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-center text-xs text-slate-400 py-10">הסל ריק - מחכה לפקודה</p>}
              </div>
              <div className="p-4 border-t">
                <button onClick={() => {setShowSummary(true); setIsSidebarOpen(false);}} disabled={cart.length === 0} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg disabled:opacity-30">סיכום לביצוע 🦾</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- Main App Layout --- */}
      <main className="flex-1 flex flex-col relative bg-white">
        
        {/* App Header */}
        <header className="h-16 md:h-20 border-b border-slate-100 flex items-center justify-between px-4 md:px-8 bg-white/90 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-50 rounded-xl relative hover:scale-105 active:scale-95 transition-all">
              <Menu size={22} />
              {cart.length > 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">{cart.length}</span>}
            </button>
            <div className="text-right">
              <h2 className="text-sm md:text-lg font-black text-slate-900 leading-none">VIP Agent</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] md:text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Live secured sync</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-lg border p-1.5 ring-2 ring-blue-50 overflow-hidden">
               <img src={LOGO_PATH} alt="Saban" className="w-full h-full object-contain" />
            </div>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-32 scrollbar-hide bg-[#FDFDFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                key={i} 
                className={`flex gap-3 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden border bg-white flex-shrink-0 mt-1 shadow-sm">
                    <img src={LOGO_PATH} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[88%] md:max-w-[75%] p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border ${
                  m.role === 'user' 
                  ? 'bg-white border-slate-200 text-black shadow-md' 
                  : 'bg-blue-600 text-white border-blue-500 shadow-blue-100 shadow-lg'
                }`}>
                  <div className={`flex items-center gap-2 mb-3 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/70'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{m.role === 'user' ? client.name : 'Ai-ח.סבן'}</span>
                  </div>
                  <div className="text-[15px] md:text-[18px] leading-relaxed font-bold text-right">
                    <SmartRenderer text={m.content} onAdd={handleAction} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-end pr-11">
              <div className="bg-white px-4 py-3 rounded-2xl shadow-md border border-blue-50 flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={18}/>
                <span className="text-[11px] font-black text-blue-800 uppercase italic">מעבד פקודה...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Dock */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto bg-white border-2 border-slate-200 p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-2 pointer-events-auto ring-8 ring-slate-50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder={`${client.name}, מה בונים היום?`} 
              className="flex-1 bg-transparent px-4 py-3 md:py-5 outline-none font-black text-[15px] md:text-[22px] text-right" 
            />
            <button 
              onClick={handleSend} disabled={loading}
              className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
            >
              <Send size={24} />
            </button>
          </div>
        </footer>
      </main>

      {/* Order Summary Modal */}
      <AnimatePresence>
        {showSummary && <SummaryModal cart={cart} client={client} onClose={() => setShowSummary(false)} />}
      </AnimatePresence>
    </div>
  );
}

// --- מפענח טקסט חכם ---
function SmartRenderer({ text, onAdd }: any) {
  const galleryRegex = /\[GALLERY:\s*([\s\S]*?)\]/i;
  const gMatch = text.match(galleryRegex);
  const urls = gMatch ? gMatch[1].split(',').map((u:any) => u.trim()) : null;
  const clean = text.replace(galleryRegex, '').replace(/\[QUICK_ADD:.*?\]/g, '').trim();
  const lines = clean.split('\n');

  return (
    <div className="space-y-4">
      {urls && (
        <div className="space-y-2 mb-4">
          <div className="h-44 md:h-64 bg-white rounded-2xl overflow-hidden border shadow-inner flex items-center justify-center">
             <img src={urls[0]} className="h-full object-contain" alt="prod" />
          </div>
        </div>
      )}
      {lines.map((line:any, i:any) => {
        if (line.startsWith('###')) return <h3 key={i} className="text-lg md:text-2xl font-black underline decoration-blue-500/50 decoration-4 underline-offset-4 mt-4 text-right">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-right leading-relaxed">
            {parts.map((p:any, j:any) => p.startsWith('**') ? <span key={j} className="text-blue-300 font-black">{p.slice(2, -2)}</span> : p)}
          </p>
        );
      })}
      {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
        <button key={i} onClick={() => onAdd(match[1])} className="w-full bg-white text-blue-700 py-4 rounded-xl font-black border-2 border-white shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm mt-4 active:scale-95">
          <ShoppingCart size={18} /> הוסף {match[1]} לסל לביצוע
        </button>
      ))}
    </div>
  );
}

// --- מודאל סיכום הזמנה ---
function SummaryModal({ cart, client, onClose }: any) {
  const handleShare = () => {
    new Audio(SUCCESS_SOUND).play().catch(() => {});
    const items = cart.map((item:any, i:any) => `• *${item.product_name}* | כמות: ${item.qty}`).join('\n');
    const text = encodeURIComponent(
      `🏗️ *אישור הזמנה לביצוע - ח. סבן*\n` +
      `-----------------------------------\n` +
      `👤 *לקוח:* ${client.fullName}\n` +
      `🏗️ *פרויקט:* ${client.project}\n\n` +
      `*פריטים בסל:*\n${items}\n\n` +
      `*נוצר ע"י השותף הדיגיטלי Ai-ח.סבן* 🦾`
    );
    window.open(`https://wa.me/972508860896?text=${text}`, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, y: 30 }} className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <h2 className="font-black italic uppercase">סידור עבודה</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X /></button>
        </div>
        <div className="p-6 space-y-6 text-right">
          <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
            {cart.map((item:any, i:any) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border">
                 <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs">{item.qty}</span>
                 <p className="font-bold text-sm">{item.product_name}</p>
              </div>
            ))}
          </div>
          <button onClick={handleShare} className="w-full bg-[#25D366] text-white py-5 rounded-[22px] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
            <Share2 size={24} /> אשר ושלח לווצאפ
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
