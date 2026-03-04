"use client";

import React from "react";
import { useChatActions } from "@/context/ChatActionsContext";
import { ProductCard } from "@/components/chat/ProductCard";
import { Composer } from "@/components/chat/Composer";

/**
 * רכיב חלון הצ'אט המרכזי
 * מציג את רשימת ההודעות ואת תיבת הקלט (Composer)
 */
export function ChatWindow() {
  const { messages, isLoading } = useChatActions();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden relative">
      
      {/* רשימת ההודעות */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar pb-32">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👷‍♂️</span>
            </div>
            <p className="font-bold text-sm text-slate-500">
              שלום! איך אפשר לעזור לך היום <br/> עם חומרי הבניין של ח. סבן?
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-[28px] shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50'
            }`}>
              <div 
                dangerouslySetInnerHTML={{ __html: msg.content }} 
                className="text-sm font-medium leading-relaxed" 
              />
              
              {/* כרטיס מוצר בתוך בועת הצ'אט */}
              {msg.product && (
                <div className="mt-4">
                  <ProductCard product={msg.product} />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center gap-2 text-[10px] font-black text-blue-500 uppercase animate-pulse">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            סבן AI מעבד נתונים...
          </div>
        )}
      </div>

      {/* תיבת הקלט (Composer) - מקובעת למטה */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 pt-10">
        <Composer />
      </div>
    </div>
  );
}
