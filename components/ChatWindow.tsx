"use client";

import React, { useRef, useEffect } from "react";
import { useChatActions } from "@/context/ChatActionsContext";
import { ProductCard } from "@/components/chat/ProductCard";

export function ChatWindow() {
  const { messages, isLoading } = useChatActions();
  const scrollRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <MessageSquare size={32} className="text-slate-400" />
            </div>
            <p className="font-bold text-slate-500">כיצד אוכל לעזור לך היום?</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[25px] ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200'
            }`}>
              <div 
                dangerouslySetInnerHTML={{ __html: msg.content }} 
                className="text-sm font-medium leading-relaxed" 
              />
              
              {/* רינדור כרטיס מוצר אם הוא הוזרק להודעה מה-API */}
              {msg.product && (
                <div className="mt-4 w-full min-w-[280px]">
                  <ProductCard product={msg.product} />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center gap-2 text-[10px] font-black text-blue-500 uppercase animate-pulse">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            מבצע שליפה מה-Database...
          </div>
        )}
      </div>
    </div>
  );
}
