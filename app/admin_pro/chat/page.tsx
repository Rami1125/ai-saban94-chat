"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Zap, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight, Menu,
  Trash2, X, Share2, PlayCircle, Clock, Hammer, Calculator, Play,
  Droplets, Info, Smartphone, Gauge
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ai-Saban OS V19.0 - Elite Chat Interface
 * -------------------------------------------
 * - Feature: High-End Product Card with Tech Specs Grid (Matching Studio UI).
 * - Layout: 3-Image Collage & Internal YouTube Player.
 * - Logic: Aligned with Catalog Studio Elite V42.0 fields.
 */

const LOGO_PATH = "/ai.png";

// --- רכיב תצוגת מוצר Elite - המעטפת המקצועית בתוך הצ'אט ---
const EliteProductCard = ({ data, onAdd }: { data: any, onAdd: (sku: string) => void }) => {
  const getYoutubeId = (url: string) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = data.video_url ? getYoutubeId(data.video_url) : null;
  const hasMultipleImages = data.image_url_2 || data.image_url_3;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="my-6 bg-slate-900 rounded-[45px] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] w-full max-w-[440px] mx-auto group"
    >
      {/* 1. Collage Section */}
      <div className="p-6">
        <div className="flex gap-3 h-52 md:h-60">
          <div className="flex-[2] bg-slate-800 rounded-[28px] overflow-hidden relative border border-white/5 shadow-inner">
            {data.image_url ? (
              <img src={data.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Main" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon size={40}/></div>
            )}
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg">Elite Media</div>
          </div>
          {hasMultipleImages && (
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex-1 bg-slate-800 rounded-[20px] overflow-hidden border border-white/5">
                {data.image_url_2 && <img src={data.image_url_2} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 bg-slate-800 rounded-[20px] overflow-hidden border border-white/5">
                {data.image_url_3 && <img src={data.image_url_3} className="w-full h-full object-cover" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Video Player */}
      {videoId && (
        <div className="px-6 pb-6">
          <div className="aspect-video bg-black rounded-[25px] overflow-hidden border border-white/5 shadow-2xl relative">
            <iframe 
              className="w-full h-full" 
              src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&controls=1`} 
              frameBorder="0" 
              allowFullScreen 
            />
          </div>
        </div>
      )}

      {/* 3. Content & Tech Specs */}
      <div className="px-8 pb-10 space-y-8 text-right" dir="rtl">
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{data.product_name}</h3>
          <div className="flex items-center gap-3">
             <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">SKU {data.sku}</span>
             <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20"><ShieldCheck size={12}/> Saban DNA Approved</span>
          </div>
        </div>

        {/* The Technical DNA Matrix */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 border border-white/5 p-5 rounded-[30px] text-center shadow-inner group hover:bg-white/10 transition-all">
              <p className="text-[9px] font-black text-slate-500 uppercase italic mb-2 tracking-widest">זמן ייבוש</p>
              <p className="text-lg font-black text-white italic tracking-tighter flex items-center justify-center gap-2">
                 <Clock size={16} className="text-blue-500"/> {data.drying_time || "--"}
              </p>
           </div>
           <div className="bg-white/5 border border-white/5 p-5 rounded-[30px] text-center shadow-inner group hover:bg-white/10 transition-all">
              <p className="text-[9px] font-black text-slate-500 uppercase italic mb-2 tracking-widest">כושר כיסוי</p>
              <p className="text-lg font-black text-blue-400 italic tracking-tighter leading-none">
                 {data.coverage_info || "--"}
              </p>
           </div>
        </div>

        {/* Advisor Advice */}
        <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[35px] relative overflow-hidden shadow-inner">
           <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full" />
           <div className="relative z-10 flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-2"><Zap size={14} className="animate-pulse"/> Saban Advisor</span>
              <Hammer size={16} className="text-blue-500/40" />
           </div>
           <p className="text-white text-sm font-bold leading-relaxed opacity-80 italic">
              "שיטת יישום מומלצת: {data.application_method || 'נא להיוועץ במנהל לפרטים נוספים.'}"
           </p>
        </div>

        <button 
          onClick={() => onAdd(data.sku)}
          className="w-full bg-white text-slate-900 py-6 rounded-[35px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-5 border-b-8 border-slate-200 active:scale-95 transition-all italic hover:bg-blue-50"
        >
          הוסף להזמנה <ShoppingCart size={20} className="text-blue-600" />
        </button>
      </div>
    </motion.div>
  );
};

// --- מפענח הודעות חכם ---
const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;

  // חילוץ אובייקט מוצר (מצופה שיהיה בתחתית ההודעה כ-JSON מוסתר או תגיות)
  const productDataMatch = text.match(/\[ELITE_PRODUCT_DATA:\s*([\s\S]*?)\]/i);
  const productData = productDataMatch ? JSON.parse(productDataMatch[1]) : null;

  const cleanText = text
    .replace(/\[ELITE_PRODUCT_DATA:[\s\S]*?\]/gi, '')
    .trim();

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {cleanText.split('\n').map((line: string, i: number) => {
          if (!line.trim()) return null;
          if (line.startsWith('###')) return <h3 key={i} className="text-xl md:text-2xl font-black text-white italic border-r-4 border-blue-400 pr-3 my-4">{line.replace('###', '')}</h3>;
          return <p key={i} className="text-[17px] md:text-[19px] leading-relaxed font-bold text-white/90 text-right">{line}</p>;
        })}
      </div>

      {productData && <EliteProductCard data={productData} onAdd={onAdd} />}
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
      content: `### המוח הלוגיסטי מוכן 🦾\nשלום ראמי אחי, אנחנו עובדים בפורמט Elite. נסה לשאול על **סרם 255** כדי לראות את התצוגה החדשה.` 
    }]);
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAction = async (sku: string) => {
    toast.success(`המוצר #${sku} נשמר בסל הפקודה 🦾`);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      // כאן אנחנו קוראים ל-Brain API. הוא אמור להחזיר תג [ELITE_PRODUCT_DATA: {json}]
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
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl border-2 border-white">
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
                <div className={`max-w-[92%] p-6 md:p-10 rounded-[40px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-slate-900' : 'bg-blue-700 text-white border-blue-800 shadow-2xl rounded-tr-none'
                }`}>
                  <div className={`flex items-center gap-3 mb-6 ${m.role === 'user' ? 'text-slate-400' : 'text-blue-200/50'}`}>
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

        {/* Input Area */}
        <footer className="p-6 bg-gradient-to-t from-white via-white to-transparent pt-12">
          <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-2 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] flex items-center gap-3 ring-[12px] ring-slate-50/50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="שאל על מוצר Elite..." 
              className="flex-1 bg-transparent px-8 py-5 outline-none font-black text-xl text-right text-slate-900" 
            />
            <button onClick={handleSend} className="w-16 h-16 bg-blue-600 rounded-[30px] flex items-center justify-center text-white active:scale-90 transition-all shadow-xl hover:bg-blue-700">
              <Send size={28} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
