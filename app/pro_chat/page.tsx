"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Settings, Zap, Phone, Search, Ruler, 
  User, CheckCircle2, Loader2, Sparkles, LayoutGrid
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V9.7.0 - Premium Pro Edition
 * עיצוב בהיר מקצועי | אפקט הקלדה | ללא כפתור איפוס
 * נתיב מוח: /api/pro_brain
 */

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const phone = "972508860896";

  // 1. אתחול סשן וטעינת היסטוריה
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('saban_session_id');
      if (!sid) {
        sid = `sid_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('saban_session_id', sid);
      }
      setSessionId(sid);
      
      const loadHistory = async () => {
        try {
          const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .eq('session_id', sid)
            .order('created_at', { ascending: true });
          
          if (data && !error) {
            setMessages(data.map(m => ({
              id: m.id,
              content: m.content,
              role: m.role,
              timestamp: new Date(m.created_at).getTime()
            })));
          } else {
            setMessages([{ 
              id: 'init', 
              role: 'bot', 
              content: 'אהלן ראמי הבוס, המוח המקצועי מסונכרן לביצוע. איך נתקדם היום? 🦾', 
              timestamp: Date.now() 
            }]);
          }
        } catch (e) {
          console.error("History load error", e);
        }
      };
      loadHistory();
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 2. פונקציית שליחה עם אפקטים
  const handleSendMessage = async (text: string) => {
    const cleanText = text?.trim();
    if (!cleanText || isLoading) return;
    
    const userMsg = { 
      id: Date.now().toString(), 
      content: cleanText, 
      role: 'user', 
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: sessionId,
          query: cleanText,
          userName: "ראמי",
          history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Brain Internal Error");
      }
      
      const data = await res.json();
      
      if (data.answer) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: data.answer,
          role: 'assistant',
          timestamp: Date.now()
        }]);
      }
    } catch (error: any) {
      toast.error("תקלה בחיבור למוח: " + error.message);
      console.error("API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden selection:bg-blue-100" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar - Premium Light */}
      <aside className="w-[320px] border-l border-slate-200 bg-white hidden lg:flex flex-col shadow-sm z-20">
        <header className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-blue-200 ring-4 ring-blue-50">
            <Zap size={24} fill="white" />
          </div>
          <div className="text-right">
            <h1 className="font-black text-xl tracking-tight text-slate-800 uppercase italic leading-none">Saban Pro</h1>
            <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase mt-1">V9.7 Active</p>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          <div className="p-5 bg-slate-50 rounded-[28px] border border-white shadow-sm transition-all hover:shadow-md">
            <span className="text-[10px] text-slate-400 font-black uppercase block mb-1 tracking-tighter">מרלו"ג מרכזי</span>
            <p className="text-sm font-black text-slate-700 italic">החרש 10, רמלה</p>
          </div>

          <div className="p-5 bg-blue-50/50 rounded-[28px] border border-blue-100/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-blue-600 uppercase">סטטוס מוח</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-slate-600 italic truncate">סנכרון DB מלא</p>
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-slate-50">
           <div className="flex justify-between items-center px-2">
              <div className="flex gap-3">
                 <Settings size={18} className="text-slate-300 hover:text-blue-600 cursor-pointer transition-colors" />
                 <LayoutGrid size={18} className="text-slate-300 hover:text-blue-600 cursor-pointer transition-colors" />
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase italic">By Saban Dev</p>
           </div>
        </footer>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-white lg:rounded-r-[40px] shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-50 px-10 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4 text-right">
            <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black italic text-white shadow-lg">S</div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tighter uppercase italic">Saban Consulting Pro</h2>
              <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 
                מחובר כראמי הבוס
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 cursor-pointer transition-all hover:scale-110 active:scale-95">
                <Search size={20} />
             </div>
             <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 cursor-pointer transition-all hover:scale-110 active:scale-95">
                <Phone size={20} />
             </div>
          </div>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-32 scrollbar-hide bg-[#FDFDFD]">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] md:max-w-[75%] p-6 rounded-[32px] shadow-sm border ${
                  m.role === 'user' 
                    ? 'bg-white border-slate-100 text-slate-800 rounded-tr-none shadow-slate-100/50' 
                    : 'bg-blue-600 text-white border-blue-500 rounded-tl-none shadow-blue-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2 opacity-50">
                    {m.role === 'user' ? <User size={12} /> : <Zap size={12} fill="currentColor" />}
                    <span className="text-[9px] font-black uppercase tracking-widest">
                       {m.role === 'user' ? 'ראמי' : 'המוח'}
                    </span>
                  </div>
                  <p className="text-[15px] leading-[1.6] whitespace-pre-wrap font-medium">{m.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Effect */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <div className="bg-blue-50 p-5 rounded-[24px] flex items-center gap-3 border border-blue-100 shadow-sm">
                <div className="flex gap-1">
                   <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                   <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                   <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                </div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter italic">המוח מחשב ביצוע...</span>
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Composer - Premium Floating */}
        <footer className="p-8 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white/95 to-transparent pt-12">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 p-2 rounded-[35px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-center gap-3 ring-8 ring-slate-50/50 backdrop-blur-md">
             <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב פקודה לביצוע ראמי..." 
              className="flex-1 bg-transparent px-8 py-4 outline-none font-bold text-sm text-slate-800 placeholder-slate-300 text-right"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(input);
              }}
            />
            <button 
              onClick={() => handleSendMessage(input)} 
              disabled={isLoading}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 rounded-[25px] flex items-center justify-center text-white transition-all active:scale-90 shadow-lg shadow-blue-200"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
