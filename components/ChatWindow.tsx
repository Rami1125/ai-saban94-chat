"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatActions } from "@/context/ChatActionsContext";
import { ProductCard } from "@/components/chat/ProductCard"; // תיקון נתיב

export function ChatWindow() {
  const { messages, isLoading } = useChatActions();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-[25px] ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: msg.content }} className="text-sm font-medium leading-relaxed" />
              
              {/* הצגת כרטיס מוצר אם קיים בהודעה */}
              {msg.product && (
                <div className="mt-4">
                  <ProductCard product={msg.product} />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start italic text-xs text-slate-400 animate-pulse">
            סבן AI מעבד נתונים...
          </div>
        )}
      </div>
    </div>
  );
}
