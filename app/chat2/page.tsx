"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageList } from "@/components/chat/message-list";
import { 
  Send, Bot, User, Sun, Moon, 
  RefreshCw, Trash2, ChevronLeft, Loader2,
  Package, ShoppingCart, CheckCircle2
} from "lucide-react";

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  product?: any; // הוספת תמיכה במוצר מה-Inventory
}

export default function SabanChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // מספר הטלפון המרכזי לניסויים וחיבור לצינור
  const TEST_PHONE = "972508860896";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // שליחה ל-API החכם שלנו (זה שכולל את הדילוג בין מודלים וספר החוקים)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          phone: TEST_PHONE, // הזרקת הטלפון כדי שיעבור ל-JONI
          userId: "web-client"
        }),
      });

      const data = await response.json();
      
      const assistantMsg: Message = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: data.text || "סליחה, חלה שגיאה בחיבור.",
        product: data.product // קבלת נתוני מוצר אם זוהה ב-Supabase
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir="rtl">
      
      {/* Header מעוצב */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white/70 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black italic text-xl tracking-tighter leading-none">SABAN AI</h1>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Connected to JONI</span>
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
             <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Bot size={48} className="text-blue-500" />
             </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">איך אפשר לעזור היום?</h2>
            <p className="opacity-50 text-sm max-w-xs mx-auto">שאל אותי על לוחות גבס, סידור עבודה או מוצרים מהמלאי של ח. סבן</p>
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

                  {/* כרטיס מוצר ויזואלי - אם זוהה מוצר */}
                  {msg.product && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 bg-black/20 p-4 rounded-2xl border border-white/10 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold uppercase text-blue-400 tracking-widest">כרטיס מוצר זמין</span>
                         <Package size={14} className="text-blue-400" />
                      </div>
                      <div className="font-bold text-base">{msg.product.product_name}</div>
                      <div className="flex justify-between items-end">
                        <div className="text-xl font-black text-emerald-400">{msg.product.price} ₪</div>
                        <button className="bg-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <ShoppingCart size={12} /> הוסף להזמנה
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
                <span className="text-[10px] opacity-30 mt-1 px-2">
                  {new Date(msg.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking Effect */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-end gap-2"
            >
              <div className={`p-4 rounded-[25px] rounded-bl-none flex items-center gap-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs font-bold opacity-50 italic">סבן AI בודק במחסן...</span>
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
              placeholder="כתוב הודעה ל-סבן AI..."
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
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
