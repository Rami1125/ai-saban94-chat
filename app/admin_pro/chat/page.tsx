"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Send, Zap, ShoppingCart, User, Loader2, X, Trash2, 
  ChevronRight, Sparkles, Plus, Save, Package, 
  Activity, Monitor, ShieldCheck, MessageSquare, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import { useRouter } from 'next/navigation';

/**
 * Saban Admin Pro - Master Executive Interface V35.0
 * -------------------------------------------------
 * Design: High-end glassmorphism, floating inputs, real-time sidebar.
 * Function: Monitors all VIP chats & manages System DNA.
 */

export default function MasterAdminChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeVIPs, setActiveVIPs] = useState<any[]>([]);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Sync & Real-time Pulse
  useEffect(() => {
    async function init() {
      const { data: history } = await supabase.from('chat_history').select('*').eq('session_id', 'admin_master').order('created_at', { ascending: true });
      if (history && history.length > 0) setMessages(history);
      else setMessages([{ role: 'assistant', content: '### מערכת Saban OS - חדר מצב מאסטר 🦾\nשלום ראמי הבוס. אני מחובר לכל ערוצי ה-VIP ולספר החוקים. מה נבצע היום?' }]);

      const { data: vips } = await supabase.from('vip_profiles').select('*');
      setActiveVIPs(vips || []);
    }
    init();

    const channel = supabase.channel('master_monitor')
      .on('postgres_changes', { event: 'INSERT', table: 'chat_history' }, (payload) => {
        if (payload.new.session_id !== 'admin_master') {
          toast.info(`הודעה חדשה מלקוח VIP (${payload.new.session_id.slice(-4)})`, {
            icon: <Smartphone size={16} className="text-blue-500" />
          });
        }
      }).subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // 2. Master Command Execution
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: 'admin_master', 
          query: q, 
          history: messages.slice(-5),
          customerId: selectedFocus || '601992'
        })
      });

      const data = await res.json();
      
      if (data.ruleInjected) {
        toast.success("DNA עודכן! החוק הזרק למערכת והופץ לכל המוחות. 🧠", { duration: 5000 });
      }

      const addMatch = data.answer.match(/\[QUICK_ADD:(.*?)\]/);
      if (addMatch) handleQuickAdd(addMatch[1]);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("ניתוק ממוח המאסטר"); } finally { setLoading(false); }
  };

  const handleQuickAdd = async (sku: string) => {
    const { data } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (data) {
      setCart(prev => [...prev, { sku: data.sku, product_name: data.product_name, qty: 1 }]);
      toast.success(`נוסף לסל הניהולי: ${data.product_name}`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-slate-50 rounded-[50px] overflow-hidden border border-slate-200 shadow-2xl relative" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Sidebar - VIP Live Monitor */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
            className="w-80 bg-white border-l border-slate-100 flex flex-col z-20"
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-slate-900 italic uppercase flex items-center gap-2 text-xs tracking-widest">
                 <Activity size={16} className="text-blue-600 animate-pulse"/> ניטור VIP חי
               </h3>
               <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
               {activeVIPs.map(vip => (
                 <button 
                   key={vip.id} onClick={() => setSelectedFocus(vip.id)}
                   className={`w-full p-4 rounded-3xl border transition-all text-right group ${selectedFocus === vip.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200 bg-white'}`}
                 >
                    <p className="font-black text-slate-900 text-sm">{vip.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 italic uppercase">{vip.main_project}</p>
                 </button>
               ))}
            </div>

            <div className="p-6 bg-slate-950 text-white rounded-t-[40px] shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase text-blue-400">סל פקודה לביצוע</span>
                  <ShoppingCart size={18} />
               </div>
               <div className="max-h-32 overflow-y-auto mb-6 space-y-2 scrollbar-hide">
                  {cart.map((item, i) => (
                    <div key={i} className="text-xs font-bold flex justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                       <span className="opacity-50">x{item.qty}</span>
                       <span className="truncate ml-2">{item.product_name}</span>
                    </div>
                  ))}
                  {cart.length === 0 && <p className="text-[10px] text-center opacity-30 italic py-4">הסל ממתין לפקודה...</p>}
               </div>
               <button className="w-full py-5 bg-blue-600 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-500 transition-all border-b-4 border-blue-800 active:scale-95">הזרק הזמנה לביצוע 🦾</button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Execution Arena */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between bg-white/80 backdrop-blur-xl z-10 shrink-0">
           <div className="flex items-center gap-5">
              {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-50 rounded-xl"><Monitor size={20}/></button>}
              <div className="bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-[18px] border border-emerald-100 font-black text-[11px] uppercase tracking-widest italic flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" /> Brain OS Master Active
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Executive mode</p>
                <p className="font-black text-slate-900 italic mt-1 leading-none">ראמי הבוס</p>
              </div>
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black italic shadow-xl">R</div>
           </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 scrollbar-hide bg-[#FAFBFC] pb-48">
           {messages.map((m, i) => (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-5 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-8 rounded-[45px] shadow-sm border ${
                  m.role === 'user' 
                  ? 'bg-white border-slate-200 text-slate-900 rounded-tl-none ring-[15px] ring-slate-50' 
                  : 'bg-slate-900 text-white border-slate-800 shadow-2xl rounded-tr-none'
                }`}>
                   <div className={`flex items-center gap-3 mb-6 text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      {m.role === 'user' ? <User size={14}/> : <ShieldCheck size={14}/>}
                      {m.role === 'user' ? 'Executive Director' : 'Saban Master Brain'}
                   </div>
                   <div className="text-right leading-relaxed font-bold italic">
                      <SmartMessageRenderer text={m.content} onAdd={handleQuickAdd} />
                   </div>
                </div>
             </motion.div>
           ))}
           {loading && (
             <div className="flex justify-end pr-4">
                <div className="bg-slate-50 px-8 py-5 rounded-[35px] border border-slate-100 flex items-center gap-6 animate-pulse shadow-sm">
                   <Loader2 size={24} className="animate-spin text-blue-600" />
                   <span className="text-sm font-black text-slate-400 uppercase italic tracking-widest">מחשב מהלך לוגיסטי...</span>
                </div>
             </div>
           )}
           <div ref={scrollRef} />
        </div>

        {/* Floating Master Input */}
        <div className="p-10 absolute bottom-0 w-full pointer-events-none">
           <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-3 rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.25)] flex items-center gap-4 pointer-events-auto ring-[25px] ring-slate-50/50 backdrop-blur-2xl transition-all focus-within:ring-blue-100/50">
              <input 
                type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="ראמי הבוס, מה נזרים למערכת היום?" 
                className="flex-1 bg-transparent px-8 py-6 outline-none font-black text-2xl text-right text-slate-900 placeholder:text-slate-200" 
              />
              <button onClick={handleSend} disabled={loading} className="w-20 h-20 bg-slate-900 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all group">
                 <Send size={32} className="group-hover:rotate-12 transition-transform" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- Smart Message Parser (Mentoring & Actions) ---
function SmartMessageRenderer({ text, onAdd }: { text: string, onAdd: any }) {
  if (!text) return null;

  // Clean technical markers
  const cleanContent = text
    .replace(/```text|```|text```/gi, '')
    .replace(/\[UPDATE_RULE:.*?\]/g, '')
    .replace(/\[QUICK_ADD:.*?\]/g, '')
    .trim();

  const lines = cleanContent.split('\n');

  return (
    <div className="space-y-6">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.startsWith('###')) return <h3 key={i} className="text-blue-400 text-2xl font-black uppercase mt-8 mb-4 border-r-[6px] border-blue-500 pr-5 italic">{line.replace('###', '').trim()}</h3>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[20px] md:text-[24px] leading-relaxed tracking-tight">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-300 font-black underline decoration-blue-500/30 decoration-[5px] underline-offset-8">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      })}

      {/* DNA Injection Indicator */}
      {text.includes('[UPDATE_RULE:') && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[40px] flex items-center gap-6 shadow-inner relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
           <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse z-10"><Sparkles size={32}/></div>
           <div className="text-right z-10">
              <p className="font-black text-emerald-400 uppercase text-xs tracking-[0.2em] italic mb-1">System DNA Updated</p>
              <p className="text-white text-lg font-bold">החוק הזרק לספר החוקים והופץ לכל ערוצי השירות בשטח 🦾</p>
           </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
        <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onAdd(match[1])} className="w-full mt-6 bg-blue-600 text-white py-6 rounded-[35px] font-black shadow-2xl flex items-center justify-center gap-5 text-lg uppercase tracking-widest italic border-b-8 border-blue-800 hover:bg-blue-500 transition-all">
          <Plus size={28} /> הוסף {match[1]} לסל הניהולי
        </motion.button>
      ))}
    </div>
  );
}
