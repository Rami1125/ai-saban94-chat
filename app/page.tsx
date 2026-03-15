"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  MessageSquare, LayoutDashboard, ExternalLink, Clock, Users, 
  ShoppingCart, Image as ImageIcon, ChevronRight,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, PlayCircle
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V11.0 - Final Production Edition
 * -------------------------------------------
 * - תיקון גלריה: זיהוי גמיש של [GALLERY:...] בתוך טקסט.
 * - עיצוב: High Contrast + Glassmorphism.
 * - ניהול סל: נוכחי ועתידי.
 */

// --- 1. רכיב גלריית תמונות פרימיום ---
const ProductGallery = ({ urls }: { urls: string[] }) => {
  const [mainUrl, setMainUrl] = useState(urls[0]);

  return (
    <div className="space-y-3 my-5">
      <motion.div 
        key={mainUrl} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="relative h-72 bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden p-6 flex items-center justify-center"
      >
        <img src={mainUrl} className="h-full w-auto object-contain drop-shadow-2xl" alt="Main Product" />
        <div className="absolute top-4 right-4 bg-blue-600/10 backdrop-blur-md p-2 rounded-full shadow-sm">
           <ImageIcon size={16} className="text-blue-600" />
        </div>
      </motion.div>

      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
          {urls.map((url, idx) => (
            <button 
              key={idx} onClick={() => setMainUrl(url)}
              className={`w-20 h-20 rounded-2xl border-2 transition-all overflow-hidden bg-white p-1 shrink-0 shadow-sm ${mainUrl === url ? 'border-blue-600 scale-95 shadow-inner' : 'border-transparent hover:border-slate-200'}`}
            >
              <img src={url} className="w-full h-full object-contain" alt={`Thumb ${idx}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 2. רכיב כפתור WhatsApp ---
const WhatsAppOrderButton = ({ summary }: { summary: string }) => {
  const send = () => {
    const text = encodeURIComponent(`🏗️ *סיכום הזמנה לביצוע - ח. סבן*\n\n${summary.replace(/\[.*?\]/g, '')}\n\n*נשלח מ-Saban OS*`);
    window.open(`https://wa.me/972508860896?text=${text}`, '_blank');
  };
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={send}
      className="w-full mt-4 bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 rounded-[24px] font-black flex items-center justify-center gap-3 shadow-xl border-b-4 border-green-700 transition-all"
    >
      שלח סיכום וסגור ב-WhatsApp
    </motion.button>
  );
};

// --- 3. מפענח טקסט חכם (Smart UI Parser) ---
const SmartMessageRenderer = ({ text, onAddToCart, onAddToFuture }: any) => {
  if (!text) return null;

  const isOrderSummary = text.includes("סיכום הזמנה");
  
  // חילוץ גלריה מהטקסט כולו
  const galleryRegex = /\[GALLERY:\s*(.*?)\]/i;
  const galleryMatch = text.match(galleryRegex);
  const galleryUrls = galleryMatch ? galleryMatch[1].split(',').map(u => u.trim()) : null;
  
  // ניקוי הטקסט מהתג של הגלריה להצגה נקייה
  const cleanText = text.replace(galleryRegex, '').trim();
  const lines = cleanText.split('\n');

  return (
    <div className="space-y-4">
      {/* הצגת גלריה אם נמצאה */}
      {galleryUrls && <ProductGallery urls={galleryUrls} />}

      {lines.map((line, i) => {
        // זיהוי תמונה רגילה
        const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
        if (imgMatch) return <img key={i} src={imgMatch[1]} className="w-full h-56 object-contain rounded-[28px] bg-white border border-slate-200 shadow-md p-4" alt="product" />;

        // זיהוי כפתור הוספה מהירה
        const quickAddMatch = line.match(/\[QUICK_ADD:(.*?)\]/);
        if (quickAddMatch) return (
          <button key={i} onClick={() => onAddToCart(quickAddMatch[1])} className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-[22px] font-black shadow-lg hover:bg-blue-700 transition-all mt-2 active:scale-95">
            <ShoppingCart size={18} /> הוסף {quickAddMatch[1]} לסל
          </button>
        );

        // זיהוי כפתור שמירה לעתיד
        const futureSaveMatch = line.match(/\[FUTURE_SAVE:(.*?)\]/);
        if (futureSaveMatch) return (
          <button key={i} onClick={() => onAddToFuture(futureSaveMatch[1])} className="flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-[22px] font-black shadow-lg hover:bg-orange-600 transition-all mt-2 border-b-4 border-orange-700 active:scale-95">
            <Calendar size={18} /> שמור {futureSaveMatch[1]} לעתיד
          </button>
        );

        // זיהוי כותרות
        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-xl pt-2 flex items-center gap-2 underline decoration-blue-200 decoration-4 underline-offset-8">{line.replace('###', '').trim()}</h3>;
        
        // טקסט רגיל - שחור אטום
        if (line.trim() === "" || line.includes("[")) return null;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[16px] leading-relaxed text-black font-semibold">
            {parts.map((part, j) => part.startsWith('**') ? <strong key={j} className="text-blue-900 font-black">{part.slice(2, -2)}</strong> : part)}
          </p>
        );
      })}

      {isOrderSummary && <WhatsAppOrderButton summary={text} />}
    </div>
  );
};

// --- 4. קומפוננטת האפליקציה ---
export default function SabanOS() {
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [futureCart, setFutureCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sid = localStorage.getItem('saban_session_id') || `sid_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('saban_session_id', sid);
      setSessionId(sid);
      (async () => {
        const { data } = await supabase.from('chat_history').select('*').eq('session_id', sid).order('created_at', { ascending: true });
        if (data && data.length > 0) setMessages(data);
        else setMessages([{ id: 'init', role: 'assistant', content: '### אהלן ראמי הבוס\nהמוח הלוגיסטי חזר לביצוע מלא. **איך מתקדמים עם ההזמנה?** 🦾' }]);
      })();
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAddToCart = async (sku: string, isFuture = false) => {
    const { data: product } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (product) {
      if (isFuture) setFutureCart(prev => [...prev, { ...product, qty: 1 }]);
      else setCart(prev => [...prev, product]);
      toast.success(isFuture ? "נשמר לעתיד" : "התווסף לסל");
    } else {
      toast.error("מק''ט לא נמצא במלאי");
    }
  };

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, timestamp: Date.now() }]);
    } catch (e) { toast.error("תקלה במוח"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar Navigation */}
      <aside className="w-[320px] border-l border-slate-200 bg-white hidden lg:flex flex-col shadow-sm z-30">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="w-12 h-12 bg-blue-700 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-blue-200">
            <Zap size={24} fill="white" />
          </div>
          <div className="text-right">
            <h1 className="font-black text-xl text-slate-900 uppercase italic">Saban OS</h1>
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">V11.0 Stable</p>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-8 scrollbar-hide">
           <section>
             <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><ShoppingCart size={14} /> סל נוכחי ({cart.length})</h4>
             {cart.map((item, idx) => (
               <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 mb-2 flex justify-between items-center shadow-sm">
                  <p className="text-[12px] font-black text-slate-900">{item.product_name}</p>
                  <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
               </div>
             ))}
           </section>
           <section>
             <h4 className="text-[10px] font-black text-orange-500 uppercase mb-4 flex items-center gap-2"><Calendar size={14} /> הזמנה עתידית ({futureCart.length})</h4>
             {futureCart.map((item, idx) => (
               <div key={idx} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 mb-2 flex justify-between items-center shadow-sm">
                  <p className="text-[12px] font-black text-orange-950">{item.product_name}</p>
                  <button onClick={() => setFutureCart(futureCart.filter((_, i) => i !== idx))} className="text-orange-200 hover:text-red-500"><Trash2 size={14}/></button>
               </div>
             ))}
           </section>
        </div>

        <div className="p-6 border-t border-slate-100">
           <button onClick={() => toast.success("מכין סיכום...")} className="w-full bg-slate-950 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
              <CheckCircle size={18} /> סגור הזמנה לביצוע
           </button>
        </div>
      </aside>

      {/* Main Chat Content */}
      <main className="flex-1 flex flex-col relative bg-white overflow-hidden shadow-2xl lg:rounded-r-[45px]">
        <header className="h-20 border-b border-slate-100 px-10 flex items-center justify-between bg-white/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={24} />
            <h2 className="text-base font-black uppercase italic text-slate-950 tracking-tighter">Saban Executive Brain</h2>
          </div>
          <div className="flex gap-4 text-slate-400">
             <Search size={20} className="hover:text-blue-600 cursor-pointer" />
             <Phone size={20} className="hover:text-blue-600 cursor-pointer" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-40 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] p-8 rounded-[42px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-black' : 'bg-blue-700/85 backdrop-blur-md text-white border-blue-800 shadow-blue-200/50 shadow-2xl'
                }`}>
                  <div className={`flex items-center gap-2 mb-4 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/60'}`}>
                     {m.role === 'user' ? <User size={12} /> : <Zap size={12} fill="currentColor" />}
                     <span className="text-[10px] font-black uppercase tracking-widest">{m.role === 'user' ? 'ראמי' : 'המוח'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAddToCart={handleAddToCart} onAddToFuture={(sku: string) => handleAddToCart(sku, true)} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end animate-pulse"><div className="bg-white p-5 rounded-[28px] border border-blue-100 flex items-center gap-3 shadow-md"><Loader2 className="animate-spin text-blue-600" size={20}/><span className="text-[11px] font-black text-blue-700">המוח בונה הצעה...</span></div></div>}
          <div ref={scrollRef} />
        </div>

        {/* Composer */}
        <footer className="p-8 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-20">
          <div className="max-w-4xl mx-auto bg-white border-2 border-slate-200 p-2 rounded-[45px] shadow-2xl flex items-center gap-3 ring-8 ring-slate-50/50">
             <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="כתוב פקודה לביצוע..." className="flex-1 bg-transparent px-8 py-5 outline-none font-black text-[18px] text-right text-black" />
             <button onClick={handleSend} disabled={loading} className="w-16 h-16 bg-blue-700/90 hover:bg-blue-800 rounded-[35px] flex items-center justify-center text-white shadow-lg active:scale-90"><Send size={32} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}
