"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Phone, Search, Loader2, Sparkles, User, ShieldCheck, 
  MessageSquare, LayoutDashboard, ExternalLink, Clock, Users, 
  CheckCircle2, ShoppingCart, Image as ImageIcon, ChevronRight
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V10.1 - Semi-Transparent Glass Edition
 * -------------------------------------------
 * שיפורים: רקעים כחולים שקופים למחצה עם אפקט טשטוש (Glassmorphism),
 * שמירה על ניגודיות טקסט גבוהה.
 */

const WhatsAppOrderButton = ({ summary }: { summary: string }) => {
  const sendToWhatsApp = () => {
    const text = encodeURIComponent(`🏗️ *סיכום הזמנה לביצוע - ח. סבן*\n\n${summary}\n\n*נשלח מהמוח הלוגיסטי*`);
    window.open(`https://wa.me/972508860896?text=${text}`, '_blank');
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={sendToWhatsApp}
      className="w-full mt-4 bg-[#25D366]/90 backdrop-blur-sm hover:bg-[#20ba5a] text-white py-4 rounded-[22px] font-black flex items-center justify-center gap-3 shadow-xl shadow-green-100 border-b-4 border-green-700 transition-all"
    >
      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      שלח סיכום ל-WhatsApp של ראמי
    </motion.button>
  );
};

const SmartMessageRenderer = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  const isOrderSummary = text.includes("סיכום הזמנה") || text.includes("הזמנה לביצוע");

  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
        if (imgMatch) {
          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <img src={imgMatch[1]} alt="Product" className="w-full h-56 object-contain rounded-[28px] bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md p-4" />
            </motion.div>
          );
        }

        if (line.trim().startsWith('###')) {
          return (
            <h3 key={i} className="text-blue-700 font-black text-lg pt-2 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
              {line.replace('###', '').trim()}
            </h3>
          );
        }

        const btnMatch = line.match(/\[(.*?)\]\((.*?)\)/);
        if (btnMatch && !line.includes("![")) {
          return (
            <a 
              key={i} href={btnMatch[2]} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-blue-50/80 backdrop-blur-sm hover:bg-blue-100 text-blue-800 px-5 py-3 rounded-2xl border border-blue-200 font-black text-sm transition-all shadow-sm"
            >
              {btnMatch[1]}
              <ChevronRight size={14} />
            </a>
          );
        }

        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[15px] leading-relaxed text-slate-950 font-medium">
            {parts.map((part, j) => 
              part.startsWith('**') 
                ? <strong key={j} className="text-black font-black underline decoration-blue-500/30 underline-offset-4">{part.slice(2, -2)}</strong> 
                : part
            )}
          </p>
        );
      })}
      {isOrderSummary && <WhatsAppOrderButton summary={text} />}
    </div>
  );
};

export default function SabanOSV10() {
  const [view, setView] = useState<'chat' | 'monitor'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sid = localStorage.getItem('saban_session_id') || `sid_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('saban_session_id', sid);
      setSessionId(sid);

      const loadHistory = async () => {
        const { data } = await supabase.from('chat_history').select('*').eq('session_id', sid).order('created_at', { ascending: true });
        if (data && data.length > 0) setMessages(data);
        else setMessages([{ id: 'init', role: 'assistant', content: '### אהלן ראמי הבוס\nהמוח המקצועי מחובר ומחכה לפקודה. **מה נבצע היום?** 🦾' }]);
      };
      loadHistory();
    }

    const channel = supabase.channel('global_history').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_history' }, () => {
      if (view === 'monitor') fetchMonitorData();
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [view]);

  const fetchMonitorData = async () => {
    const { data } = await supabase.from('chat_history').select('*').order('created_at', { ascending: false });
    if (data) {
      const grouped = data.reduce((acc: any, m: any) => {
        if (!acc[m.session_id]) acc[m.session_id] = [];
        acc[m.session_id].push(m);
        return acc;
      }, {});
      setAllSessions(Object.entries(grouped));
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q, timestamp: Date.now() }]);
    setLoading(true);

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, query: q, history: messages.slice(-5) })
      });
      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer, timestamp: Date.now() }]);
      }
    } catch (e) {
      toast.error("תקלה בחיבור למוח");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-950 font-sans selection:bg-blue-200 overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <aside className="w-[300px] border-l border-slate-200 bg-white hidden lg:flex flex-col shadow-sm z-30">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-700/90 backdrop-blur-sm rounded-[20px] flex items-center justify-center text-white shadow-xl">
            <Zap size={24} fill="white" />
          </div>
          <div className="text-right">
            <h1 className="font-black text-xl tracking-tighter leading-none italic uppercase text-slate-900">SABAN OS</h1>
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mt-1">V10.1 Glass Edition</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          <button onClick={() => setView('chat')} className={`w-full p-4 rounded-2xl flex items-center gap-3 font-black transition-all ${view === 'chat' ? 'bg-blue-600/90 backdrop-blur-sm text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <MessageSquare size={20} /> צ'אט לקוח
          </button>
          <button onClick={() => { setView('monitor'); fetchMonitorData(); }} className={`w-full p-4 rounded-2xl flex items-center gap-3 font-black transition-all ${view === 'monitor' ? 'bg-blue-600/90 backdrop-blur-sm text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} /> מוניטור הזמנות
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white overflow-hidden shadow-2xl lg:rounded-r-[40px]">
        {view === 'chat' ? (
          <>
            <header className="h-20 border-b border-slate-100 px-10 flex items-center justify-between bg-white/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-600" size={22} />
                <div>
                  <h2 className="text-base font-black uppercase italic tracking-tighter text-slate-950">Saban Executive Brain</h2>
                  <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Live & Connected</div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-32 scrollbar-hide bg-[#FAFBFC]">
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-7 rounded-[38px] shadow-sm border ${
                      m.role === 'user' 
                        ? 'bg-white/95 backdrop-blur-sm border-slate-200 text-slate-950 rounded-tr-none shadow-md' 
                        : 'bg-blue-700/85 backdrop-blur-md text-white border-blue-800/30 rounded-tl-none shadow-blue-200/50 shadow-xl'
                    }`}>
                      <div className={`flex items-center gap-2 mb-3 ${m.role === 'user' ? 'text-slate-500' : 'text-blue-100'}`}>
                         {m.role === 'user' ? <User size={12} /> : <Zap size={12} fill="currentColor" />}
                         <span className="text-[10px] font-black uppercase tracking-widest">{m.role === 'user' ? 'ראמי' : 'המוח'}</span>
                      </div>
                      <SmartMessageRenderer text={m.content} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {loading && (
                <div className="flex justify-end">
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-[28px] border border-blue-200 flex items-center gap-4 shadow-md">
                    <Loader2 className="animate-spin text-blue-600" size={20} />
                    <span className="text-[11px] font-black text-blue-700 uppercase tracking-tighter italic">המוח מעבד פקודה...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <footer className="p-8 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-16">
              <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md border-2 border-slate-300 p-2 rounded-[40px] shadow-2xl flex items-center gap-3">
                 <input 
                  type="text" value={input} onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="כתוב פקודה לביצוע..." 
                  className="flex-1 bg-transparent px-8 py-5 outline-none font-black text-[16px] text-right text-black placeholder-slate-500" 
                />
                <button 
                  onClick={handleSend} disabled={loading}
                  className="w-16 h-16 bg-blue-700/90 backdrop-blur-sm hover:bg-blue-800 disabled:bg-slate-200 rounded-[30px] flex items-center justify-center text-white transition-all shadow-lg shadow-blue-300"
                >
                  <Send size={28} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <header className="h-20 bg-white border-b px-10 flex items-center justify-between shadow-sm">
               <h2 className="text-xl font-black text-slate-950 uppercase italic tracking-tighter text-right w-full">Live Monitor</h2>
               <div className="bg-emerald-100 text-emerald-800 px-6 py-2.5 rounded-full text-xs font-black shrink-0">{allSessions.length} פעילים</div>
            </header>
            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {allSessions.map(([sid, msgs]: any) => (
                <div key={sid} className="bg-white border-2 border-slate-200 rounded-[35px] p-7 shadow-lg flex flex-col h-[480px]">
                  <div className="mb-5 pb-5 border-b border-slate-100 font-black text-slate-950 text-xs">ID: {sid.slice(0,10)}</div>
                  <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide mb-6 pr-1">
                    {msgs.slice(-8).map((m: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-2xl text-[13px] font-bold ${m.role === 'user' ? 'bg-slate-100 text-slate-900' : 'bg-blue-50/80 text-blue-900 border border-blue-200'}`}>
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setSessionId(sid); setMessages(msgs); setView('chat'); }} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black shadow-lg">השתלט על שיחה</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
