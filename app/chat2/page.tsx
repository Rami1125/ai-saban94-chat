"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Search, Building2, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- 1. רכיבי עזר (חובה להוציא מחוץ לפונקציה הראשית) ---

const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
};

// התיקון לשגיאה שלך: וודא שיש תוכן בתוך הסוגריים
const SabanLoader = () => (
  <div className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
      <Search size={14} className="animate-spin" />
      <span className="animate-pulse">סורק מלאי ולוגיסטיקה...</span>
    </div>
    <div className="flex gap-1 justify-center">
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
    </div>
  </div>
);

// --- 2. הקומפוננטה הראשית ---

export default function SabanChat2() {
  const [userName, setUserName] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('saban_user_name');
    const savedHistory = localStorage.getItem('saban_chat_history');
    if (savedName) setUserName(savedName);
    if (savedHistory) {
      try {
        setMessages(JSON.parse(savedHistory));
      } catch (e) {
        setMessages([]);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('saban_chat_history', JSON.stringify(messages));
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], userName }),
      });

      const data = await response.json();
      const assistantMsg = { role: 'assistant', content: data.answer || data.text };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Build failure check:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get('name') as string;
    if (name?.trim()) {
      localStorage.setItem('saban_user_name', name.trim());
      setUserName(name.trim());
    }
  };

  if (!userName) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <Card className="w-full max-w-md p-8 bg-white border-slate-200 rounded-[2.5rem] shadow-xl text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 italic">ח. סבן</h2>
          <form onSubmit={handleStart} className="space-y-4">
            <Input name="name" required placeholder="איך קוראים לך?" className="h-14 rounded-2xl bg-slate-50 text-center font-bold" />
            <button className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black transition-all active:scale-95">כניסה 🦾</button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900" dir="rtl">
      <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
        <span className="font-black italic text-slate-900 text-lg">ח. סבן | לוגיסטיקה</span>
        <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full">{userName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-sm ${
                m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 rounded-bl-none'
            }`}>
              {m.role === 'assistant' && i === messages.length - 1 ? (
                <TypewriterEffect text={m.content} />
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <SabanLoader />}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t">
        <div className="relative max-w-4xl mx-auto flex gap-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="מה נבצע היום?"
            className="h-14 rounded-2xl bg-slate-50 font-bold"
          />
          <button onClick={sendMessage} disabled={isLoading} className="bg-blue-600 p-4 rounded-2xl text-white disabled:opacity-50">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
