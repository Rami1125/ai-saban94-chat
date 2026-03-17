"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, Sun, Moon, 
  Trash2, Package, ShoppingCart, Loader2
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ממשקי נתונים
interface Product {
  id: string | number;
  product_name: string;
  sku: string;
  price?: number;
  stock_quantity?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  product?: Product;
}

// שים לב ל-export default - זה מה שחסר ב-Build
export default function Chat7Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const TEST_PHONE = "972508860896";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input 
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin_pro/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          phone: TEST_PHONE,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) throw new Error("400/500 Brain Error");

      const data = await response.json();
      
      const assistantMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.reply || data.text || "לא התקבלה תשובה מהמוח.",
        product: data.product 
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white/70 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot size={24} className="text-blue-500" />
            <h1 className="font-black italic text-xl">SABAN AI V7</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl bg-white/5">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setMessages([])} className="p-2 rounded-xl bg-white/5 text-red-400">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <main className="max-w-4xl mx-auto pt-24 pb-32 px-4 space-y-8">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-white/5'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.product && (
                  <div className="mt-4 bg-black/30 p-4 rounded-2xl border border-white/10">
                    <p className="font-bold">{msg.product.product_name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-emerald-400 font-black">{msg.product.price} ₪</span>
                      <button className="bg-emerald-600 px-3 py-1 rounded-lg text-xs flex items-center gap-1">
                        <ShoppingCart size={14} /> הזמן
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div className="fixed bottom-0 w-full p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input 
            className="flex-1 bg-slate-900 border border-white/5 p-4 rounded-2xl outline-none focus:border-blue-500"
            placeholder="איך אפשר לעזור?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={isLoading} className="bg-blue-600 p-4 rounded-2xl">
            {isLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
