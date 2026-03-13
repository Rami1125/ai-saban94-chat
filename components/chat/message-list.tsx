"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Calculator, Package, Ruler, Share2 } from "lucide-react";
import ProductCard from "@/components/chat/ProductCard";
import { useChatActions } from "@/context/ChatActionsContext";

export function MessageList() {
  const chatActions = useChatActions();
  const messages = chatActions?.messages || [];
  const isLoading = chatActions?.isLoading || false;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const onQuickReplyClick = (actionType: string, productData?: any) => {
    window.dispatchEvent(new CustomEvent('open-action-overlay', { 
      detail: { type: actionType, product: productData || null } 
    }));
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-8 custom-scrollbar">
      <AnimatePresence initial={false}>
        {messages.map((message: any, index: number) => (
          <motion.div key={message.id || index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 border ${message.role === "user" ? "bg-zinc-800 text-white" : "bg-white text-blue-600"}`}>
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex flex-col gap-3">
                <div className={`p-5 rounded-[24px] shadow-sm ${message.role === "user" ? "bg-[#0b141a] text-white" : "bg-white dark:bg-zinc-900 border text-slate-800 dark:text-slate-100"}`}>
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                </div>

                {message.product && <ProductCard product={message.product} />}

                {message.role === "assistant" && index === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <ActionButton icon={<Share2 size={14} />} label="שתף לווטסאפ" onClick={() => onQuickReplyClick("share_product", message.product)} variant="emerald" />
                    <ActionButton icon={<Calculator size={14} />} label="הצעת מחיר" onClick={() => onQuickReplyClick("quote", message.product)} variant="blue" />
                    <ActionButton icon={<Ruler size={14} />} label="מחשבון מ'ר" onClick={() => onQuickReplyClick("calculator", message.product)} variant="indigo" />
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
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white",
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-black border transition-all ${themes[variant]}`}>
      {icon} {label}
    </button>
  );
}
