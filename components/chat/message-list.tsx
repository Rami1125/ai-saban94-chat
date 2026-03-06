"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Sparkles } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useChatActions } from "@/context/ChatActionsContext";

export function MessageList() {
  const { messages, isLoading, error } = useChatActions();
  const scrollRef = useRef<HTMLDivElement>(null);

  // גלילה חלקה לתחתית בכל שינוי
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  return (
    <div 
      ref={scrollRef} 
      className="h-full overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth"
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* אבטר */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                ${message.role === "user" ? "bg-slate-800 text-white" : "bg-white border border-slate-100 text-blue-600"}`}>
                {message.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* בועה וכרטיס */}
              <div className="flex flex-col gap-3">
                <div className={`p-4 rounded-[24px] shadow-sm text-sm leading-relaxed
                  ${message.role === "user" 
                    ? "bg-[#0b141a] dark:bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-100"}`}>
                  
                  {/* תמיכה ב-HTML במידה ו-Gemini שולח הדגשות */}
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                  
                  <div className="mt-2 text-[8px] opacity-40 font-black uppercase tracking-widest text-left">
                    {new Date(message.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* מזרק כרטיס המוצר המעוצב */}
                {message.product && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <ProductCard product={message.product} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* אנימציית "כותב..." */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-3 items-center">
             <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center animate-pulse">
               <Sparkles size={14} className="text-blue-400" />
             </div>
             <div className="bg-white/80 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1.5 shadow-sm">
               <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
