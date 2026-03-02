"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, User, Sun, Moon, 
  RefreshCw, Trash2, ChevronLeft, Loader2 
} from "lucide-react";
import { AnimatedOrb } from "@/components/chat/animated-orb";

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function SabanChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית לסוף הצ'אט
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
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await response.json();
      
      const assistantMsg: Message = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: data.text || "סליחה, חלה שגיאה בחיבור." 
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
      
      {/* Header */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white/70 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot size={20} className="text-white" />
            </div>
            <h1 className="font-black italic text-xl tracking-tighter">SABAN AI</h1>
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
          <div className="py-20 text-center">
            <AnimatedOrb />
            <h2 className="text-3xl font-black mb-4">איך אפשר לעזור היום?</h2>
            <p className="opacity-50 text-sm">שאל אותי על מלאי, חישובי כמויות או שעות פעילות</p>
          </div>
        )}

        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-[25px] shadow-sm ${
                  msg.role === 'user' 
                    ? (isDarkMode ? 'bg-blue-600 text-white rounded-br-none' : 'bg-blue-600 text-white rounded-br-none')
                    : (isDarkMode ? 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/5' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200')
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing/Thinking Effect */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-end gap-2"
            >
              <div className={`p-4 rounded-[25px] rounded-bl-none flex items-center gap-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
                <span className="text-sm font-bold italic opacity-50 italic">סבן AI חושב...</span>
                <Loader2 size={16} className="animate-spin text-blue-500" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Field */}
      <div className={`fixed bottom-0 w-full p-4 pb-8 backdrop-blur-md ${isDarkMode ? 'bg-[#020617]/80' : 'bg-slate-50/80'}`}>
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            placeholder="כתוב הודעה ל-סבן AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className={`w-full p-5 pl-16 rounded-[30px] outline-none transition-all shadow-xl ${
              isDarkMode 
                ? 'bg-slate-800 border-white/5 focus:border-blue-500 text-white' 
                : 'bg-white border-slate-200 focus:border-blue-500 text-slate-900 border'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute left-2 top-2 bottom-2 w-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-all active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
