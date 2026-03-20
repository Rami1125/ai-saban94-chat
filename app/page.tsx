"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, CheckCheck, MoreVertical, Paperclip, Smile, Mic, Phone, Video, ArrowRight, Brain } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function SabanWhatsAppAI() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'אהלן ראמי אחי, כאן המוח של ח. סבן. מה עושים היום?', time: '12:00', read: true }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), read: true };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        body: JSON.stringify({ query: input })
      });
      const data = await res.json();
      
      const aiMsg = { 
        role: 'ai', 
        content: data.aiResponse, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        read: true 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: 'סליחה אחי, יש לי נתק קטן בשרת...', time: '!!', read: false }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen bg-[#E5DDD5] flex flex-col font-sans" dir="rtl">
      {/* WhatsApp Header */}
      <header className="bg-[#075E54] text-white p-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <ArrowRight className="cursor-pointer" size={24} />
          <div className="relative">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border border-white/20">
              <Brain size={24} className="text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#075E54]"></div>
          </div>
          <div>
            <h2 className="font-bold text-sm">Saban AI Brain</h2>
            <p className="text-[10px] opacity-80">מחובר - מבצע פקודות SQL</p>
          </div>
        </div>
        <div className="flex gap-4 opacity-80">
          <Video size={20} /><Phone size={20} /><MoreVertical size={20} />
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-[url('https://ai-saban94-chat.vercel.app/icon-192x192.png.png')] bg-repeat">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`relative max-w-[85%] p-2 px-3 rounded-lg shadow-sm text-sm ${
              m.role === 'user' ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'
            }`}>
              <p className="pb-4 text-slate-800 leading-relaxed font-medium">{m.content}</p>
              <div className="absolute bottom-1 left-2 flex items-center gap-1 text-[9px] text-slate-400">
                <span>{m.time}</span>
                {m.role === 'user' && <CheckCheck size={12} className="text-blue-500" />}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-end">
            <div className="bg-white p-2 px-4 rounded-lg rounded-tl-none shadow-sm text-[10px] italic text-slate-400">המוח מקליד...</div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-[#F0F0F0] p-2 flex items-center gap-2">
        <div className="flex-1 bg-white rounded-full flex items-center px-4 py-1 shadow-sm">
          <Smile className="text-slate-400" size={24} />
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="הודעה"
            className="flex-1 bg-transparent border-none outline-none p-2 text-right text-sm"
          />
          <Paperclip className="text-slate-400 rotate-45" size={22} />
        </div>
        <button 
          onClick={sendMessage}
          className="bg-[#075E54] text-white w-12 h-12 rounded-full flex items-center justify-center border-none shadow-md cursor-pointer active:scale-95 transition-all"
        >
          {input.trim() ? <Send size={20} /> : <Mic size={20} />}
        </button>
      </footer>
    </div>
  );
}
