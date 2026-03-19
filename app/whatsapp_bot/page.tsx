"use client";
import React, { useState, useEffect, useRef } from 'react';
import { SabanBrainPro } from "@/lib/saban-brain-pro";
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, CheckCheck, Clock, Phone, Video, MoreVertical, Smile, Paperclip } from "lucide-react";
import { motion } from "framer-motion";

export default function SabanWhatsAppBot() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: input, time: new Date().toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsAiThinking(true);

    // קריאה למוח ה-Pro החדש
    const response = await SabanBrainPro.ask(currentInput);

    const aiMsg = { 
      id: (Date.now()+1).toString(), 
      role: 'ai', 
      text: response, 
      time: new Date().toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) 
    };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsAiThinking(false);
    if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isAiThinking]);

  return (
    <div className="flex flex-col h-[600px] w-full max-w-md mx-auto bg-[#E5DDD5] rounded-3xl shadow-2xl overflow-hidden border-8 border-slate-900">
      {/* Header WhatsApp Style */}
      <div className="bg-[#075E54] p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Bot size={24}/></div>
          <div>
            <p className="font-bold text-sm">סידור ח.סבן - מוח PRO</p>
            <p className="text-[10px] opacity-70 italic">מחובר לספר החוקים 24/7</p>
          </div>
        </div>
        <div className="flex gap-3 opacity-70"><Video size={18}/><Phone size={18}/><MoreVertical size={18}/></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://i.ibb.co/S6668jn/whatsapp-bg.png')]">
        {messages.map((m) => (
          <motion.div key={m.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`p-2 px-3 rounded-xl max-w-[85%] shadow-sm relative ${m.role === 'user' ? 'bg-white' : 'bg-[#DCF8C6]'}`}>
              <p className="text-sm font-medium pb-2 text-slate-800">{m.text}</p>
              <div className="flex justify-end items-center gap-1">
                <span className="text-[9px] text-slate-400">{m.time}</span>
                {m.role === 'ai' && <CheckCheck size={12} className="text-blue-500"/>}
              </div>
            </div>
          </motion.div>
        ))}
        {isAiThinking && <div className="text-[10px] font-bold text-slate-500 animate-pulse text-center">המוח ברוטציית מודלים...</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="bg-[#F0F0F0] p-3 flex items-center gap-2">
        <Smile size={24} className="text-slate-500" />
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="הקלד הודעה..." 
          className="flex-1 h-10 rounded-full border-none shadow-sm font-bold text-sm"
        />
        <Button onClick={handleSend} className="w-10 h-10 rounded-full bg-[#128C7E] p-0 shadow-lg shrink-0">
          <Send size={18} className="text-white transform rotate-180" />
        </Button>
      </div>
    </div>
  );
}
