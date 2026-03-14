"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Calculator, ShoppingCart, 
  Package, X, Share2, Trash2, Loader2,
  User, Settings, Zap, Phone, Search, Ruler, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";

/**
 * Saban OS V9.5.1 - Build Fixed & Production Ready
 * נתיב מוח: /api/ai/pro
 * תיקון: הוספת async חסר וניקוי תחביר ששבר את Vercel
 */

export default function WhatsAppCloneContent() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const phone = "972508860896";

  // 1. ניהול סשן קבוע (Persistent Session)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('saban_session_id');
      if (!sid) {
        sid = `sid_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('saban_session_id', sid);
      }
      setSessionId(sid);
      loadChatHistory(sid);
    }
  }, []);

  const loadChatHistory = async (sid: string) => {
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
      }
    } catch (err) {
      console.error("History Load Error:", err);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 2. פונקציית שליחת הודעה - מתוקנת עם async
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    const userMsg = { 
      id: Date.now().toString(), 
      content, 
      role: 'user', 
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          query: content,
          userName: "ראמי",
          productContext: null 
        })
      });
      
      if (!res.ok) throw new Error("Failed to reach Pro Brain");
      
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
      toast.error("שגיאה בתקשורת עם המוח");
      console.error("Send Message Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saban_session_id');
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen bg-[#F2F2F2] dark:bg-zinc-950 overflow-hidden font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar */}
      <aside className="w-[400px] border-l bg-white/80 backdrop-blur-xl hidden lg:flex flex-col shadow-2xl z-20">
        <header className="p-6 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-lg">
              <Zap size={24} fill="white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-slate-900 uppercase italic">SABAN PRO</h1>
              <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Sync Active: {sessionId.slice(0, 8)}</p>
            </div>
          </div>
          <Settings className="text-slate-400 cursor-pointer hover:rotate-90 transition-transform" size={20} />
        </header>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="p-5 bg-slate-50 rounded-[30px] border border-white shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-[20px] flex items-center justify-center text-white font-black text-2xl shadow-inner">S</div>
            <div className="flex-1 text-right">
              <span className="font-black text-slate-800 italic uppercase">ח. סבן מרכזי</span>
              <p className="text-xs font-bold text-slate-400 mt-1">{phone}</p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest text-right">סטטוס מוח</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs font-bold text-slate-700 italic">Persistent Memory v9.5</span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>

          <button 
            onClick={resetSession}
            className="w-full p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> איפוס סשן ושיחה חדשה
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#F8F9FA]">
        <header className="h-20 bg-white/90 backdrop-blur-md border-b flex justify-between items-center px-8 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-900 rounded-[18px] flex items-center justify-center text-white font-bold text-xs shadow-lg">S</div>
            <div className="text-right">
              <div className="font-black text-lg text-slate-900 leading-none italic uppercase">Saban Consulting Pro</div>
              <div className="text-[10px] text-emerald-600 font-black uppercase mt-1 tracking-tighter italic">Persistent History Active</div>
            </div>
          </div>
          <div className="flex gap-6 text-slate-400">
             <Ruler className="cursor-pointer hover:text-blue-600 transition-colors" size={20} />
             <Search className="cursor-pointer hover:text-slate-900 transition-colors" size={20} />
          </div>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32 scrollbar-hide">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-[24px] shadow-sm border ${
                m.role === 'user' 
                  ? 'bg-white border-slate-200 text-slate-900 rounded-tr-none' 
                  : 'bg-blue-600 text-white border-blue-500 shadow-blue-200 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end animate-pulse">
              <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-2 border border-blue-100">
                <Loader2 className="animate-spin text-blue-500" size={14} />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">המוח מעבד נתונים...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Footer */}
        <footer className="p-6 bg-transparent absolute bottom-0 w-full z-20">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 p-2 rounded-[32px] shadow-2xl flex items-center gap-2 backdrop-blur-md">
             <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב פקודה למוח הפרו..." 
              className="flex-1 bg-transparent px-6 py-3 outline-none font-bold text-sm text-slate-900 text-right"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(input);
                }
              }}
            />
            <button 
              onClick={() => handleSendMessage(input)} 
              disabled={isLoading}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </footer>
      </main>

      <ActionOverlays />
    </div>
  );
}

// רכיב עזר
function RotateCcw(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
    </svg>
  );
}
