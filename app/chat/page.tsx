"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Settings, Zap, Phone, Search, Ruler, RotateCcw, Loader2 
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";

/**
 * Saban OS V9.6.1 - Production Build Success
 * נתיב מוח מחובר: /api/pro_brain
 * תיקון: הבטחת הצהרת async תקינה וסגירת Scope הרמטית.
 */

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const phone = "972508860896";

  // 1. אתחול סשן וטעינת היסטוריה מה-DB (Persistent)
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
              content: 'אהלן ראמי, המוח המקצועי מחובר ל-DB ומחכה לפקודה. מה נבצע היום? 🦾', 
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

  // גלילה אוטומטית
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 2. פונקציית שליחה - מוגדרת כ-async בצורה מפורשת לתיקון בילד
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
      // קריאה למוח הפרו בנתיב המדויק: /api/pro_brain
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
      
      if (!res.ok) throw new Error("Brain disconnection");
      
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
      console.error("API Failure:", error);
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
    <div className="flex h-screen bg-[#050505] text-slate-200 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar */}
      <aside className="w-[320px] border-l border-white/5 bg-zinc-950/50 hidden lg:flex flex-col shadow-2xl z-20">
        <header className="p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20">S</div>
            <div>
              <h1 className="font-black text-lg tracking-tighter uppercase italic leading-none">SABAN PRO</h1>
              <p className="text-[9px] font-bold text-blue-500 uppercase mt-1">Brain V9.6.1 Active</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1 text-right">סניף מרכזי</span>
            <p className="text-sm font-black text-white text-right">{phone}</p>
          </div>
          
          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
            <p className="text-[10px] text-blue-500 font-bold uppercase mb-2 tracking-widest text-right">מזהה סנכרון</p>
            <p className="text-[10px] font-mono opacity-40 truncate text-right">{sessionId}</p>
          </div>

          <button 
            onClick={resetSession}
            className="w-full p-4 bg-rose-500/10 text-rose-500 rounded-2xl text-xs font-black hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> איפוס שיחה
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-zinc-950">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-zinc-900/20 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4 text-right">
            <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black italic shadow-lg">S</div>
            <div>
              <h2 className="text-lg font-black italic uppercase tracking-tighter">Saban Consulting Pro</h2>
              <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> המוח מחובר לביצוע
              </div>
            </div>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 scrollbar-hide">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-[24px] shadow-2xl border ${
                m.role === 'user' 
                  ? 'bg-zinc-900 border-white/5 text-slate-100 rounded-tr-none text-right' 
                  : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none text-right'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                <span className="text-[8px] font-bold text-slate-600 mt-3 block uppercase opacity-40 text-left">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end animate-pulse">
              <div className="bg-white/5 p-3 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg">
                <Loader2 className="animate-spin text-blue-500" size={14} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter italic">המוח מעבד פקודה...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Composer */}
        <footer className="p-6 absolute bottom-0 w-full z-20 bg-gradient-to-t from-black via-zinc-950/90 to-transparent pt-10">
          <div className="max-w-4xl mx-auto bg-zinc-900 border border-white/10 p-2 rounded-[32px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex items-center gap-2 backdrop-blur-md">
             <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב פקודה למוח הפרו..." 
              className="flex-1 bg-transparent px-6 py-3 outline-none font-bold text-sm text-right text-white placeholder-zinc-700"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(input);
              }}
            />
            <button 
              onClick={() => handleSendMessage(input)} 
              disabled={isLoading}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 rounded-full flex items-center justify-center text-white transition-all active:scale-90 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
