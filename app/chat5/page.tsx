"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, User, Sun, Moon, 
  Trash2, Package, ShoppingCart, 
  Sparkles, MessageSquare, Info
} from "lucide-react";

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  product?: any;
}

export default function SabanChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // מספר טלפון לניסויים וחיבור לצינור המשלוחים
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          phone: TEST_PHONE,
          user_id: "web-client"
        }),
      });

      const data = await response.json();
      
      const assistantMsg: Message = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: data.text || "סליחה, חלה שגיאה בחיבור למערכת סבן.",
        product: data.product // המוח מחזיר מוצר אם הוא מזוהה ב-Supabase
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100" dir="rtl">
      
      {/* Header - Glassmorphism Light */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black italic text-xl tracking-tighter leading-none text-slate-800">SABAN AI</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connected to JONI-Live</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setMessages([])}
            className="p-2.5 rounded-xl transition-all bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 group"
            title="נקה שיחה"
          >
            <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </nav>

      {/* Main Chat Area */}
      <main className="max-w-4xl mx-auto pt-24 pb-36 px-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 border border-blue-100/50">
                <Sparkles size={40} className="text-blue-500" />
              </div>
              <h2 className="text-4xl font-black mb-3 tracking-tight text-slate-800">שלום, רמי 👋</h2>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                מוח ה-AI של סבן מחובר למלאי, לסידור העבודה ולמחירונים ב-Supabase. מה נבדוק היום?
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-md">
                {['בדיקת מלאי גבס', 'סטטוס משלוחים', 'מחירון לוחות', 'סידור עבודה'].map((chip) => (
                  <button 
                    key={chip}
                    onClick={() => setInput(chip)}
                    className="p-3 text-xs font-bold bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all text-slate-600 shadow-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] group`}>
                    <div className={`p-4 px-5 rounded-[24px] shadow-sm relative leading-relaxed text-[15px] ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none shadow-blue-200' 
                        : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* כרטיס מוצר ויזואלי מה-Inventory */}
                      {msg.product && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-2 py-0.5 rounded">זמין במלאי</span>
                             <Package size={14} className="text-slate-400" />
                          </div>
                          <div className="font-bold text-slate-800">{msg.product.product_name}</div>
                          <div className="flex justify-between items-end border-t border-slate-200/50 pt-2">
                            <div className="text-lg font-black text-slate-900">{msg.product.price} ₪</div>
                            <button className="bg-blue-600 text-white text-[11px] font-black px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
                              <ShoppingCart size={14} /> הוסף לסל
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <div className={`text-[10px] opacity-40 mt-1.5 px-2 flex items-center gap-1 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                       <span>{new Date(msg.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       {msg.role === 'assistant' && <span className="font-bold">SABAN 1994</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Thinking State */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end mt-4">
            <div className="bg-white border border-slate-200 p-3 px-5 rounded-2xl rounded-bl-none flex items-center gap-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-0"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300"></span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 italic tracking-tight">בודק עבורך ב-SabanOS...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Field - Floating Island */}
      <div className="fixed bottom-0 w-full p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              placeholder="שאל אותי משהו (לדוגמה: מצא לי לוחות גבס אדום 12.5)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="w-full p-5 pr-6 pl-16 rounded-[24px] outline-none transition-all shadow-2xl shadow-blue-100/50 border border-slate-200 focus:border-blue-400 bg-white text-slate-800 text-sm placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute left-2.5 top-2.5 bottom-2.5 w-12 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[18px] flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-200"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-4 text-slate-400 font-medium">
            מערכת AI מקצועית של ח. סבן חומרי בניין | 2026
          </p>
        </div>
      </div>
    </div>
  );
}
