"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, Sun, Moon, Trash2, ShoppingCart, 
  Loader2, Sparkles, X, ShoppingBag, ChevronLeft
} from "lucide-react";
import { toast, Toaster } from "sonner";
import ProductCard from "@/components/chat/ProductCard";

export default function SabanEliteChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [show360, setShow360] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. ברכת שלום לפי זמן ביום + חוק התחלת שיחה
  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = hour < 12 ? "בוקר טוב ראמי" : hour < 18 ? "צהריים טובים ראמי" : "ערב טוב ראמי";
    
    setTimeout(() => {
      const initialMsg = {
        id: "init",
        role: "assistant",
        content: `${greeting}! הכל מוכן לביצוע. 🦾\nאיך אני יכול לעזור לך היום? נוכל להתייעץ על פרויקט חדש או פשוט להתחיל הזמנת מוצרים מהירה.`,
      };
      setMessages([initialMsg]);
    }, 1500);

    // סגירת פופ-אפ 360 אחרי 4 שניות
    setTimeout(() => setShow360(false), 4000);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // 2. לוגיקת שליחה עם אפקט "חושב" אנושי
  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    // הגדרת משפט חשיבה רלוונטי
    const isProductQuery = input.includes("כמה") || input.includes("מוצר") || input.includes("מק\"ט");
    setThinkingText(isProductQuery ? "מעבד נתוני מוצר מהמחסן..." : "חושב על התשובה המדויקת עבורך...");
    
    setIsThinking(true);

    try {
      // השהייה מלאכותית של 2 שניות לתחושה אנושית
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch("/api/admin_pro/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: messages })
      });

      const data = await response.json();
      
      const assistantMsg = { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: data.reply,
        product: data.product 
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      toast.error("תקלה בחיבור למוח");
    } finally {
      setIsThinking(false);
    }
  };

  const addToCart = (product: any, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.sku === product.sku);
      if (existing) {
        return prev.map(item => item.sku === product.sku ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { ...product, qty }];
    });
    toast.success(`${product.product_name} נוסף לסל`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden flex flex-col" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* 360 Animation Popup */}
      <AnimatePresence>
        {show360 && (
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md"
          >
            <div className="text-center">
              <motion.div 
                animate={{ rotateY: 360 }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-7xl mb-4"
              >
                🦾
              </motion.div>
              <h2 className="text-3xl font-black tracking-tighter text-blue-600 italic">SABAN OS 360°</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Elite Intelligence Active</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header עדין */}
      <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
             <Bot size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight leading-none">SABAN AI</h1>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online Training v90</span>
          </div>
        </div>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"
        >
          <ShoppingBag size={22} className="text-slate-700" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -left-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cart.reduce((acc, curr) => acc + curr.qty, 0)}
            </span>
          )}
        </button>
      </header>

      {/* אזור הצ'אט */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-40 max-w-3xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[90%] p-4 rounded-[24px] shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.product && (
                  <div className="mt-4">
                    <ProductCard product={msg.product} onAddToCart={addToCart} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end items-center gap-3">
             <span className="text-[10px] font-bold text-slate-400 italic uppercase">{thinkingText}</span>
             <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
             </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Field מעוצב כחלק מהאפליקציה */}
      <div className="fixed bottom-0 w-full p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <div className="max-w-3xl mx-auto flex gap-3 items-center">
          <div className="flex-1 relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב הודעה או בקש מוצר..."
              className="w-full bg-slate-100 border-none rounded-2xl p-4 pr-12 text-sm focus:ring-2 ring-blue-500 outline-none"
            />
            <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
          </div>
          <button 
            onClick={handleSend}
            disabled={isThinking}
            className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
          >
            {isThinking ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>

      {/* Drawer של סל הקניות */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[101]" 
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-[102] p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black">הסל שלי</h2>
                <button onClick={() => setIsCartOpen(false)}><X /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4">
                {cart.map(item => (
                  <div key={item.sku} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <img src={item.image_url} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-xs font-bold truncate w-32">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400">כמות: {item.qty} • {item.price * item.qty} ₪</p>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <p className="text-center text-slate-400 mt-20">הסל ריק כרגע</p>}
              </div>

              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mt-4">
                שלח הזמנה לווצאפ
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
