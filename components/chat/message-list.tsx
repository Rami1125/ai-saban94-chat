"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Calculator, Package, Headset, Ruler } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useChatActions } from "@/context/ChatActionsContext";

export function MessageList() {
  const chatActions = useChatActions();
  const messages = chatActions?.messages || [];
  const isLoading = chatActions?.isLoading || false;
  const handleSendMessage = chatActions?.handleSendMessage;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // הפונקציה הקריטית: מעבירה את ה-product המדויק מההודעה ל-Overlay
  const onQuickReplyClick = (label: string, actionType: string, product?: any) => {
    const mapping: any = {
      "quote": "quote",
      "inventory": "inventory",
      "support": "support",
      "calculator": "calculator"
    };

    if (mapping[actionType]) {
      // כאן אנחנו מזריקים את הנתונים ל-Event
      window.dispatchEvent(new CustomEvent('open-action-overlay', { 
        detail: { 
          type: mapping[actionType], 
          product: product // זה שולח את השם "סיקה סרם 500", תמונה, וכיסוי
        } 
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border
                ${message.role === "user" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-slate-100 text-blue-600"}`}>
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className="flex flex-col gap-3">
                <div className={`p-5 rounded-[24px] shadow-sm text-sm leading-relaxed
                  ${message.role === "user" 
                    ? "bg-[#0b141a] text-white rounded-tr-none" 
                    : "bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-tl-none text-slate-800 dark:text-slate-100"}`}>
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                </div>

                {/* כרטיס המוצר המקצועי */}
                {message.product && <ProductCard product={message.product} />}

                {/* כפתורי פעולה - כאן מועבר הקשר המוצר */}
                {message.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <ActionButton 
                      icon={<Calculator size={14} />} 
                      label="הצעת מחיר" 
                      onClick={() => onQuickReplyClick("הצעת מחיר", "quote", message.product)}
                      variant="blue"
                    />
                    <ActionButton 
                      icon={<Ruler size={14} />} 
                      label="מחשבון מ\"ר" 
                      onClick={() => onQuickReplyClick("מחשבון", "calculator", message.product)}
                      variant="indigo"
                    />
                    <ActionButton 
                      icon={<Package size={14} />} 
                      label="זמינות מלאי" 
                      onClick={() => onQuickReplyClick("בדיקת מלאי", "inventory", message.product)}
                      variant="emerald"
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

function ActionButton({ icon, label, onClick, variant }: any) {
  const themes: any = {
    blue: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-600 hover:text-white",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white",
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black border transition-all active:scale-95 ${themes[variant]}`}>
      {icon} <span>{label}</span>
    </button>
  );
}
