"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Search, Building2, MapPin } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- רכיב אפקט הקלדה ---
const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 15); // מהירות הקלדה
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
};

// --- רכיב אפקט חשיבה ---
const ThinkingLoader = () => (
  <div className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs animate-pulse">
      <Search size={14} className="animate-spin" />
      <span>סורק מלאי ולוגיסטיקה...</span>
    </div>
    <div className="flex gap-1 justify-center">
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
    </div>
  </div>
);

export default function SabanChat() {
  const [userName, setUserName] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('saban_user_name');
    const savedHistory = localStorage.getItem('saban_chat_history');
    if (savedName) setUserName(savedName);
    if (savedHistory) setMessages(JSON.parse(savedHistory));
  }, []);

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userName) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <Card className="w-full max-w-md p-8 bg-white border-slate-200 rounded-[2.5rem] shadow-xl text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <Building2 className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 italic">ברוכים הבאים לח. סבן</h2>
          <p className="text-slate-500 mb-8 font-medium text-sm">איך אפשר לקרוא לך?</p>
          <form onSubmit={handleStart} className="space-y-4">
            <Input name="name" required placeholder="השם שלך..." className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 text-center font-bold focus:ring-2 focus:ring-blue-500" />
            <button className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">יאללה, בוא נתחיל 🦾</button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-white" />
            </div>
            <span className="font-black italic text-slate-900 text-lg tracking-tight">ח. סבן | לוגיסטיקה</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <User size={14} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-600">{userName}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.8rem] text-sm md:text-base shadow-sm ${
                m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none font-bold' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none font-medium'
            }`}>
              {m.role === 'assistant' && i === messages.length - 1 ? (
                <TypewriterEffect text={m.content} />
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <ThinkingLoader />}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative max-w-4xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={`מה להזמין לך, ${userName}?`}
                className="h-14 pr-4 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
            <button 
                onClick={sendMessage} 
                disabled={isLoading}
                className="absolute left-2 top-2 bg-blue-600 p-2.5 rounded-xl text-white shadow-md hover:bg-blue-700 transition-all active:scale-90 disabled:opacity-50"
            >
                <Send size={18} />
            </button>
          </div>
        </div>
        <div className="text-[10px] text-center mt-3 text-slate-400 font-bold uppercase tracking-widest italic">
            Saban App • Real-time Logistics Dashboard
        </div>
      </div>
    </div>
  );
}
