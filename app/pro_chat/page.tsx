"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, Bot, ShoppingCart, Package } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';

export default function ProChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. ניהול Session וטעינת היסטוריה בעלייה
  useEffect(() => {
    let sid = localStorage.getItem('saban_session_id');
    if (!sid) {
      sid = `sid_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('saban_session_id', sid);
    }
    setSessionId(sid);
    loadHistory(sid);
  }, []);

  const loadHistory = async (sid: string) => {
    const { data } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sid)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userQuery = input;
    setInput("");
    setLoading(true);

    // הוספה מקומית למסך
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);

    try {
      const res = await fetch('/api/ai/pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, query: userQuery })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic">S</div>
          <div>
            <h1 className="font-black text-slate-900 leading-none">SABAN PRO</h1>
            <span className="text-[10px] text-emerald-500 font-bold uppercase">Online History Sync</span>
          </div>
        </div>
        <div className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-mono text-slate-400">ID: {sessionId}</div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm border ${
              m.role === 'user' ? 'bg-white border-slate-200' : 'bg-blue-600 text-white border-blue-500'
            }`}>
              <p className="text-sm leading-relaxed">{m.content}</p>
            </div>
          </motion.div>
        ))}
        {loading && <div className="text-center italic text-slate-400 text-xs animate-pulse">ג'ימני מעבד נתונים...</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input 
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="דבר עם המוח המקצועי..."
            className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-blue-500 font-bold"
          />
          <button 
            onClick={handleSend} disabled={loading}
            className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
