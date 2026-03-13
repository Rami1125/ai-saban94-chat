"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SabanChat() {
  const [userName, setUserName] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. טעינת נתונים מהזיכרון בטעינה ראשונה
  useEffect(() => {
    const savedName = localStorage.getItem('saban_user_name');
    const savedHistory = localStorage.getItem('saban_chat_history');
    if (savedName) setUserName(savedName);
    if (savedHistory) setMessages(JSON.parse(savedHistory));
  }, []);

  // 2. שמירת היסטוריה בכל שינוי בהודעות
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('saban_chat_history', JSON.stringify(messages));
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleStart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get('name') as string;
    if (name.trim()) {
      localStorage.setItem('saban_user_name', name.trim());
      setUserName(name.trim());
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg], 
          userName 
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // מסך כניסה (פעם ראשונה בלבד)
  if (!userName) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050A18] p-6" dir="rtl">
        <Card className="w-full max-w-md p-8 bg-[#0F172A] border-blue-500/20 rounded-[2.5rem] shadow-2xl text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <User className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 italic">אהלן! מי אנחנו?</h2>
          <p className="text-slate-400 mb-8 font-bold">הכנס שם כדי שנתחיל לעבוד</p>
          <form onSubmit={handleStart} className="space-y-4">
            <Input name="name" required placeholder="השם שלך..." className="h-14 rounded-2xl bg-slate-800 border-white/5 text-white text-center font-black" />
            <button className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-500 transition-all">יאללה, בוא נתחיל 🦾</button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#050A18] text-white" dir="rtl">
      {/* Header */}
      <div className="p-4 bg-[#0F172A] border-b border-white/5 flex justify-between items-center">
        <span className="font-black italic underline decoration-blue-500 text-lg">ח. סבן | לוגיסטיקה</span>
        <span className="text-xs font-bold text-slate-400">שלום, {userName} 👋</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] font-bold ${m.role === 'user' ? 'bg-blue-600' : 'bg-[#0F172A] border border-white/5'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && <Loader2 className="animate-spin text-blue-500 mx-auto" />}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0F172A]">
        <div className="relative max-w-4xl mx-auto">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`מה להזמין לך, ${userName}?`}
            className="h-16 pr-12 rounded-2xl bg-slate-800 border-none text-white font-bold"
          />
          <button onClick={sendMessage} className="absolute left-3 top-3 bg-blue-600 p-2 rounded-xl text-white">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
