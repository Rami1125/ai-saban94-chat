"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, MoreVertical, Phone, Video, Search, CheckCheck, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// וודא שייבאת את ה-ProductCard מהקובץ שבו שמרת אותו
import { ProductCard } from "@/components/chat/ProductCard"; 

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  product?: any;
}

export default function WhatsAppChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "שלום רב,<br>כאן נציג <b>ח. סבן 1994</b>. המערכות שלנו פעילות ותקינות לחלוטין.<br>כיצד אוכל לסייע לך היום?<br><br>sent via JONI",
      role: "assistant",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const TEST_PHONE = "972508860896";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
          phone: TEST_PHONE,
          userId: "web-guest"
        }),
      });

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.text || "סליחה, המערכת נתקלה בקושי קל. נסה שנית.",
        role: "assistant",
        timestamp: new Date(),
        product: data.product || null
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-[#efeae2] dark:bg-[#0b141a]" dir="rtl">
      {/* WhatsApp Background Pattern */}
      <div className="fixed inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z' fill='%23000'/%3E%3C/svg%3E")` }} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#075e54] dark:bg-[#1f2c34] px-4 py-2 shadow-md">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#075e54] font-black text-xl shadow-inner">S</div>
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-[#25d366] rounded-full border-2 border-[#075e54]" />
            </div>
            <div className="flex flex-col text-white">
              <h1 className="font-bold text-sm md:text-base leading-tight">ח. סבן 1994</h1>
              <span className="text-emerald-200 text-[10px] md:text-xs">מחובר למערכת JONI</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/90">
             <Video size={20} className="cursor-pointer" />
             <Phone size={20} className="cursor-pointer" />
             <MoreVertical size={20} className="cursor-pointer" />
          </div>
        </div>
      </header>

      {/* Chat Space */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div className="flex flex-col gap-2 max-w-[90%] md:max-w-[75%]">
                  {/* בועת הטקסט */}
                  <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                    msg.role === "assistant" 
                      ? "bg-white dark:bg-[#1d2a32] text-slate-800 dark:text-slate-100 rounded-tl-none" 
                      : "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-800 dark:text-slate-100 rounded-tr-none"
                  }`}>
                    <div className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content }} />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] opacity-50">
                        {msg.timestamp.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* הצגת כרטיס מוצר פרימיום - מוזרק מחוץ לבועת הטקסט למראה נקי */}
                  {msg.product && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ProductCard product={msg.product} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#1d2a32] px-4 py-3 rounded-xl shadow-sm flex gap-1 animate-pulse">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Section */}
      <footer className="bg-[#f0f2f5] dark:bg-[#1f2c34] p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Smile size={24} className="text-slate-500 cursor-pointer" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="שאל את סבן AI על חומרי בניין..."
            className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-5 py-2.5 outline-none text-sm shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className={`p-3 rounded-full transition-all ${inputValue.trim() ? "bg-[#25d366] text-white" : "bg-slate-300 text-slate-500"}`}
          >
            <Send size={20} className="rotate-180" />
          </button>
        </div>
      </footer>
    </div>
  );
}
