"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight,
  X, Play, Clock, Hammer, Calculator, Smartphone, 
  Award, PlayCircle, ShieldAlert, CheckCircle2,
  Maximize2, Share2, Layers
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Saban OS V27.1 - Stitched Elite (Logic Fix)
 * -------------------------------------------
 * Fix: Robust regex for GALLERY/QUICK_ADD detection.
 * Feature: Auto-hiding raw tags even if parsing fails.
 */

const LOGO_PATH = "/ai.png";

const StitchedEliteCard = ({ name, sku, urls, drying, coverage, method, onAdd }: any) => {
  const mainImg = urls[0];
  const sideImgs = urls.slice(1, 4);

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      className="my-10 bg-[#020617] rounded-[55px] overflow-hidden border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.6)] w-full max-w-[480px] mx-auto group ring-1 ring-white/10"
    >
      <div className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-white/[0.02]">
         <div className="flex items-center gap-3">
            <Layers size={18} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Saban Asset ID: {sku || 'N/A'}</span>
         </div>
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="p-8">
        <div className="grid grid-cols-12 gap-3 h-[320px]">
          <div className="col-span-8 bg-slate-900 rounded-[35px] overflow-hidden relative border border-white/10">
            {mainImg ? <img src={mainImg} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-800"><ImageIcon size={48}/></div>}
          </div>
          <div className="col-span-4 flex flex-col gap-3">
             {sideImgs.map((img: string, idx: number) => (
               <div key={idx} className="flex-1 bg-slate-900 rounded-[22px] overflow-hidden border border-white/10"><img src={img} className="w-full h-full object-cover grayscale" /></div>
             ))}
             {sideImgs.length < 2 && <div className="flex-1 bg-slate-900/50 rounded-[22px] border border-dashed border-white/5 flex items-center justify-center text-slate-800"><ImageIcon size={14}/></div>}
          </div>
        </div>
      </div>

      <div className="px-10 pb-12 space-y-8 text-right" dir="rtl">
        <div className="space-y-4">
           <div className="flex items-center gap-3 justify-end">
              <span className="bg-blue-600/10 text-blue-400 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/20 shadow-sm">Elite Series</span>
              <ShieldCheck size={18} className="text-emerald-500" />
           </div>
           <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{name || "מוצר Elite"}</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
           <TechnicalPill icon={<Clock size={16}/>} label="Drying" value={drying} />
           <TechnicalPill icon={<Calculator size={16}/>} label="Coverage" value={coverage} />
           <TechnicalPill icon={<Hammer size={16}/>} label="Method" value={method} />
        </div>

        <button onClick={() => onAdd(sku)} className="w-full bg-white text-slate-950 py-8 rounded-[45px] font-black text-[13px] uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-6 border-b-8 border-slate-200 active:scale-95 italic">
           הוסף להזמנה <ShoppingCart size={28} className="text-blue-600" />
        </button>
      </div>
    </motion.div>
  );
};

function TechnicalPill({ icon, label, value }: any) {
  return (
    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-[30px] text-center">
       <div className="text-blue-500 mx-auto mb-3 flex justify-center">{icon}</div>
       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-sm font-black text-white italic">{value || "--"}</p>
    </div>
  );
}

function SmartMessageRenderer({ text, onAdd }: any) {
  if (!text) return null;

  // חילוץ נתונים חסין
  const galleryMatch = text.match(/\[GALLERY:\s*([^\]]+)\]/i);
  const urls = galleryMatch ? galleryMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 5) : [];

  const skuMatch = text.match(/\[QUICK_ADD:\s*([^\]]+)\]/i);
  const sku = skuMatch ? skuMatch[1] : null;

  const drying = text.match(/ייבוש[:*]*\s*(.*?)(\n|$)/i)?.[1] || "--";
  const coverage = text.match(/כיסוי[:*]*\s*(.*?)(\n|$)/i)?.[1] || "--";
  const method = text.match(/יישום[:*]*\s*(.*?)(\n|$)/i)?.[1] || "--";

  const cleanText = text
    .replace(/\[GALLERY:[\s\S]*?\]/gi, '')
    .replace(/\[QUICK_ADD:[\s\S]*?\]/gi, '')
    .replace(/\[VIDEO:[\s\S]*?\]/gi, '')
    .trim();

  const lines = cleanText.split('\n');
  const title = lines.find(l => l.includes('###'))?.replace('###', '').trim();

  return (
    <div className="space-y-6">
      {(urls.length > 0 || sku) && (
        <StitchedEliteCard 
          name={title || "מוצר מבית ח. סבן"} 
          sku={sku} 
          urls={urls} 
          drying={drying}
          coverage={coverage}
          method={method}
          onAdd={onAdd}
        />
      )}
      <div className="space-y-6">
        {lines.map((line, i) => {
          if (!line.trim() || line.includes('ייבוש') || line.includes('כיסוי')) return null;
          if (line.startsWith('###')) return <h3 key={i} className="text-2xl font-black text-white italic border-r-8 border-blue-600 pr-6 my-10 uppercase tracking-tight">{line.replace('###', '')}</h3>;
          return <p key={i} className="text-[20px] md:text-[22px] leading-relaxed font-bold text-white/95 text-right">{line}</p>;
        })}
      </div>
    </div>
  );
}

export default function MasterChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ 
      role: 'assistant', 
      content: `### המוח הלוגיסטי V27.1 🦾\nשלום ראמי אחי, אנחנו בפורמט **Stitched Elite**. המערכת מוכנה להזרים כרטיסי מוצר מעוצבים לביצוע מושלם.` 
    }]);
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAction = (sku: string) => {
    toast.success(`המוצר #${sku} הופנה לסל הביצוע 🦾`);
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
        body: JSON.stringify({ query: q, history: messages.slice(-5) })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("DNA Link Interrupted"); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      <main className="flex-1 flex flex-col relative bg-white max-w-5xl mx-auto shadow-2xl border-x border-slate-100">
        <header className="h-24 border-b border-slate-100 flex items-center justify-between px-10 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-[#020617] rounded-3xl flex items-center justify-center text-blue-500 shadow-2xl border-2 border-white ring-8 ring-slate-50"><Zap size={28} fill="currentColor" /></div>
              <div className="text-right">
                 <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Saban AI OS</h2>
                 <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Stitched Elite Fix</p>
              </div>
           </div>
           <img src={LOGO_PATH} alt="Saban" className="h-10 object-contain" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-14 space-y-16 pb-48 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[95%] p-10 md:p-14 rounded-[65px] shadow-sm border ${m.role === 'user' ? 'bg-white border-slate-200 text-slate-900 shadow-xl rounded-tl-none ring-[20px] ring-slate-50' : 'bg-[#020617] text-white border-white/5 shadow-2xl rounded-tr-none'}`}>
                  <div className={`flex items-center gap-4 mb-10 opacity-30 ${m.role === 'user' ? 'text-slate-500' : 'text-blue-300'}`}>
                     <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">{m.role === 'user' ? 'CLIENT REQUEST' : 'OS INTELLIGENCE'}</span>
                  </div>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end pr-10"><div className="bg-[#020617] px-10 py-6 rounded-[40px] flex items-center gap-6 shadow-2xl border border-white/5 animate-pulse"><Loader2 className="animate-spin text-blue-500" size={24} /><span className="text-xs font-black text-blue-400 uppercase italic tracking-[0.3em]">Processing DNA...</span></div></div>}
          <div ref={scrollRef} />
        </div>

        <footer className="p-8 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-24">
          <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-4 rounded-[65px] shadow-2xl flex items-center gap-5 ring-[20px] ring-slate-50/50 backdrop-blur-3xl focus-within:ring-blue-100/50 transition-all">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="ראמי, מה נזרים לביצוע עכשיו?" className="flex-1 bg-transparent px-8 py-6 outline-none font-black text-2xl text-right text-slate-900" />
            <button onClick={handleSend} className="w-20 h-20 bg-[#020617] rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl hover:bg-blue-700"><Send size={34} /></button>
          </div>
        </footer>
      </main>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
