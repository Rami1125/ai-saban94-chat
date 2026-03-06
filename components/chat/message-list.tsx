"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Calculator, Package, Headset, CheckCircle2 } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useChatActions } from "@/context/ChatActionsContext";

export function MessageList() {
  const chatActions = useChatActions();
  
  // חילוץ נתונים בטוח למניעת TypeError
  const messages = chatActions?.messages || [];
  const isLoading = chatActions?.isLoading || false;
  const handleSendMessage = chatActions?.handleSendMessage;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // פונקציית ניהול הקליקים על הכפתורים המעוצבים
  const onQuickReplyClick = (label: string, actionType: string, product?: any) => {
    const mapping: any = {
      "quote": "quote",
      "inventory": "inventory",
      "support": "support"
    };

    if (mapping[actionType]) {
      window.dispatchEvent(new CustomEvent('open-action-overlay', { 
        detail: { type: mapping[actionType], product } 
      }));
    } else if (typeof handleSendMessage === 'function') {
      handleSendMessage(label);
    }
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-8 custom-scrollbar scroll-smooth">
      <AnimatePresence initial={false}>
        {messages.map((message: any, index: number) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* אווטאר מעוצב */}
              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border
                ${message.role === "user" 
                  ? "bg-zinc-800 border-zinc-700 text-white" 
                  : "bg-white border-slate-100 text-blue-600 dark:bg-zinc-900 dark:border-zinc-800"}`}>
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className="flex flex-col gap-3">
                {/* בועת טקסט מקצועית */}
                <div className={`p-5 rounded-[24px] shadow-sm text-[14.5px] leading-relaxed relative
                  ${message.role === "user" 
                    ? "bg-[#0b141a] text-white rounded-tr-none" 
                    : "bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-tl-none text-slate-800 dark:text-slate-100"}`}>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: message.content }} 
                  />
                  {/* חותמת זמן קטנה */}
                  <div className="text-[9px] opacity-30 mt-2 text-left font-mono">
                    {new Date(message.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* הצגת כרטיס מוצר אם קיים */}
                {message.product && (
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <ProductCard product={message.product} />
                  </motion.div>
                )}

                {/* כפתורי פעולה מעוצבים עם אייקונים */}
                {message.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <ActionButton 
                      icon={<Calculator size={14} />} 
                      label="הצעת מחיר מדויקת" 
                      onClick={() => onQuickReplyClick("הצעת מחיר", "quote", message.product)}
                      variant="blue"
                    />
                    <ActionButton 
                      icon={<Package size={14} />} 
                      label="בדיקת זמינות מלאי" 
                      onClick={() => onQuickReplyClick("בדיקת מלאי", "inventory", message.product)}
                      variant="emerald"
                    />
                    <ActionButton 
                      icon={<Headset size={14} />} 
                      label="דבר עם נציג" 
                      onClick={() => onQuickReplyClick("נציג אנושי", "support", message.product)}
                      variant="orange"
                    />
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

// רכיב כפתור פנימי לעיצוב אחיד
function ActionButton({ icon, label, onClick, variant }: { icon: any, label: string, onClick: any, variant: string }) {
  const themes: any = {
    blue: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    orange: "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-600 hover:text-white dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-black border shadow-sm transition-all duration-300 active:scale-95 ${themes[variant]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
