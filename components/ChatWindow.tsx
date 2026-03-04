"use client";

import React, { useRef, useEffect } from "react";
import { useChatActions } from "@/context/ChatActionsContext";
import { ProductCard } from "@/components/chat/productcard";
import { SafeIcon } from "@/components/SafeIcon";

export function ChatWindow() {
  const { messages, isLoading } = useChatActions();
  const scrollRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית להודעה האחרונה בכל עדכון של מערך ההודעות
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <SafeIcon name="MessageCircle" size={40} className="text-slate-400" />
            </div>
            <div>
              <p className="font-black text-lg text-slate-600">שלום, אני המומחה של ח. סבן</p>
              <p className="text-sm text-slate-500">שאל אותי על חומרי איטום, גבס או מלאי</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
          >
            <div className={`max-w-[85%] p-4 rounded-[25px] shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200'
            }`}>
              <div 
                dangerouslySetInnerHTML={{ __html: msg.content }} 
                className="text-sm font-medium leading-relaxed prose prose-slate max-w-none" 
              />
              
              {/* הצגת כרטיס מוצר אם המידע קיים בהודעה */}
              {msg.product && (
                <div className="mt-4 w-full min-w-[280px]">
                  <ProductCard product={msg.product} />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center gap-3 p-2 animate-pulse">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
            </div>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
              בודק במלאי של סבן...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
