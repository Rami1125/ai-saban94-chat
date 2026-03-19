"use client";
import React, { useState, useEffect, useRef } from 'react';
import { SabanBrain } from "@/lib/saban-brain"; // תיקון הייבוא לנתיב הקיים
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, Bot, CheckCheck, Phone, Video, MoreVertical, 
  Smile, Paperclip, Loader2 
} from "lucide-react";
import { motion } from "framer-motion";

export default function SabanWhatsAppBot() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const currentTime = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: input, 
      time: currentTime 
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsAiThinking(true);

    try {
      // קריאה למוח המאוחד ב-lib/saban-brain.ts
      const response = await SabanBrain.ask(currentInput);

      const aiMsg = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: response, 
        time: currentTime 
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // הפעלת צליל התראה אם קיים ב-Layout
      if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#E5DDD5] font-sans" dir="rtl">
      {/* WhatsApp Header */}
      <div className="bg-[#075E54] p-4 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none flex items-center gap-2">
              סידור ח.סבן - מוח AI <Badge className="bg-blue-400 text-[8px] h-4">PRO</Badge>
            </h3>
            <p className="text-[10px] text-white/70">מחובר לספר החוקים • מענה 24/7</p>
          </div>
        </div>
        <div className="flex gap-4 opacity-80">
          <Video size={20} /><Phone size={18} /><MoreVertical size={20} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`relative max-w-[85%] p-2 px-3 rounded-xl shadow-sm ${
              msg.role === 'user' ? 'bg-white text-slate-800' : 'bg-[#DCF8C6] text-slate-800'
            }`}>
              <p className="text-sm font-medium pb-2">{msg.text}</p>
              <div className="flex justify-end items-center gap-1">
                <span className="text-[9px] text-slate-400 font-bold">{msg.time}</span>
                {msg.role === 'ai' && <CheckCheck size={12} className="text-blue-500" />}
              </div>
            </div>
          </motion.div>
        ))}

        {isAiThinking && (
          <div className="flex justify-end animate-pulse">
            <div className="bg-[#DCF8C6] p-3 rounded-xl flex items-center gap-2">
               <Loader2 size={14} className="animate-spin text-slate-500" />
               <span className="text-[10px] font-bold text-slate-500">המוח מעבד פקודה...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* WhatsApp Input Bar */}
      <div className="bg-[#F0F0F0] p-3 flex items-center gap-2">
        <div className="flex gap-3 text-slate-500 px-2">
           <Smile size={24} />
           <Paperclip size={24} />
        </div>
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="כתוב הודעה לסידור..."
          className="flex-1 h-10 rounded-full border-none shadow-sm font-bold text-sm px-4 focus-visible:ring-0"
        />
        <Button 
          onClick={handleSend}
          className="w-12 h-12 rounded-full bg-[#128C7E] hover:bg-[#075E54] p-0 shadow-lg flex items-center justify-center shrink-0"
        >
          <Send size={20} className="text-white transform rotate-180" />
        </Button>
      </div>
    </div>
  );
}
