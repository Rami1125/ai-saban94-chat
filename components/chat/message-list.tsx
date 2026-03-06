"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Sparkles } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useChatActions } from "@/context/ChatActionsContext";

export function MessageList() {
  const { messages, isLoading, handleSendMessage } = useChatActions();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-8 custom-scrollbar scroll-smooth">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                ${message.role === "user" ? "bg-slate-800 text-white" : "bg-white border border-slate-100 text-blue-600"}`}>
                {message.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div className="flex flex-col gap-3">
                {/* בועת טקסט */}
                <div className={`p-5 rounded-[28px] shadow-sm text-sm leading-relaxed
                  ${message.role === "user" 
                    ? "bg-[#0b141a] text-white rounded-tr-none" 
                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-100"}`}>
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                  <div className="mt-2 text-[8px] opacity-40 font-black uppercase tracking-widest text-left">
                    {new Date(message.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* כרטיס מוצר קטן המפעיל את ה-Sheet */}
                {message.product && (
                  <ProductCard product={message.product} />
                )}

                {/* כפתורי תגובה מהירה (מוצגים רק בהודעה האחרונה של הבוט) */}
                {message.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["הצעת מחיר מדויקת", "בדיקת זמינות מלאי", "דבר עם נציג"].map((text) => (
                      <button 
                        key={text}
                        onClick={() => handleSendMessage(text)}
                        className="px-4 py-2 bg-white dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-black hover:bg-blue-50 transition-all shadow-sm"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
