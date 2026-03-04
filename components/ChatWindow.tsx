"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { useChatActions } from "../context/ChatActionsContext";
import { ProductCard } from "./chat/ProductCard"; // וודא שהנתיב מדויק לתיקיית המשנה chat

export function ChatWindow() {
  const { messages, sendMessage, isLoading, error } = useChatActions();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const onSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white dark:bg-slate-950 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" dir="rtl">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="space-y-4">
                <div className={`p-4 rounded-[25px] ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none shadow-sm'}`}>
                  <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                </div>
                {m.product && <ProductCard product={m.product} />}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-xs text-slate-400 font-bold animate-pulse">סבן AI חושב...</div>}
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">{error}</div>}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <div className="relative flex items-center bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm focus-within:ring-2 ring-blue-500/20 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="שאל אותי על חומרי בניין..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm font-medium"
          />
          <button 
            onClick={onSend}
            disabled={isLoading}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
