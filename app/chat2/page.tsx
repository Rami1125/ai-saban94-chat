"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Sparkles, ShoppingBag, MessageCircle, 
  Plus, Minus, ShieldCheck, Loader2, Star, 
  Play, ShoppingCart, Package, X, ChevronRight
} from "lucide-react";
import { AnimatedOrb } from "@/components/chat/animated-orb";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface Product {
  sku: string;
  product_name: string;
  description: string;
  price: number;
  image_url: string;
  youtube_url?: string;
  drying_time?: string;
  coverage?: string;
}

interface CartItem { product: Product; quantity: number; }
interface Message { id: string; role: 'user' | 'assistant'; text: string; products?: Product[]; }

export default function SabanApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // סנכרון גלילה
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
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
    <div className="h-screen bg-[#020617] text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans" dir="rtl">
      
      {/* --- Sidebar (Cart) --- */}
      <aside className="hidden lg:flex w-96 flex-col bg-slate-900/50 backdrop-blur-xl border-l border-white/5 p-8">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
            <ShoppingBag size={24} />
          </div>
          <h2 className="text-xl font-black tracking-tight">הסל של סבן</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
              <Package size={48} className="mb-4" />
              <p>הסל מחכה לפרויקט שלך</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.sku} className="bg-white/5 p-4 rounded-3xl border border-white/10 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-blue-400 mb-1">{item.product.sku}</div>
                  <div className="text-sm font-black truncate w-40">{item.product.product_name}</div>
                </div>
                <div className="text-lg font-black text-white">₪{item.product.price * item.quantity}</div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- Main Area --- */}
      <main className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="absolute top-0 w-full p-8 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Saban AI</h1>
          </div>
          <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            LIVE EXPERT MODE
          </div>
        </header>

        {/* Content - ה-Orb מופיע כאן כשהשיחה ריקה */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-20 pt-32 pb-40 space-y-12 relative">
          
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              >
                <AnimatedOrb />
                <h2 className="mt-8 text-2xl font-black text-blue-400 tracking-tighter animate-pulse text-center">
                  איך סבן יכול לעזור<br/>בפרויקט שלך היום?
                </h2>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-4`}>
              <div className={`max-w-[85%] lg:max-w-[65%] p-6 rounded-[32px] font-bold text-lg leading-relaxed shadow-2xl ${
                m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
              }`}>
                {m.text}
              </div>

              {m.products && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                  {m.products.map(p => (
                    <ProductCard key={p.sku} product={p} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-blue-500 font-black text-[10px] uppercase tracking-widest animate-pulse">
              <Loader2 className="animate-spin" size={14} /> סבן בודק במלאי...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <footer className="p-8 lg:p-12 absolute bottom-0 w-full bg-gradient-to-t from-[#020617] via-[#020617] to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[30px] py-6 px-10 font-bold text-lg outline-none focus:border-blue-500/50 transition-all shadow-2xl placeholder:text-slate-500"
              placeholder="שאל על חומרי איטום, דבקים או חישוב כמויות..."
            />
            <button 
              onClick={() => handleSend()}
              className="absolute left-3 top-3 bottom-3 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[22px] transition-all flex items-center justify-center shadow-lg active:scale-95"
            >
              <Send size={20} className="transform -rotate-45" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

// --- Sub-Component: Premium Product Card ---
function ProductCard({ product }: { product: Product }) {
  const [tab, setTab] = useState<'info' | 'specs'>('info');

  return (
    <div className="bg-white rounded-[40px] overflow-hidden flex flex-col group transition-all hover:scale-[1.02] shadow-2xl">
      <div className="h-64 bg-[#f8fafc] relative overflow-hidden flex items-center justify-center p-8">
        <img src={product.image_url} alt="" className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute top-6 right-6">
          <div className="bg-[#0B2C63] text-white text-[9px] font-black px-4 py-2 rounded-full shadow-xl">PREMIUM</div>
        </div>
      </div>
      
      <div className="p-8 text-[#0B2C63]">
        <h3 className="text-xl font-black mb-6 leading-tight h-14 overflow-hidden">{product.product_name}</h3>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
          <button onClick={() => setTab('info')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${tab === 'info' ? 'bg-white shadow-sm' : 'opacity-40'}`}>מידע</button>
          <button onClick={() => setTab('specs')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${tab === 'specs' ? 'bg-white shadow-sm' : 'opacity-40'}`}>מפרט</button>
        </div>

        <div className="h-20 overflow-y-auto mb-8 text-[11px] font-bold leading-relaxed text-slate-500">
          {tab === 'info' ? product.description : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Clock size={14} className="text-blue-500"/> {product.drying_time || '24h'}</div>
              <div className="flex items-center gap-2"><Package size={14} className="text-emerald-500"/> {product.coverage || '4kg/sqm'}</div>
            </div>
          )}
        </div>

        <button className="w-full bg-[#0B2C63] text-white py-5 rounded-2xl font-black text-xs flex items-center justify-center gap-3 hover:bg-[#08214a] transition-all">
          <ShoppingCart size={18} /> הוסף להזמנה
        </button>
      </div>
    </div>
  );
}
