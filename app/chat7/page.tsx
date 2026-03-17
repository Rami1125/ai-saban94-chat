"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, Sun, Moon, 
  Trash2, Package, ShoppingCart, Loader2
} from "lucide-react";
import { toast, Toaster } from "sonner";

// הגדרת ממשקים לפי המבנה של המוח (Brain)
interface Product {
  id: string | number;
  product_name: string;
  sku: string;
  price?: number;
  image_url?: string;
  stock_quantity?: number;
  description?: string;
}

interface Message {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  product?: Product; // המוח מחזיר מוצר בודד מזוהה או null
}

export default function SabanChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // טלפון לזיהוי לקוח (מזוהה ב-Brain כ-JONI)
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
      // חיבור ל-API הפרוקסי של המוח (Admin Pro Brain)
      const response = await fetch("/api/admin_pro/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          phone: TEST_PHONE,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) throw new Error("שגיאה בתקשורת עם המוח");

      const data = await response.json();
      
      const assistantMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.reply || data.text || "סליחה, חלה שגיאה בעיבוד הבקשה.",
        product: data.product // המוח מבצע שליפה אוטומטית מ-Supabase אם זוהה מוצר
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      toast.error("משהו השתבש בחיבור לשרת");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white/70 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black italic text-xl tracking-tighter leading-none">SABAN AI</h1>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">Connected to Brain</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-200 hover:bg-slate-300'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setMessages([])}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 hover:bg-red-500/20 text-red-400' : 'bg-slate-200 hover:bg-red-100 text-red-600'}`}
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Chat Area */}
      <main className="max-w-4xl mx-auto pt-24 pb-32 px-4">
        {messages.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mb-6">
                <Bot size={48} className="text-blue-500" />
             </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">שלום JONI, איך עוזרים?</h2>
            <p className="opacity-50 text-sm max-w-xs mx-auto text-center">שאל אותי על מלאי, מחירים או סטטוס הזמנות</p>
          </div>
        )}

        <div className="space-y-8">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}
              >
                <div className={`max-w-[90%] p-5 rounded-[28px] shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : (isDarkMode ? 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/5' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-md')
                }`}>
                  <div 
                    className="leading-relaxed whitespace-pre-wrap text-sm" 
                    dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }}
                  />

                  {/* כרטיס מוצר ויזואלי מה-Brain */}
                  {msg.product && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 bg-black/20 p-4 rounded-2xl border border-white/10 space-y-3"
                    >
                      <div className="flex justify-between items-center text-blue-400">
                         <span className="text-[10px] font-bold uppercase tracking-widest">זיהוי מוצר חכם</span>
                         <Package size={14} />
                      </div>
                      <div className="font-bold text-base">{msg.product.product_name}</div>
                      <div className="flex justify-between items-end">
                        <div className="text-xl font-black text-emerald-400">{msg.product.price} ₪</div>
                        <button className="bg-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-500 transition-colors">
                          <ShoppingCart size={12} /> הוסף להזמנה
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
                <span className="text-[10px] opacity-30 mt-1 px-2">
                  {new Date(Number(msg.id) || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end gap-2">
              <div className={`p-4 rounded-[25px] rounded-bl-none flex items-center gap-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs font-bold opacity-50 italic">המוח מעבד נתוני מלאי...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Field */}
      <div className={`fixed bottom-0 w-full p-4 pb-8 backdrop-blur-md ${isDarkMode ? 'bg-[#020617]/80' : 'bg-slate-50/80'}`}>
        <div className="max-w-4xl mx-auto relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="שאל את סבן AI על המלאי..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className={`w-full p-5 pl-14 rounded-[30px] outline-none transition-all shadow-xl text-sm ${
                isDarkMode 
                  ? 'bg-slate-800 border-white/5 focus:border-blue-500 text-white' 
                  : 'bg-white border-slate-200 focus:border-blue-500 text-slate-900 border'
              }`}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute left-2 top-2 bottom-2 w-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
