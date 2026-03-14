"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Search, Building2, MapPin, Loader2 } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- רכיב אפקט הקלדה מוגן מקריסות ---
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

// --- רכיב אפקט חשיבה לוגיסטי ---
const SabanLoader = () => (
  <div className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm animate-in fade-in slide-in-from-bottom-2">
    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
      <Search size={14} className="animate-spin" />
      <span className="animate-pulse">סורק מלאי ומחשב מרחקי הובלה...</span>
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
  const [messages, setMessages] = useState<any[]>([]); // מאותחל כמערך ריק למניעת שגיאת length
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // טעינת נתונים בטוחה
  useEffect(() => {
    const savedName = localStorage.getItem('saban_user_name');
    const savedHistory = localStorage.getItem('saban_chat_history');
    
    if (savedName) setUserName(savedName);
    
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch (e) {
        console.error("History parse error", e);
        setMessages([]);
      }
    }
  }, []);

  // גלילה אוטומטית ושמירה
  useEffect(() => {
    localStorage.setItem('saban_chat_history', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get('name') as string;
    if (name?.trim()) {
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
          userName,
          // כאן אפשר להוסיף travelInfo אם שלפת אותו מה-Client
        }),
      });
      
      const data = await res.json();
      const aiText = data.answer || data.text || "סליחה, יש תקלה בתקשורת.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userName) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6" dir="rtl">
        <Card className="w-full max-w-md p-8 bg-white border-slate-200 rounded-[2.5rem] shadow-2xl text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100">
            <Building2 className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 italic underline decoration-blue-500 decoration-4">ח. סבן לוגיסטיקה</h2>
          <p className="text-slate-500 mb-8 font-bold">אהלן! איך קוראים לך?</p>
          <form onSubmit={handleStart} className="space-y-4">
            <Input name="name" required placeholder="השם שלך..." className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-center font-bold text-lg" />
            <button className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95">כניסה למערכת 🦾</button>
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
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
                <Building2 size={20} className="text-white" />
            </div>
            <div>
                <h1 className="font-black italic text-slate-900 text-lg leading-none">ח. סבן</h1>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Smart Logistics AI</span>
            </div>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-slate-700">{userName}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-[2rem] shadow-sm ${
                m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-blue-100 font-bold' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none font-medium'
            }`}>
              {m.role === 'assistant' && i === messages.length - 1 ? (
                <TypewriterEffect text={m.content} />
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <SabanLoader />}
        <div ref={scrollRef} />
      </div>

      {/* Footer Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative max-w-4xl mx-auto">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`מה נבצע היום, ${userName}?`}
            className="h-16 pr-6 pl-16 rounded-[1.5rem] bg-slate-50 border-slate-200 text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
          />
          <button 
            onClick={sendMessage} 
            disabled={isLoading}
            className="absolute left-2 top-2 bg-blue-600 p-3.5 rounded-2xl text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-90 transition-all disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-[9px] text-center mt-3 text-slate-400 font-black italic">
            Saban Logistics Management System v4.0 • Real-time AI Assistant
        </div>
      </div>
    </div>
  );
}
