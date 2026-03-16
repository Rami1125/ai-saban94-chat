"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Zap, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, Image as ImageIcon, ChevronRight, Menu,
  Trash2, X, Share2, PlayCircle, Clock, Hammer, Calculator, Play
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ai-Saban OS V18.0 - Elite Chat Interface
 * -------------------------------------------
 * - Feature: Supports 3-Image Collage & YouTube Player in chat bubbles.
 * - Sync: Aligned with Catalog Studio Elite V42.0.
 */

const LOGO_PATH = "/ai.png";

// --- רכיב תצוגת מדיה Elite (קולאז' + וידאו) ---
const EliteProductMedia = ({ urls, videoUrl }: { urls: string[], videoUrl?: string }) => {
  const getYoutubeId = (url: string) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = videoUrl ? getYoutubeId(videoUrl) : null;

  return (
    <div className="space-y-4 my-4">
      {/* Collage Layout */}
      <div className="flex gap-3 h-52 md:h-64">
        <div className="flex-[2] bg-white rounded-[25px] overflow-hidden shadow-lg border border-white/20">
          <img src={urls[0]} className="w-full h-full object-cover" alt="Main" />
        </div>
        {(urls[1] || urls[2]) && (
          <div className="flex-1 flex flex-col gap-3">
            {urls[1] && <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-md border border-white/20"><img src={urls[1]} className="w-full h-full object-cover" /></div>}
            {urls[2] && <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-md border border-white/20"><img src={urls[2]} className="w-full h-full object-cover" /></div>}
          </div>
        )}
      </div>

      {/* Embedded YouTube Player */}
      {videoId && (
        <div className="aspect-video bg-black rounded-[25px] overflow-hidden shadow-2xl border border-white/10 relative group">
          <iframe 
            className="w-full h-full" 
            src={`https://www.youtube.com/embed/${videoId}?modestbranding=1`} 
            frameBorder="0" 
            allowFullScreen 
          />
        </div>
      )}
    </div>
  );
};

const SmartMessageRenderer = ({ text, onAdd }: any) => {
  if (!text) return null;

  // חילוץ מדיה
  const galleryMatch = text.match(/\[GALLERY:\s*([\s\S]*?)\]/i);
  const videoMatch = text.match(/\[VIDEO:\s*(.*?)\s*\]/i);
  
  const urls = galleryMatch ? galleryMatch[1].split(',').map((u:string) => u.trim()).filter((u:string) => u.length > 0) : null;
  const videoUrl = videoMatch ? videoMatch[1] : null;

  const cleanText = text
    .replace(/\[GALLERY:.*?\]/gi, '')
    .replace(/\[VIDEO:.*?\]/gi, '')
    .replace(/\[QUICK_ADD:.*?\]/gi, '')
    .trim();

  return (
    <div className="space-y-4">
      {(urls || videoUrl) && <EliteProductMedia urls={urls || []} videoUrl={videoUrl} />}
      
      <div className="space-y-4">
        {cleanText.split('\n').map((line: string, i: number) => {
          if (!line.trim()) return null;
          if (line.startsWith('###')) return <h3 key={i} className="text-xl md:text-2xl font-black text-white italic border-r-4 border-blue-400 pr-3 my-4">{line.replace('###', '')}</h3>;
          return <p key={i} className="text-[17px] md:text-[19px] leading-relaxed font-bold text-white/90 text-right">{line}</p>;
        })}
      </div>

      {/* Buttons */}
      {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match: any, i: number) => (
        <button 
          key={i} 
          onClick={() => onAdd(match[1])}
          className="w-full mt-4 bg-white text-blue-700 py-5 rounded-[25px] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <ShoppingCart size={20} /> הוסף {match[1]} לסל לביצוע 🦾
        </button>
      ))}
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ 
      role: 'assistant', 
      content: `### המוח הלוגיסטי פעיל 🦾\nשלום ראמי אחי, הקטלוג המעוצב מוכן לשימוש. נסה לשאול על **סרם 255** כדי לראות את תצוגת ה-Elite.` 
    }]);
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAction = async (sku: string) => {
    toast.success(`נוסף לסל: ${sku}`);
    setCart(prev => [...prev, { sku, qty: 1 }]);
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
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      
      <main className="flex-1 flex flex-col relative bg-white max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        <header className="h-20 border-b flex items-center justify-between px-8 bg-white/95 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-500 shadow-lg">
                 <Zap size={24} fill="currentColor" />
              </div>
              <div className="text-right">
                 <h2 className="text-lg font-black italic leading-none">Saban AI OS</h2>
                 <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Elite Display Active</p>
              </div>
           </div>
           <img src={LOGO_PATH} alt="Saban" className="h-10 object-contain" />
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-40 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[90%] p-6 rounded-[35px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-slate-900' : 'bg-blue-700 text-white border-blue-800 shadow-2xl'
                }`}>
                  <SmartMessageRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <div className="flex justify-end pr-4 animate-pulse"><Loader2 className="animate-spin text-blue-600" size={24} /></div>}
          <div ref={scrollRef} />
        </div>

        <footer className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="bg-white border-2 border-slate-100 p-2 rounded-[35px] shadow-2xl flex items-center gap-2 ring-8 ring-slate-50/50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="שאל על סרם 255..." 
              className="flex-1 bg-transparent px-6 py-4 outline-none font-black text-lg text-right" 
            />
            <button onClick={handleSend} className="w-14 h-14 bg-blue-600 rounded-[25px] flex items-center justify-center text-white active:scale-90 transition-all shadow-xl">
              <Send size={24} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
