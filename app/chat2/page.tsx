"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Sparkles, ShoppingBag, MessageCircle, 
  Plus, Minus, ShieldCheck, Loader2, Star, 
  Play, ShoppingCart, Package, X, 
  Clock, Maximize2 // תיקון: ייבוא האייקונים החסרים
} from "lucide-react";
import { AnimatedOrb } from "@/components/chat/animated-orb";
import { motion, AnimatePresence } from "framer-motion";

export default function SabanAppV2() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading) return;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: textToSend }]);
    if (!overrideText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: textToSend }] })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: data.text, 
        products: data.products 
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col overflow-hidden font-sans" dir="rtl">
      
      {/* Header אפליקציה */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
            <Sparkles size={22} />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">SABAN AI</h1>
        </div>
        <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          EXPERT SYSTEM
        </div>
      </header>

      {/* אזור התוכן המרכזי */}
      <main className="flex-1 relative overflow-y-auto px-4 lg:px-24" ref={scrollRef}>
        
        {/* ה-Orb שמופיע במרכז בתחילת הדרך */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
            >
              <AnimatedOrb />
              <h2 className="mt-10 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 leading-tight">
                איך סוכן ה-AI של סבן<br/>יכול לעזור לך היום?
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* רשימת הודעות וכרטיסי מוצר */}
        <div className="max-w-4xl mx-auto space-y-10 py-20 pb-40">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-4`}>
              <div className={`p-6 rounded-[30px] font-bold text-lg shadow-2xl ${
                m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
              }`}>
                {m.text}
              </div>

              {m.products && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {m.products.map((p: any) => (
                    <ProductCardUI key={p.sku} product={p} onConsult={() => handleSend(`אני רוצה להתייעץ על ${p.product_name}. מה הכמות המומלצת ל-40 מ"ר?`)} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-blue-500 font-bold animate-pulse text-xs tracking-widest">בודק במלאי של סבן...</div>}
        </div>
      </main>

      {/* שורת קלט (Input) */}
      <footer className="p-8 lg:p-12 absolute bottom-0 w-full bg-gradient-to-t from-[#020617] to-transparent">
        <div className="max-w-4xl mx-auto relative group">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[35px] py-7 px-10 font-bold text-lg outline-none focus:border-blue-500/50 transition-all shadow-2xl"
            placeholder="חפש מוצר או בקש חישוב כמויות..."
          />
          <button 
            onClick={() => handleSend()}
            className="absolute left-4 top-4 bottom-4 px-10 bg-blue-600 hover:bg-blue-500 rounded-[28px] shadow-lg transition-all active:scale-95 flex items-center justify-center"
          >
            <Send size={22} className="transform -rotate-45" />
          </button>
        </div>
      </footer>
    </div>
  );
}

function ProductCardUI({ product, onConsult }: any) {
  const [tab, setTab] = useState('info');
  return (
    <div className="bg-white rounded-[45px] overflow-hidden flex flex-col shadow-2xl transition-transform hover:scale-[1.02]">
      <div className="h-60 bg-slate-100 relative p-8 flex items-center justify-center">
        <img src={product.image_url} alt="" className="max-h-full object-contain mix-blend-multiply" />
        <div className="absolute top-6 right-6 bg-[#0B2C63] text-white text-[9px] font-black px-4 py-2 rounded-full">PREMIUM</div>
      </div>
      <div className="p-8 text-[#0B2C63]">
        <h3 className="text-xl font-black mb-6 leading-tight h-14 overflow-hidden">{product.product_name}</h3>
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button onClick={() => setTab('info')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${tab === 'info' ? 'bg-white shadow-sm' : 'opacity-40'}`}>מידע</button>
          <button onClick={() => setTab('specs')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${tab === 'specs' ? 'bg-white shadow-sm' : 'opacity-40'}`}>מפרט</button>
        </div>
        <div className="h-20 text-[11px] font-bold text-slate-500 mb-8 leading-relaxed">
          {tab === 'info' ? product.description : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Clock size={14}/> {product.drying_time || '24h'}</div>
              <div className="flex items-center gap-2"><Maximize2 size={14}/> {product.coverage || '4kg/m²'}</div>
            </div>
          )}
        </div>
        <button onClick={onConsult} className="w-full bg-[#0B2C63] text-white py-5 rounded-[22px] font-black text-xs flex items-center justify-center gap-3 hover:bg-blue-900 shadow-xl transition-all">
          <MessageCircle size={18} /> התייעץ וחשב כמויות
        </button>
      </div>
    </div>
  );
}
