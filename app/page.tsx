"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  MessageSquare, LayoutDashboard, ExternalLink, Clock, Users, 
  ShoppingCart, Image as ImageIcon, ChevronRight,
  Plus, Minus, Tag, Trash2, CheckCircle, Calendar, Save
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V11.5 - Live Cart & Logic Sync
 * -------------------------------------------
 * - סנכרון סל בזמן אמת מהצ'אט.
 * - אפקטים ויזואליים בשינוי כמויות.
 * - זיהוי פקודות חכם: [QUICK_ADD], [SET_QTY].
 */

// --- 1. רכיב פריט בסל עם אנימציה בשינוי ---
const CartItem = ({ item, onRemove, onUpdateQty, isFuture = false }: any) => {
  return (
    <motion.div 
      layout
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`p-4 rounded-2xl border mb-2 flex justify-between items-center shadow-sm transition-colors ${
        isFuture ? 'bg-orange-50/60 border-orange-100' : 'bg-white border-slate-100'
      }`}
    >
      <div className="text-right flex-1">
        <p className={`text-[12px] font-black leading-tight ${isFuture ? 'text-orange-950' : 'text-slate-900'}`}>
          {item.product_name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[10px] text-blue-600 font-bold">₪{item.price || 0}</p>
          <span className="text-[10px] text-slate-300">|</span>
          <motion.p 
            key={item.qty}
            initial={{ scale: 1.5, color: "#2563eb" }}
            animate={{ scale: 1, color: isFuture ? "#ea580c" : "#1e293b" }}
            className="text-[11px] font-black"
          >
            כמות: {item.qty || 1}
          </motion.p>
        </div>
      </div>
      
      <div className="flex flex-col gap-1 items-end mr-2">
        <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors p-1">
          <Trash2 size={14}/>
        </button>
      </div>
    </motion.div>
  );
};
// --- 1. כפתור WhatsApp ---
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
      שלח סיכום ל-WhatsApp מחלקת הזמנות
    </motion.button>
  );
};

// --- 2. מפענח הודעות חכם ---
const SmartMessageRenderer = ({ text, onAddToCart, onSetQty, onAddToFuture }: any) => {
  if (!text) return null;

  // חילוץ גלריה
  const galleryRegex = /\[GALLERY:\s*(.*?)\]/i;
  const galleryMatch = text.match(galleryRegex);
  const galleryUrls = galleryMatch ? galleryMatch[1].split(',').map(u => u.trim()) : null;
  
  const cleanText = text.replace(galleryRegex, '').trim();
  const lines = cleanText.split('\n');

  return (
    <div className="space-y-4">
      {galleryUrls && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide my-4">
          {galleryUrls.map((url, idx) => (
            <img key={idx} src={url} className="w-40 h-40 object-contain rounded-2xl bg-white border shadow-sm shrink-0 p-2" />
          ))}
        </div>
      )}

      {lines.map((line, i) => {
        // זיהוי פקודות סל (מוסתרות מהטקסט)
        if (line.includes("[SET_QTY:") || line.includes("[QUICK_ADD:")) return null;

        if (line.trim().startsWith('###')) return <h3 key={i} className="text-blue-700 font-black text-xl pt-2 border-r-4 border-blue-500 pr-3">{line.replace('###', '').trim()}</h3>;
        
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[16px] leading-relaxed text-black font-semibold">
            {parts.map((part, j) => part.startsWith('**') ? <strong key={j} className="text-blue-900 font-black">{part.slice(2, -2)}</strong> : part)}
          </p>
        );
      })}

      {/* כפתורי הנעה לפעולה ירוקו מוצגים רק אם המוח ביקש סיכום */}
      {text.includes("### 📋 סיכום") && (
        <button className="w-full bg-[#25D366] text-white py-4 rounded-[22px] font-black shadow-xl border-b-4 border-green-700 active:scale-95 transition-all">
          שלח סיכום לווצאפ של ראמי 🦾
        </button>
      )}
    </div>
  );
};

// --- 3. קומפוננטת האפליקציה המרכזית ---
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
        else setMessages([{ id: 'init', role: 'assistant', content: '### תרצה לשאול על מוצר או לבצע הזמנה? Ai-היי!👋 אני היועץ ח.סבן🤖** ' }]);
      })();
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, cart]);

  // לוגיקת עדכון סל חכם
  const updateCartQty = (sku: string, qty: number, isFuture = false) => {
    const targetCart = isFuture ? futureCart : cart;
    const setTargetCart = isFuture ? setFutureCart : setCart;

    setTargetCart(prev => prev.map(item => 
      item.sku === sku ? { ...item, qty: qty } : item
    ));
    toast.info(`עודכנה כמות ל-${qty} עבור ${sku}`);
  };

  const addToCart = async (sku: string, qty = 1, isFuture = false) => {
    const { data: product } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (product) {
      const targetCart = isFuture ? futureCart : cart;
      const setTargetCart = isFuture ? setFutureCart : setCart;
      
      const exists = targetCart.find(i => i.sku === sku);
      if (exists) {
        updateCartQty(sku, qty, isFuture);
      } else {
        setTargetCart(prev => [...prev, { ...product, qty }]);
        toast.success(`נוסף לסל: ${product.product_name}`);
      }
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
      
      // ניתוח פקודות שקטות מה-AI לשינוי סל
      const setQtyMatch = data.answer.match(/\[SET_QTY:(.*?):(.*?)\]/);
      if (setQtyMatch) {
        updateCartQty(setQtyMatch[1], parseInt(setQtyMatch[2]));
      }

      const addMatch = data.answer.match(/\[QUICK_ADD:(.*?)\]/);
      if (addMatch) {
        addToCart(addMatch[1]);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("תקלה במוח"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar - הסל הדינאמי */}
      <aside className="w-[320px] border-l border-slate-200 bg-white hidden lg:flex flex-col shadow-sm z-30">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <motion.div animate={{ rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-12 h-12 bg-blue-700 rounded-[22px] flex items-center justify-center text-white shadow-xl">
            <Zap size={24} fill="white" />
          </motion.div>
          <div className="text-right">
            <h1 className="font-black text-xl text-slate-900 uppercase">Saban OS</h1>
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Live Sync V11.5</p>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-8 bg-slate-50/20 scrollbar-hide">
           {/* סעיף סל נוכחי */}
           <section>
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ShoppingCart size={14} className="text-blue-600" /> סל הזמנה ({cart.length})
               </h4>
             </div>
             <AnimatePresence mode="popLayout">
               {cart.map((item, idx) => (
                 <CartItem key={item.sku} item={item} onRemove={() => setCart(cart.filter(i => i.sku !== item.sku))} />
               ))}
             </AnimatePresence>
             {cart.length === 0 && <p className="text-center text-[10px] text-slate-300 italic py-4">הסל ריק</p>}
           </section>

           {/* סעיף עתידי */}
           <section>
             <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Calendar size={14} /> הזמנה עתידית ({futureCart.length})
             </h4>
             <AnimatePresence mode="popLayout">
               {futureCart.map((item) => (
                 <CartItem key={item.sku} item={item} isFuture onRemove={() => setFutureCart(futureCart.filter(i => i.sku !== item.sku))} />
               ))}
             </AnimatePresence>
           </section>
        </div>

        <div className="p-6 border-t border-slate-100">
           <button onClick={() => toast.success("מעבד הזמנה...")} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
              <CheckCircle size={18} /> סגור הזמנה לביצוע
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-white overflow-hidden shadow-2xl lg:rounded-r-[45px]">
        <header className="h-20 border-b border-slate-100 px-10 flex items-center justify-between bg-white/90 backdrop-blur-md z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={24} />
            <h2 className="text-base font-black uppercase italic text-slate-950">צ'אט עם ח.סבן-Ai</h2>
          </div>
          <div className="flex gap-4">
             <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Search size={18}/></div>
             <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Phone size={18}/></div>
          </div>
        </header>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-40 scrollbar-hide bg-[#FAFBFC]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] p-8 rounded-[42px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-black' : 'bg-blue-700/85 backdrop-blur-md text-white border-blue-800 shadow-blue-200/40 shadow-2xl'
                }`}>
                  <div className={`flex items-center gap-2 mb-4 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/60'}`}>
                     {m.role === 'user' ? <User size={12} /> : <Zap size={12} fill="currentColor" />}
                     <span className="text-[10px] font-black uppercase tracking-widest">{m.role === 'user' ? 'ראמי' : 'המוח'}</span>
                  </div>
                  <SmartMessageRenderer 
                    text={m.content} 
                    onAddToCart={addToCart} 
                    onSetQty={updateCartQty}
                    onAddToFuture={(sku: string) => addToCart(sku, 1, true)} 
                  />
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
             <button onClick={handleSend} disabled={loading} className="w-16 h-16 bg-blue-700/90 hover:bg-blue-800 rounded-[35px] flex items-center justify-center text-white transition-all active:scale-90 shadow-lg shadow-blue-300"><Send size={32} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}
