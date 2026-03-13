"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, Mic, Send, User, RotateCcw, Zap, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

export default function SabanAI() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // טעינת היסטוריית שיחות מהזיכרון המקומי
  useEffect(() => {
    const saved = localStorage.getItem('saban_ai_history');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // שמירה לזיכרון בכל עדכון
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
      // 1. שליפת נתונים עדכניים מהטבלה לצורך ה-Context
      const { data: schedule } = await supabase.from('saban_dispatch').select('*');
      
      // 2. קריאה ל-API (כאן אנחנו שולחים את השאלה + הנתונים מהטבלה)
      const response = await fetch('/api/ai/consult', {
        method: 'POST',
        body: JSON.stringify({
          question: userMsg,
          context: schedule, // המוח מקבל את כל הטבלה און-ליין
          history: messages.slice(-5) // זוכר 5 הודעות אחרונות
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      toast.error("שגיאה בתקשורת עם המוח");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-[#0B2C63] p-6 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-xl"><Bot size={24} /></div>
          <div>
            <h1 className="font-black text-xl italic">SABAN AI</h1>
            <p className="text-[10px] text-blue-200 font-bold">מחובר און-ליין לסידור העבודה</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => {setMessages([]); localStorage.removeItem('saban_ai_history');}} className="text-blue-200">
          <RotateCcw size={18} />
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={i} 
            className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm font-bold text-sm ${
              m.role === 'user' 
                ? 'bg-white text-slate-800 rounded-tr-none' 
                : 'bg-blue-600 text-white rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {isTyping && <div className="text-xs font-black text-blue-600 animate-pulse italic">ג'ימני סורק את הטבלה...</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 pb-8">
        <div className="max-w-4xl mx-auto flex gap-2 items-center">
          <div className="relative flex-1">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'ENTER' && askGemini()}
              placeholder="שאל אותי: מי פנוי מחר ב-09:00?"
              className="h-14 rounded-2xl pr-4 pl-12 border-slate-200 shadow-inner font-bold"
            />
            <button className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
              <Mic size={22} />
            </button>
          </div>
          <Button onClick={askGemini} className="h-14 w-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Send size={22} />
          </Button>
        </div>
      </div>
    </div>
  );
}
