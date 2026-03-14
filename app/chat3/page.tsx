"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, Calculator, ShoppingCart, 
  Package, X, Share2, Trash2, Loader2,
  CheckCircle2, MapPin, Info, User
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";

/**
 * Saban OS V8.9.2 - Final Build Fix
 * 1. פתרון שגיאת Hydration (#418) ע"י הסרת new Date() מה-initial state.
 * 2. פתרון שגיאת 400 ע"י התאמת Payload למוח.
 */

// --- רכיב המחשבון הלוגיסטי ---
const ProductActionCard = ({ product, onClose, onAdd }) => {
  const [inputs, setInputs] = useState({ length: "", height: "", waste: "5" });
  
  const calculation = useMemo(() => {
    const l = parseFloat(inputs.length) || 0;
    const h = parseFloat(inputs.height) || 0;
    const wst = parseFloat(inputs.waste) || 5;
    const cov = parseFloat(product?.coverage) || 1.0;
    const area = l * h * (1 + wst / 100);
    const units = Math.ceil(area / cov);
    return { units, area: area.toFixed(2) };
  }, [inputs, product]);

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
      className="bg-slate-900 border border-blue-500/30 rounded-[32px] overflow-hidden shadow-2xl w-full max-w-lg pointer-events-auto"
    >
      <div className="relative h-44 bg-slate-800 flex items-center justify-center">
        {product.image_url ? (
          <img src={product.image_url} className="w-full h-full object-cover opacity-50" alt="" />
        ) : (
          <Package size={48} className="text-slate-700 opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-white/70 hover:text-white backdrop-blur-md">
          <X size={20} />
        </button>
        <div className="absolute bottom-4 right-6 text-right">
          <h3 className="text-xl font-black text-white italic leading-tight uppercase tracking-tighter">{product.product_name}</h3>
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">מק"ט: {product.sku}</p>
        </div>
      </div>

      <div className="p-6 space-y-5 text-right">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 block">אורך (מ')</label>
            <input type="number" value={inputs.length} onChange={e => setInputs({...inputs, length: e.target.value})} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-bold text-right" placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1 block">גובה (מ')</label>
            <input type="number" value={inputs.height} onChange={e => setInputs({...inputs, height: e.target.value})} className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-bold text-right" placeholder="0.00" />
          </div>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="text-right">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">כמות מומלצת</p>
            <p className="text-3xl font-black text-white italic">{calculation.units} <span className="text-sm font-normal text-slate-500">יח'</span></p>
          </div>
          <div className="text-left text-[9px] text-slate-500 font-bold uppercase leading-tight tracking-tighter">שטח: {calculation.area} מ"ר</div>
        </div>
        <button onClick={() => onAdd(product, calculation.units)} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg transition-all"><ShoppingCart size={22} /> הוסף להזמנה</button>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // פתרון Hydration: טעינת הודעה ראשונה רק אחרי Mount
  useEffect(() => {
    setMounted(true);
    setMessages([{ id: 1, role: 'bot', text: 'אהלן ראמי, המוח הלוגיסטי מחובר. מה נבצע היום? 🦾', timestamp: new Date().toLocaleTimeString() }]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeProduct, loading]);

  if (!mounted) return null;

  const fetchInventory = async (query: string) => {
    try {
      const res = await fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data && data.length > 0 ? data[0] : null;
    } catch (err) { return null; }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsgText = input;
    const userMsg = { id: Date.now(), role: 'user', text: userMsgText, timestamp: new Date().toLocaleTimeString() };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const [productFound, { data: schedule }] = await Promise.all([
        fetchInventory(userMsgText),
        supabase.from('saban_dispatch').select('*').limit(10)
      ]);

      // שליחה משופרת למוח עם תמיכה בשני שמות שדות כדי למנוע 400
      const response = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMsgText,
          question: userMsgText, // כפילות לשם בטיחות מול ה-Backend
          context: { inventory: productFound, schedule: schedule || [] },
          history: messages.slice(-5).map(m => ({ role: m.role, content: m.text }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Brain connection failed");
      }

      const result = await response.json();
      const botAnswer = result.answer || result.text || result.content || "הבנתי, בודק...";

      if (productFound) setActiveProduct(productFound);

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: botAnswer, timestamp: new Date().toLocaleTimeString() }]);

    } catch (err: any) {
      console.error("Chat Error:", err);
      toast.error(err.message || "שגיאה בחיבור למוח");
      setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: "ראמי, יש תקלה זמנית בחיבור למוח. אני כאן לביצוע ידני. 🛠️", timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any, units: number) => {
    setCart((prev: any) => [...prev, { ...product, units, orderId: Date.now() }]);
    setActiveProduct(null);
    setMessages((prev: any) => [...prev, { id: Date.now(), role: 'bot', text: `הוספתי ${units} יח' לסל עבור ${product.product_name}. מה עוד? 🦾`, timestamp: new Date().toLocaleTimeString() }]);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-20 flex-col items-center py-8 border-l border-white/5 bg-slate-900/50 gap-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg font-black italic text-white text-xl">S</div>
        <button onClick={() => setShowCart(true)} className="p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-blue-400 relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && <span className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full" />}
        </button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4 text-right">
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Saban OS <span className="text-blue-500">V8.9.2</span></h1>
            <div className="flex items-center gap-2 text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Connected
            </div>
          </div>
          <button onClick={() => setShowCart(!showCart)} className="lg:hidden relative p-3 bg-white/5 rounded-2xl border border-white/5">
            <ShoppingCart size={22} className={cart.length > 0 ? "text-blue-500" : "text-slate-400"} />
            {cart.length > 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">{cart.length}</span>}
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] md:max-w-[65%] p-5 rounded-[28px] shadow-2xl text-right ${
                msg.role === 'user' ? 'bg-slate-800 border border-white/5 text-slate-100 rounded-tr-none' : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[9px] font-bold text-slate-600 mt-2 block uppercase opacity-40">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-500" size={16}/>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic tracking-tighter">Syncing Brain...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Action Layer */}
        <AnimatePresence>
          {activeProduct && (
            <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-md flex items-end justify-center p-4 pb-24 pointer-events-none">
              <ProductActionCard product={activeProduct} onClose={() => setActiveProduct(null)} onAdd={addToCart} />
            </div>
          )}
        </AnimatePresence>

        {/* Cart Sidebar */}
        <AnimatePresence>
          {showCart && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-y-0 right-0 w-full md:w-96 bg-slate-900 border-r border-white/5 shadow-2xl z-50 flex flex-col p-6">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black italic uppercase text-white tracking-tighter">הסל של ראמי</h2>
                  <button onClick={() => setShowCart(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide text-right">
                  {cart.length === 0 ? <p className="text-slate-700 opacity-20 italic">הסל ריק</p> : cart.map((item: any) => (
                    <div key={item.orderId} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                      <button onClick={() => setCart(cart.filter((i: any) => i.orderId !== item.orderId))} className="text-slate-600 hover:text-rose-500"><Trash2 size={16} /></button>
                      <div className="text-right"><p className="text-sm font-black text-white">{item.product_name}</p><p className="text-[10px] text-blue-500 font-bold uppercase">{item.units} יחידות</p></div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('הזמנה מ-Saban OS')}`)} className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 mt-4 shadow-lg"><Share2 size={20}/> שתף הזמנה</button>}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Input Composer */}
        <div className="p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-[24px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative flex items-center">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="כתוב פקודה למוח הלוגיסטי..." className="w-full bg-slate-900 border border-white/10 rounded-[24px] py-5 pr-6 pl-20 outline-none focus:border-blue-500/50 font-bold text-sm shadow-2xl transition-all text-right" />
              <button onClick={handleSend} disabled={loading} className="absolute left-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg">{loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
