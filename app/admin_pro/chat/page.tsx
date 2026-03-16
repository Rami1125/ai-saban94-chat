"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Zap, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight,
  X, Play, Clock, Hammer, Calculator, Smartphone, 
  ChevronLeft, Award, PlayCircle
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ai-Saban OS V20.0 - Elite Chat UI
 * -------------------------------------------
 * - Feature: Auto-parsing of [GALLERY] and [VIDEO] tags into a professional collage card.
 * - Technical Matrix: Displays drying time, coverage, and application method with icons.
 * - YouTube: Embedded player inside the chat bubble.
 */

const LOGO_PATH = "/ai.png";

// --- רכיב כרטיס מוצר Elite בתוך הצ'אט ---
const EliteProductCard = ({ 
  name, sku, urls, videoUrl, drying, coverage, method, onAdd 
}: any) => {
  
  const getYoutubeId = (url: string) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = videoUrl ? getYoutubeId(videoUrl) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="my-6 bg-slate-950 rounded-[45px] overflow-hidden border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.4)] w-full max-w-[440px] mx-auto group"
    >
      {/* 1. Collage Layout */}
      <div className="p-6">
        <div className="flex gap-3 h-52 md:h-64">
          <div className="flex-[2] bg-slate-800 rounded-[30px] overflow-hidden relative border border-white/5">
            {urls[0] ? <img src={urls[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Main" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={48}/></div>}
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase shadow-xl animate-pulse tracking-widest">Main Media</div>
          </div>
          <div className="flex-1 flex flex-col gap-3">
             <div className="flex-1 bg-slate-800 rounded-[22px] overflow-hidden border border-white/5">
                {urls[1] && <img src={urls[1]} className="w-full h-full object-cover" />}
             </div>
             <div className="flex-1 bg-slate-800 rounded-[22px] overflow-hidden border border-white/5">
                {urls[2] && <img src={urls[2]} className="w-full h-full object-cover" />}
             </div>
          </div>
        </div>
      </div>

      {/* 2. YouTube Integrated Player */}
      {videoId && (
        <div className="px-6 pb-6">
           <div className="aspect-video bg-black rounded-[35px] overflow-hidden border border-white/10 shadow-2xl relative">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1`} frameBorder="0" allowFullScreen />
              <div className="absolute top-3 right-3 bg-rose-600 text-white px-3 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg pointer-events-none">
                 <PlayCircle size={12} fill="currentColor"/> Guide
              </div>
           </div>
        </div>
      )}

      {/* 3. Content Area */}
      <div className="px-10 pb-10 space-y-8 text-right" dir="rtl">
        <div className="space-y-2">
           <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{name || "שם מוצר"}</h3>
           <div className="flex items-center gap-3">
              <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-white/10">SKU {sku || "0000"}</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 border border-emerald-500/20 shadow-sm"><ShieldCheck size={12}/> Saban DNA Approved</span>
           </div>
        </div>

        {/* Technical Data Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 border border-white/5 p-5 rounded-[30px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
              <p className="text-[10px] font-black text-slate-500 uppercase italic mb-2 tracking-widest">זמן ייבוש</p>
              <p className="text-lg font-black text-white italic tracking-tighter flex items-center justify-center gap-2">
                 <Clock size={16} className="text-blue-500"/> {drying || "--"}
              </p>
           </div>
           <div className="bg-white/5 border border-white/5 p-5 rounded-[30px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
              <p className="text-[10px] font-black text-slate-500 uppercase italic mb-2 tracking-widest">כושר כיסוי</p>
              <p className="text-lg font-black text-blue-400 italic tracking-tighter leading-none">
                 {coverage || "--"}
              </p>
           </div>
        </div>

        {/* Specialist Advice Bubble */}
        <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[35px] relative overflow-hidden shadow-inner group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full" />
           <div className="relative z-10 flex items-center justify-between mb-4">
              <span className="text-[11px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-2"><Award size={14} className="animate-pulse"/> Saban Specialist</span>
              <Hammer size={16} className="text-blue-500/30" />
           </div>
           <p className="text-white text-[15px] font-bold leading-relaxed opacity-80 italic">
              "שיטת יישום: {method || 'נא להגדיר שיטת יישום בדף המנהל'}"
           </p>
        </div>

        <button 
          onClick={() => onAdd(sku)}
          className="w-full bg-white text-slate-950 py-7 rounded-[40px] font-black text-[12px] uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-5 border-b-8 border-slate-200 active:scale-95 transition-all italic hover:bg-blue-50"
        >
          הוסף להזמנה <ShoppingCart size={24} className="text-blue-600" />
        </button>
      </div>
    </motion.div>
  );
};

// --- מפענח הודעות חכם ---
const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;

  // חילוץ נתונים מהודעת ה-AI
  const galleryMatch = text.match(/\[GALLERY:\s*([\s\S]*?)\]/i);
  const videoMatch = text.match(/\[VIDEO:\s*(.*?)\s*\]/i) || text.match(/https:\/\/youtu\.be\/[^\s\)]+/i);
  const skuMatch = text.match(/\[QUICK_ADD:(.*?)\]/);
  
  const urls = galleryMatch ? galleryMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 0) : [];
  const videoUrl = videoMatch ? (Array.isArray(videoMatch) ? videoMatch[1] : videoMatch[0]) : null;
  const sku = skuMatch ? skuMatch[1] : null;

  // חילוץ תכונות טכניות מהטקסט (אם ה-AI מזריק אותן)
  const drying = text.match(/\*\*זמן ייבוש:\*\* (.*?)\n/)?.[1];
  const coverage = text.match(/\*\*כושר כיסוי:\*\* (.*?)\n/)?.[1];
  const method = text.match(/\*\*שיטת יישום:\*\* (.*?)\n/)?.[1];

  const cleanText = text
    .replace(/\[GALLERY:.*?\]/gi, '')
    .replace(/\[VIDEO:.*?\]/gi, '')
    .replace(/\[QUICK_ADD:.*?\]/gi, '')
    .trim();

  return (
    <div className="space-y-4">
      {/* הצגת הכרטיס המקצועי רק אם יש גלריה או SKU */}
      {(urls.length > 0 || sku) && (
        <EliteProductCard 
          name={cleanText.split('\n')[0].replace('###', '').replace('💎', '').trim()} 
          sku={sku} 
          urls={urls} 
          videoUrl={videoUrl}
          drying={drying}
          coverage={coverage}
          method={method}
          onAdd={onAdd}
        />
      )}

      {/* הטקסט המלווה */}
      <div className="space-y-4">
        {cleanText.split('\n').slice(1).map((line: string, i: number) => {
          if (!line.trim() || line.includes('זמן ייבוש') || line.includes('כושר כיסוי')) return null;
          return <p key={i} className="text-[17px] md:text-[19px] leading-relaxed font-bold text-white/90 text-right">{line}</p>;
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ 
      role: 'assistant', 
      content: `### המוח הלוגיסטי מוכן 🦾\nשלום ראמי אחי, אנחנו בפורמט Elite. שאל אותי על **סרם 255** כדי לראות את התצוגה המקצועית החדשה.` 
    }]);
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAction = (sku: string) => {
    toast.success(`המוצר #${sku} נשמר בסל הפקודה 🦾`);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, history: messages.slice(-5) })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("נתק ב-DNA"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      
      <main className="flex-1 flex flex-col relative bg-white max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        <header className="h-20 border-b flex items-center justify-between px-8 bg-white/95 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl border-2 border-white">
                 <Zap size={24} fill="currentColor" />
              </div>
              <div className="text-right">
                 <h2 className="text-lg font-black italic leading-none">Ai-Saban Elite</h2>
                 <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Operational Mode Active</p>
              </div>
           </div>
           <img src={LOGO_PATH} alt="Saban" className="h-10 object-contain" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 pb-40 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[95%] p-6 md:p-10 rounded-[45px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-slate-900 shadow-md' : 'bg-blue-700 text-white border-blue-800 shadow-2xl rounded-tr-none'
                }`}>
                  <div className={`flex items-center gap-3 mb-6 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100/50'}`}>
                     {m.role === 'user' ? <User size={16}/> : <Zap size={16}/>}
                     <span className="text-[11px] font-black uppercase tracking-widest">{m.role === 'user' ? 'ראמי הבוס' : 'AI MASTER'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end pr-4 animate-pulse"><Loader2 className="animate-spin text-blue-600" size={24} /></div>}
          <div ref={scrollRef} />
        </div>

        <footer className="p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 absolute bottom-0 w-full">
          <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-2 rounded-[45px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] flex items-center gap-3 ring-[15px] ring-slate-50/50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="שאל על מוצר או פרויקט..." 
              className="flex-1 bg-transparent px-8 py-5 outline-none font-black text-xl text-right text-slate-900 placeholder:text-slate-300" 
            />
            <button onClick={handleSend} className="w-16 h-16 bg-blue-600 rounded-[35px] flex items-center justify-center text-white active:scale-90 transition-all shadow-xl hover:bg-blue-700">
              <Send size={28} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
