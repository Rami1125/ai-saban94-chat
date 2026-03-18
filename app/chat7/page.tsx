"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, ShoppingBag, X, Loader2, Sparkles, 
  Trash2, ChevronLeft, Dna, Package 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "sonner";
import ProductCard from "@/components/chat/ProductCard";

export default function SabanEliteExperience() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCrystalBall, setShowCrystalBall] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const USER_ID = "972508860896"; // מזהה קבוע לבדיקות ראמי

  useEffect(() => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "בוקר טוב ראמי" : hour < 18 ? "צהריים טובים" : "ערב טוב";
    
    setTimeout(() => {
      setMessages([{ role: "assistant", content: `${greeting}! המערכת מוכנה. 🦾\nאיך אפשר לעזור בקידום הפרויקטים היום?` }]);
    }, 2000);

    setTimeout(() => setShowCrystalBall(false), 3500);
    fetchCart();
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isThinking]);

  async function fetchCart() {
    const { data } = await supabase.from('shopping_carts').select('*').eq('user_id', USER_ID);
    setCart(data || []);
  }

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    setThinkingText(input.includes("מוצר") ? "סורק מלאי ב-DNA..." : "מעבד פקודה לביצוע...");
    setIsThinking(true);

    try {
      const res = await fetch("/api/admin_pro/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, sessionId: USER_ID, history: messages.slice(-3) })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, product: data.product }]);
    } catch (e) { toast.error("ניתוק מהמוח"); }
    finally { setIsThinking(false); }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans flex flex-col" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* 🔮 כדור בדולך ויזואלי 360 */}
      <AnimatePresence>
        {showCrystalBall && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-2xl flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
              transition={{ duration: 3, repeat: Infinity }}
              className="w-40 h-40 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.5)] flex items-center justify-center border-4 border-white"
            >
              <Bot size={60} className="text-white animate-pulse" />
            </motion.div>
            <h2 className="absolute mt-60 text-xl font-black italic text-blue-600 tracking-tighter">SABAN OS 360° ACTIVE</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header יוקרתי */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200"><Dna className="text-white" size={20} /></div>
          <div><h1 className="font-black text-sm leading-none">SABAN ELITE</h1><span className="text-[8px] text-emerald-500 font-bold uppercase">System V100</span></div>
        </div>
        <button onClick={() => setIsCartOpen(true)} className="p-2 bg-slate-100 rounded-lg relative">
          <ShoppingBag size={20} />
          {cart.length > 0 && <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
        </button>
      </header>

      {/* רשימת הודעות */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 max-w-2xl mx-auto w-full">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`p-4 rounded-[20px] shadow-sm max-w-[90%] ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-200'}`}>
              <p className="text-sm leading-relaxed">{m.content}</p>
              {m.product && <div className="mt-4"><ProductCard product={m.product} onAddToCart={() => { fetchCart(); setIsCartOpen(true); }} /></div>}
            </div>
          </motion.div>
        ))}
        {isThinking && (
          <div className="flex justify-end items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 italic">{thinkingText}</span>
            <Loader2 className="animate-spin text-blue-500" size={14} />
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      {/* Input */}
      <div className="fixed bottom-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="הקלד פקודה..." className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-blue-500" />
          <button onClick={handleSend} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg"><Send size={20} /></button>
        </div>
      </div>

      {/* סל קניות Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-[100] p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6"><h3 className="font-black">הסל שלי</h3><button onClick={() => setIsCartOpen(false)}><X /></button></div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {cart.map((item, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-2 items-center text-xs">
                  <Package size={14} className="text-blue-500" />
                  <div className="flex-1 font-bold">{item.product_name}</div>
                  <div className="opacity-50">x{item.quantity}</div>
                </div>
              ))}
            </div>
            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-black mt-4 shadow-xl">בצע הזמנה 🦾</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
