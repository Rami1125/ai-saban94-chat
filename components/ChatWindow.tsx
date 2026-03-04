"use client";

import React from "react";
import { useChatActions } from "@/context/ChatActionsContext";
import { ProductCard } from "@/components/chat/ProductCard";

/**
 * רכיב חלון הצ'אט המציג את ההיסטוריה וכרטיסי מוצרים
 */
export function ChatWindow() {
  const { messages, isLoading } = useChatActions();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[25px] ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 shadow-sm'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: msg.content }} className="text-sm font-medium leading-relaxed" />
              
              {msg.product && (
                <div className="mt-4">
                  <ProductCard product={msg.product} />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-2 text-[10px] font-black text-blue-500 uppercase animate-pulse p-4">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            סבן AI מעבד נתונים...
          </div>
        )}
      </div>
    </div>
  );
}
