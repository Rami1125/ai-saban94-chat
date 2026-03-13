"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, RotateCcw, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";

// ייבוא הרכיבים היוקרתיים שבנינו
import ProductStoreCard from "@/components/chat/ProductStoreCard";
import SabanWhatsAppButton from "@/components/ui/SabanWhatsAppButton";

export default function SabanAI() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  useEffect(() => {
    const saved = localStorage.getItem('saban_ai_history');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('saban_ai_history', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askGemini = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    setIsTyping(true);

    try {
      const { data: inventory } = await supabase.from('inventory').select('*');
      
      const response = await fetch('/api/ai/consult', {
        method: 'POST',
        body: JSON.stringify({
          question: userMsg,
          context: inventory,
          history: messages.slice(-5)
        })
      });

      const data = await response.json();
      
      // המוח מחזיר תשובה שכוללת גם טקסט וגם נתוני פעולה (JSON בתוך הטקסט)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        product: data.product_data || null, // נתונים לכרטיס חנות
        showSikaContact: data.show_sika_contact || false // האם להציג את אלי
      }]);
    } catch (error) {
      toast.error("שגיאה בתקשורת עם המוח");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050A18]" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header יוקרתי */}
      <div className="bg-[#0F172A] p-6 text-white flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-500/20"><Bot size={24} /></div>
          <div>
            <h1 className="font-black text-xl italic tracking-tighter">SABAN AI <span className="text-blue-500 text-xs">V2</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Enterprise Logistics Control</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => {setMessages([]); localStorage.removeItem('saban_ai_history');}} className="text-slate-400 hover:text-white">
          <RotateCcw size={18} />
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={i} 
            className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}
          >
            {/* בועת טקסט */}
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-2xl font-medium text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-white text-slate-900 rounded-tr-none' 
                : 'bg-blue-600 text-white rounded-tl-none'
            }`}>
              {m.content}
            </div>

            {/* הצגת כרטיס מוצר אם המוח זיהה */}
            {m.product && (
              <div className="mt-4 w-full flex justify-end">
                <ProductStoreCard product={m.product} />
              </div>
            )}

            {/* הצגת כפתור אלי מסיקה אם המוח החליט */}
            {m.showSikaContact && (
              <div className="mt-4 w-full flex justify-end">
                <SabanWhatsAppButton 
                   label="דבר עם אלי מסיקה (סיקה)" 
                   showQuestion={true}
                />
              </div>
            )}
          </motion.div>
        ))}
        {isTyping && <div className="text-[10px] font-black text-blue-500 animate-pulse mr-4">המוח מנתח נתוני מלאי ומשקלים...</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-[#0F172A] border-t border-white/5 pb-10">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          <div className="relative flex-1">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askGemini()}
              placeholder="שאל על מוצר, חישוב גבס או סידור..."
              className="h-16 rounded-2xl pr-4 pl-14 bg-slate-800/50 border-white/5 text-white placeholder:text-slate-500 font-bold focus:ring-2 focus:ring-blue-600"
            />
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors">
              <Mic size={24} />
            </button>
          </div>
          <Button onClick={askGemini} className="h-16 w-16 rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-transform active:scale-95">
            <Send size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}
