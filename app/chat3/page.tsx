"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Zap, Phone, Search, Loader2, Sparkles, User, ShieldCheck, 
  MessageSquare, LayoutDashboard, ExternalLink, Clock, Users, 
  CheckCircle2, ShoppingCart, Image as ImageIcon, ChevronRight,
  Plus, Minus, Package, Tag, Info
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V10.4 - Semi-Transparent UI Edition
 * -------------------------------------------
 * שליטה בשקיפות: 
 * - bg-blue-700/80 : רקע כחול ב-80% אטימות
 * - shadow-blue-200/40 : צל כחול ב-40% אטימות
 */

// --- 1. רכיב כרטיס מוצר מעוצב ---
const DesignedProductCard = ({ product }: { product: any }) => {
  const [qty, setQty] = useState(1);
  if (!product) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white/60 backdrop-blur-xl border border-white/40 rounded-[32px] overflow-hidden shadow-2xl shadow-blue-900/10 my-6 group"
    >
      <div className="relative h-52 bg-white/80 p-6 flex items-center justify-center border-b border-slate-100">
        <img 
          src={product.image_url || "https://ai-saban94-chat.vercel.app/placeholder.svg"} 
          className="h-full w-auto object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" 
          alt={product.product_name} 
        />
        <div className="absolute top-5 left-5 bg-blue-700/90 backdrop-blur-sm text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl">
          {product.packaging || 'יחידה'}
        </div>
      </div>

      <div className="p-7 space-y-5 text-right">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-slate-950 leading-tight">{product.product_name}</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5 justify-end">
              מק"ט: {product.sku} <Tag size={12} />
            </p>
          </div>
          <div className="text-left">
             <p className="text-2xl font-black text-blue-800 leading-none">₪{product.price || '---'}</p>
             <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase">Excl. VAT</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-200/50">
          <div className="flex items-center gap-3 bg-white rounded-xl p-1.5 shadow-sm">
             <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-700 transition-colors"><Minus size={18}/></button>
             <span className="text-base font-black text-slate-950 w-6 text-center">{qty}</span>
             <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-700 transition-colors"><Plus size={18}/></button>
          </div>
          <button className="flex-1 bg-blue-700/90 hover:bg-blue-800 text-white h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg shadow-blue-200/40">
             <ShoppingCart size={18} /> הוסף להזמנה
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- 2. כפתור WhatsApp ---
const WhatsAppOrderButton = ({ summary }: { summary: string }) => {
  const send = () => {
    const text = encodeURIComponent(`🏗️ *סיכום הזמנה לביצוע - ח. סבן*\n\n${summary}\n\n*נשלח מהמוח הלוגיסטי*`);
    window.open(`https://wa.me/972508860896?text=${text}`, '_blank');
  };
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={send}
      className="w-full mt-4 bg-[#25D366]/90 backdrop-blur-sm hover:bg-[#20ba5a] text-white py-4 rounded-[24px] font-black flex items-center justify-center gap-3 shadow-xl border-b-4 border-green-700 transition-all"
    >
      שלח סיכום ל-WhatsApp של ראמי
    </motion.button>
  );
};

// --- 3. מפענח טקסט וכרטיסים ---
const SmartMessageRenderer = ({ text, productData }: { text: string, productData?: any }) => {
  const lines = text.split('\n');
  const isOrderSummary = text.includes("סיכום הזמנה");

  return (
    <div className="space-y-4">
      {productData && <DesignedProductCard product={productData} />}

      {lines.map((line, i) => {
        const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
        if (imgMatch) {
          return (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <img src={imgMatch[1]} alt="Product" className="w-full h-56 object-contain rounded-[28px] bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md p-4" />
            </motion.div>
          );
        }

        if (line.trim().startsWith('###')) {
          return (
            <h3 key={i} className="text-blue-800 font-black text-lg pt-2 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
              {line.replace('###', '').trim()}
            </h3>
          );
        }

        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[15.5px] leading-relaxed text-slate-950 font-medium">
            {parts.map((part, j) => 
              part.startsWith('**') 
                ? <strong key={j} className="text-black font-black underline decoration-blue-500/30 underline-offset-4">{part.slice(2, -2)}</strong> 
                : part
            )}
          </p>
        );
      })}
      {isOrderSummary && <WhatsAppOrderButton summary={text} />}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'chat' | 'monitor'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sid = localStorage.getItem('saban_session_id') || `sid_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('saban_session_id', sid);
      setSessionId(sid);

      const loadHistory = async () => {
        const { data } = await supabase.from('chat_history').select('*').eq('session_id', sid).order('created_at', { ascending: true });
        if (data) setMessages(data);
        else setMessages([{ id: 'init', role: 'assistant', content: '### אהלן ראמי הבוס\nהמוח הלוגיסטי מחובר ומחכה לפקודה. **מה נבצע היום?** 🦾' }]);
      };
      loadHistory();
    }
    
    const sub = supabase.channel('global').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_history' }, () => {
      if (view === 'monitor') fetchMonitor();
    }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [view]);

  const fetchMonitor = async () => {
    const { data } = await supabase.from('chat_history').select('*').order('created_at', { ascending: false });
    if (data) {
      const grouped = data.reduce((acc: any, m: any) => {
        if (!acc[m.session_id]) acc[m.session_id] = [];
        acc[m.session_id].push(m);
        return acc;
      }, {});
      setAllSessions(Object.entries(grouped));
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q, timestamp: Date.now() }]);
    setLoading(true);

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, query: q, history: messages.slice(-5) })
      });
      const data = await res.json();
      
      let fetchedProduct = data.product || null;
      if (!fetchedProduct && data.answer) {
        const skuMatch = data.answer.match(/[A-Z]{2}-\d{3,5}/);
        if (skuMatch) {
          const { data: dbProduct } = await supabase.from('inventory').select('*').eq('sku', skuMatch[0]).maybeSingle();
          if (dbProduct) fetchedProduct = dbProduct;
        }
      }

      if (data.answer) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.answer, 
          productData: fetchedProduct,
          timestamp: Date.now() 
        }]);
      }
    } catch (e) {
      toast.error("תקלה בחיבור למוח");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans selection:bg-blue-200 overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <aside className="w-[300px] border-l border-slate-200 bg-white hidden lg:flex flex-col shadow-sm z-30">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-700/90 backdrop-blur-sm rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-blue-200/30">
            <Zap size={24} fill="white" />
          </div>
          <div className="text-right">
            <h1 className="font-black text-xl leading-none italic uppercase text-slate-900">Ai-ח.סבן</h1>
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mt-1.5">ברוכים הבאים</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          <button onClick={() => setView('chat')} className={`w-full p-4 rounded-2xl flex items-center gap-3 font-black transition-all ${view === 'chat' ? 'bg-blue-700/90 backdrop-blur-sm text-white shadow-lg shadow-blue-200/40' : 'text-slate-500 hover:bg-slate-50'}`}>
            <MessageSquare size={20} /> צ'אט לקוח
          </button>
          <button onClick={() => { setView('monitor'); fetchMonitor(); }} className={`w-full p-4 rounded-2xl flex items-center gap-3 font-black transition-all ${view === 'monitor' ? 'bg-blue-700/90 backdrop-blur-sm text-white shadow-lg shadow-blue-200/40' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} /> מוניטור הזמנות
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white overflow-hidden shadow-2xl lg:rounded-r-[45px]">
        {view === 'chat' ? (
          <>
            <header className="h-20 border-b border-slate-100 px-10 flex items-center justify-between bg-white/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-600" size={24} />
                <div>
                  <h2 className="text-base font-black uppercase italic tracking-tighter text-slate-950 leading-none">צאט ח.סבן</h2>
                  <div className="text-[10px] text-emerald-600 font-black uppercase mt-1.5 tracking-widest flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />מחובר ...
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-40 scrollbar-hide bg-[#FAFBFC]">
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-8 rounded-[42px] shadow-sm border ${
                      m.role === 'user' 
                        ? 'bg-white border-slate-200 text-slate-950 rounded-tr-none shadow-md' 
                        : 'bg-blue-700/80 backdrop-blur-md text-white border-blue-800/30 rounded-tl-none shadow-blue-200/40 shadow-2xl'
                    }`}>
                      <div className={`flex items-center gap-2 mb-4 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/60'}`}>
                         {m.role === 'user' ? <User size={12} /> : <Zap size={12} fill="currentColor" />}
                         <span className="text-[10px] font-black uppercase tracking-widest">{m.role === 'user' ? 'ראמי' : 'המוח'}</span>
                      </div>
                      <SmartMessageRenderer text={m.content} productData={m.productData} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[32px] border border-blue-100 flex items-center gap-4 shadow-lg shadow-blue-900/5">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                    <span className="text-xs font-black text-blue-800 uppercase tracking-widest italic">המוח בונה הצעה לביצוע...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <footer className="p-8 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-20">
              <div className="max-w-4xl mx-auto bg-white border-2 border-slate-200 p-2.5 rounded-[45px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] flex items-center gap-3 ring-8 ring-slate-50/50 backdrop-blur-md">
                 <input 
                  type="text" value={input} onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="כתוב פקודה לביצוע..." 
                  className="flex-1 bg-transparent px-8 py-5 outline-none font-black text-[17px] text-right text-black placeholder-slate-400" 
                />
                <button 
                  onClick={handleSend} disabled={loading}
                  className="w-16 h-16 bg-blue-700/90 backdrop-blur-sm hover:bg-blue-800 disabled:bg-slate-200 rounded-[35px] flex items-center justify-center text-white transition-all active:scale-90 shadow-xl shadow-blue-300/40"
                >
                  <Send size={30} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden text-right">
            <header className="h-20 bg-white border-b px-10 flex items-center justify-between shadow-sm">
               <h2 className="text-xl font-black text-slate-950 uppercase italic tracking-tighter">Live Monitor</h2>
               <div className="bg-emerald-100 text-emerald-800 px-6 py-2.5 rounded-full text-xs font-black uppercase">{allSessions.length} Active Users</div>
            </header>
            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              {allSessions.map(([sid, msgs]: any) => (
                <div key={sid} className="bg-white border-2 border-slate-100 rounded-[40px] p-8 shadow-xl flex flex-col h-[520px] ring-1 ring-slate-50">
                  <div className="mb-6 pb-6 border-b border-slate-100 font-black text-slate-400 text-[10px] uppercase tracking-widest">ID: {sid.slice(0,12)}</div>
                  <div className="flex-1 overflow-y-auto space-y-5 scrollbar-hide mb-8 pr-1">
                    {msgs.slice(-8).map((m: any, idx: number) => (
                      <div key={idx} className={`p-5 rounded-[24px] text-[13px] font-bold shadow-sm ${m.role === 'user' ? 'bg-slate-100 text-slate-600 border border-slate-100' : 'bg-blue-50/80 text-blue-900 border border-blue-200'}`}>
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setSessionId(sid); setMessages(msgs); setView('chat'); }} className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black shadow-2xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <ExternalLink size={18} /> השתלטות חמה
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
