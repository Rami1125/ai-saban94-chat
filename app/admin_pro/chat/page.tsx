"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Zap, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight,
  X, Play, Clock, Hammer, Calculator, Smartphone, 
  Award, PlayCircle, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V25.0 - Elite Chat & Product Card UI
 * -------------------------------------------
 * - Feature: High-Fidelity Product Collage (1 Big, 2 Small).
 * - Integration: Embedded YouTube player + Tech Specs Matrix.
 * - Logic: Advanced regex parsing for Google Media & Manual Links.
 * - Style: Matching Admin Pro Studio aesthetics.
 */

const LOGO_PATH = "/ai.png";

// --- רכיב כרטיס מוצר Elite (העתק של הסטודיו בתוך הצ'אט) ---
const EliteProductCard = ({ 
  name, sku, urls, videoUrl, drying, coverage, method, onAdd 
}: any) => {
  
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(videoUrl);
  const mainImg = urls[0];
  const sideImgs = urls.slice(1, 3);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="my-8 bg-slate-950 rounded-[50px] overflow-hidden border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.4)] w-full max-w-[440px] mx-auto group ring-1 ring-white/5"
    >
      {/* 1. Collage Images Section */}
      <div className="p-8">
        <div className="flex gap-4 h-60 md:h-72">
          <div className="flex-[2.5] bg-slate-800 rounded-[35px] overflow-hidden relative border border-white/10 shadow-inner group">
            {mainImg ? (
              <img src={mainImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Main" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon size={48}/></div>
            )}
            <div className="absolute top-5 left-5 bg-blue-600 text-white px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase shadow-2xl animate-pulse tracking-widest">Elite DNA</div>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
             <div className="flex-1 bg-slate-800 rounded-[22px] overflow-hidden border border-white/10">
                {sideImgs[0] ? <img src={sideImgs[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700 opacity-20"><ImageIcon size={16}/></div>}
             </div>
             <div className="flex-1 bg-slate-800 rounded-[22px] overflow-hidden border border-white/10">
                {sideImgs[1] ? <img src={sideImgs[1]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700 opacity-20"><ImageIcon size={16}/></div>}
             </div>
          </div>
        </div>
      </div>

      {/* 2. Embedded Video */}
      {videoId && (
        <div className="px-8 pb-8">
           <div className="aspect-video bg-black rounded-[35px] overflow-hidden border border-white/10 shadow-2xl relative group">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1`} frameBorder="0" allowFullScreen />
              <div className="absolute top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                 <PlayCircle size={14} fill="currentColor"/> Guide Player
              </div>
           </div>
        </div>
      )}

      {/* 3. Specs & Actions */}
      <div className="px-10 pb-12 space-y-8 text-right" dir="rtl">
        <div className="space-y-3">
           <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{name || "מוצר Elite"}</h3>
           <div className="flex items-center gap-4">
              <span className="bg-white/10 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">SKU {sku || "0000"}</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20 shadow-sm"><ShieldCheck size={12}/> Saban DNA Verified</span>
           </div>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-2 gap-5">
           <div className="bg-white/5 border border-white/5 p-6 rounded-[35px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
              <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3 tracking-widest">זמן ייבוש</p>
              <p className="text-xl font-black text-white italic tracking-tighter flex items-center justify-center gap-2">
                 <Clock size={18} className="text-blue-500"/> {drying || "--"}
              </p>
           </div>
           <div className="bg-white/5 border border-white/5 p-6 rounded-[35px] text-center shadow-inner group hover:bg-white/10 transition-all cursor-default">
              <p className="text-[10px] font-black text-slate-500 uppercase italic mb-3 tracking-widest">כושר כיסוי</p>
              <p className="text-xl font-black text-blue-400 italic tracking-tighter leading-none">
                 {coverage || "--"}
              </p>
           </div>
        </div>

        {/* Advisory Bubble */}
        <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[45px] relative overflow-hidden shadow-inner group">
           <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
           <div className="relative z-10 flex items-center justify-between mb-5">
              <span className="text-[11px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-3"><Award size={18} className="animate-pulse"/> Technical Advisor OS</span>
              <Hammer size={20} className="text-blue-500/30" />
           </div>
           <p className="text-white text-[16px] font-bold leading-relaxed opacity-80 italic">
              "שיטת יישום מומלצת: {method || 'נא להגדיר שיטת יישום בדף המנהל'}"
           </p>
        </div>

        <button 
          onClick={() => onAdd(sku)}
          className="w-full bg-white text-slate-950 py-8 rounded-[45px] font-black text-[13px] uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-6 border-b-8 border-slate-200 active:scale-95 transition-all italic hover:bg-blue-50 ring-[12px] ring-white/5"
        >
          הוסף להזמנה <ShoppingCart size={28} className="text-blue-600" />
        </button>
      </div>
    </motion.div>
  );
};

// --- המנוע שמפענח את הודעות ה-AI והופך אותן ל-UI ---
const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;

  // 1. חילוץ גלריה (תמיכה בריבוי תמונות עם ניקוי רווחים)
  const galleryMatch = text.match(/\[GALLERY:\s*([\s\S]*?)\]/i);
  const urls = galleryMatch 
    ? galleryMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 5) 
    : [];

  // 2. חילוץ וידאו
  const videoMatch = text.match(/\[VIDEO:\s*(.*?)\s*\]/i) || text.match(/https:\/\/youtu\.be\/[^\s\)]+/i);
  const videoUrl = videoMatch ? (Array.isArray(videoMatch) ? videoMatch[1] : videoMatch[0]) : null;

  // 3. חילוץ מק"ט
  const skuMatch = text.match(/\[QUICK_ADD:(.*?)\]/);
  const sku = skuMatch ? skuMatch[1] : null;

  // 4. חילוץ מפרט טכני מתוך הטקסט
  const drying = text.match(/זמן ייבוש[:*]*\s*(.*?)(\n|$)/i)?.[1];
  const coverage = text.match(/כושר כיסוי[:*]*\s*(.*?)(\n|$)/i)?.[1];
  const method = text.match(/שיטת יישום[:*]*\s*(.*?)(\n|$)/i)?.[1];

  const cleanText = text
    .replace(/\[GALLERY:.*?\]/gi, '')
    .replace(/\[VIDEO:.*?\]/gi, '')
    .replace(/\[QUICK_ADD:.*?\]/gi, '')
    .trim();

  const lines = cleanText.split('\n');
  const title = lines[0]?.replace('###', '').replace('💎', '').trim();

  return (
    <div className="space-y-4">
      {/* כרטיס המוצר המעוצב */}
      {(urls.length > 0 || sku) && (
        <EliteProductCard 
          name={title || "מוצר מבית ח. סבן"} 
          sku={sku} 
          urls={urls} 
          videoUrl={videoUrl}
          drying={drying}
          coverage={coverage}
          method={method}
          onAdd={onAdd}
        />
      )}

      {/* טקסט ההודעה המלווה */}
      <div className="space-y-6">
        {lines.map((line: string, i: number) => {
          if (!line.trim() || line.includes('ייבוש') || line.includes('כיסוי')) return null;
          if (line.startsWith('###')) return <h3 key={i} className="text-2xl font-black text-white italic border-r-6 border-blue-500 pr-5 my-8 uppercase tracking-tight">{line.replace('###', '')}</h3>;
          return <p key={i} className="text-[19px] md:text-[21px] leading-relaxed font-bold text-white/95 text-right">{line}</p>;
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
      content: `### המוח הלוגיסטי Elite 🦾\nשלום ראמי הבוס, אני מחובר לסטודיו. שאל אותי על **סיקה סרם 255** כדי לראות את כרטיס המדיה המלא.` 
    }]);
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAction = (sku: string) => {
    toast.success(`המוצר #${sku} נוסף לסל פקודת העבודה 🦾`, {
      icon: <CheckCircle2 className="text-emerald-500" />
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, history: messages.slice(-5), customerId: '601992' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("נתק ב-DNA המרכזי"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      
      <main className="flex-1 flex flex-col relative bg-white max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        {/* Chat Header */}
        <header className="h-24 border-b border-slate-100 flex items-center justify-between px-10 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-blue-500 shadow-2xl border-2 border-white ring-8 ring-slate-50">
                 <Zap size={28} fill="currentColor" />
              </div>
              <div className="text-right">
                 <h2 className="text-xl font-black italic leading-none uppercase tracking-tighter">Saban AI Elite</h2>
                 <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Operational DNA
                 </p>
              </div>
           </div>
           <img src={LOGO_PATH} alt="Saban" className="h-10 object-contain" />
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 pb-48 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[95%] p-8 md:p-12 rounded-[55px] shadow-sm border ${
                  m.role === 'user' 
                  ? 'bg-white border-slate-200 text-slate-900 shadow-xl rounded-tl-none ring-[15px] ring-slate-50' 
                  : 'bg-blue-700 text-white border-blue-800 shadow-[0_30px_60px_rgba(37,99,235,0.3)] rounded-tr-none'
                }`}>
                  <div className={`flex items-center gap-4 mb-8 opacity-40 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-100'}`}>
                     {m.role === 'user' ? <User size={16}/> : <ShieldCheck size={16}/>}
                     <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">{m.role === 'user' ? 'ראמי הבוס' : 'AI MASTER PRO'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
             <div className="flex justify-end pr-6">
                <div className="bg-slate-50 px-8 py-5 rounded-[35px] border border-slate-100 flex items-center gap-5 shadow-inner animate-pulse">
                   <Loader2 className="animate-spin text-blue-600" size={24} />
                   <span className="text-xs font-black text-slate-400 uppercase italic tracking-widest">Saban OS מחשב מהלך...</span>
                </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Floating Input Center */}
        <footer className="p-8 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white to-transparent pt-24">
          <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-3 rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.25)] flex items-center gap-4 ring-[15px] ring-slate-50/50 backdrop-blur-3xl transition-all focus-within:ring-blue-100/50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="ראמי, בוא נזרים פקודה לביצוע..." 
              className="flex-1 bg-transparent px-8 py-6 outline-none font-black text-2xl text-right text-slate-900 placeholder:text-slate-200" 
            />
            <button onClick={handleSend} className="w-16 h-16 md:w-20 md:h-20 bg-slate-950 rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl hover:bg-blue-700">
              <Send size={28} className="md:size-[38px] translate-x-[-2px] translate-y-[2px]" />
            </button>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
