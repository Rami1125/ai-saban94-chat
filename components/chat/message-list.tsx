"use client";
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Sparkles } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useChatActions } from "@/context/ChatActionsContext";
import { useConfig } from "@/context/BusinessConfigContext";

export function MessageList() {
  const { messages, isLoading, error } = useChatActions();
  const config = useConfig();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar scroll-smooth">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* אבטר */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                ${message.role === "user" ? "bg-slate-800 text-white" : "bg-white border border-slate-100 text-blue-600"}`}>
                {message.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* גוף ההודעה */}
              <div className="flex flex-col gap-3">
                <div className={`p-4 rounded-[28px] shadow-sm text-sm leading-relaxed
                  ${message.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-100"}`}>
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                  <div className="mt-2 text-[8px] opacity-40 font-black uppercase tracking-widest">
                    {new Date(message.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* רינדור כרטיס מוצר אם צורף להודעה */}
                {message.product && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <ProductCard product={message.product} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-3">
            <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center animate-pulse">
              <Sparkles size={14} className="text-blue-400" />
            </div>
            <div className="bg-white p-4 rounded-[28px] rounded-tl-none border border-slate-100 flex gap-1">
              <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce"></span>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="flex justify-center p-4">
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-[10px] font-black border border-red-100 uppercase italic">
              ⚠️ {error}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
