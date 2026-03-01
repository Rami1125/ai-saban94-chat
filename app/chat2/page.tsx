"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Sparkles, ShoppingBag, MessageCircle, 
  Plus, Minus, ShieldCheck, Loader2, Star, 
  Play, ShoppingCart, Package, X, Clock, Maximize2
} from "lucide-react";
import { AnimatedOrb } from "@/components/chat/animated-orb";
import { motion, AnimatePresence } from "framer-motion";

export default function SabanFinalApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: msg }]);
    if (!text) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: msg }] })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', text: data.text, products: data.products }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col overflow-hidden font-sans" dir="rtl">
      
      {/* Header יוקרתי */}
      <header className="p-6 flex justify-between items-center border-b border-white/5 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/30">
            <Sparkles size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tighter">SABAN AI EXPERT</h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          גירסה סופית 2026
        </div>
      </header>

      {/* אזור הצאט וה-Orb */}
      <main className="flex-1 relative overflow-y-auto px-4 lg:px-24 py-10" ref={scrollRef}>
        
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <AnimatedOrb />
              <h2 className="mt-8 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400">
                במה סוכן ה-AI של סבן<br/>יכול לעזור לך היום?
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto space-y-8 pb-32">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-4`}>
              <div className={`p-5 rounded-[28px] font-bold text-lg shadow-xl ${
                m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
              }`}>
                {m.text}
              </div>

              {m.products && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {m.products.map((p: any) => (
                    <ProductCardUI key={p.sku} product={p} onConsult={() => handleSend(`אני רוצה להתייעץ על ${p.product_name}. כמה שקים אני צריך ל-30 מ"ר?`)} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-blue-500 font-bold animate-pulse text-xs uppercase tracking-widest">סבן בודק במלאי...</div>}
        </div>
      </main>

      {/* Input ברמה של אפליקציה */}
      <footer className="p-6 lg:p-12 absolute bottom-0 w-full bg-gradient-to-t from-[#020617] via-[#020617] to-transparent">
        <div className="max-w-4xl mx-auto relative shadow-2xl shadow-blue-900/20">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[30px] py-6 px-10 font-bold text-lg outline-none focus:border-blue-500/50 transition-all"
            placeholder="חפש מוצר או בקש חישוב כמויות..."
          />
          <button 
            onClick={() => handleSend()}
            className="absolute left-3 top-3 bottom-3 px-8 bg-blue-600 hover:bg-blue-500 rounded-[24px] shadow-lg transition-all active:scale-95"
          >
            <Send size={20} className="transform -rotate-45" />
          </button>
        </div>
      </footer>
    </div>
  );
}

function ProductCardUI({ product, onConsult }: any) {
  const [tab, setTab] = useState('info');
  return (
    <div className="bg-white rounded-[40px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="h-56 bg-slate-100 relative p-8 flex items-center justify-center">
        <img src={product.image_url} alt="" className="max-h-full object-contain mix-blend-multiply" />
        <div className="absolute top-4 right-4 bg-[#0B2C63] text-white text-[9px] font-black px-3 py-1.5 rounded-full">PREMIUM</div>
      </div>
      <div className="p-8 text-[#0B2C63]">
        <h3 className="text-lg font-black mb-4 leading-tight h-12 overflow-hidden">{product.product_name}</h3>
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
          <button onClick={() => setTab('info')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black ${tab === 'info' ? 'bg-white shadow-sm' : 'opacity-40'}`}>מידע</button>
          <button onClick={() => setTab('specs')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black ${tab === 'specs' ? 'bg-white shadow-sm' : 'opacity-40'}`}>מפרט</button>
        </div>
        <div className="h-16 text-[11px] font-bold text-slate-500 mb-6">
          {tab === 'info' ? product.description : (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1"><Clock size={12}/> {product.drying_time || '24h'}</div>
              <div className="flex items-center gap-1"><Maximize2 size={12}/> {product.coverage || '4kg/m²'}</div>
            </div>
          )}
        </div>
        <button onClick={onConsult} className="w-full bg-[#0B2C63] text-white py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 hover:bg-blue-900 transition-all">
          <MessageCircle size={16} /> התייעץ על יישום וחישוב
        </button>
      </div>
    </div>
  );
}
