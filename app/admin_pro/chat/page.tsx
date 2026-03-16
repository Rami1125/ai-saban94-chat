"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Send, Zap, ShieldCheck, ShoppingCart, User, 
  Loader2, Menu, X, Trash2, Scale, Truck, 
  ChevronRight, MapPin, RefreshCcw, Search, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Executive Chat Interface V30.0
 * ----------------------------------------------
 * - Persona: Direct communication with the Logistics Brain.
 * - Integration: Real-time cart and order sync.
 * - Design: High-contrast, floating glassmorphism input.
 */

const LOGO_PATH = "/ai.png";

export default function AdminProChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. טעינת היסטוריה והגדרות
  useEffect(() => {
    async function init() {
      const { data } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', 'admin_session')
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) setMessages(data);
      else setMessages([{ role: 'assistant', content: '### שלום ראמי הבוס 🦾\nהמוח הלוגיסטי מחובר ומסונכרן לכל מערכות השטח. איזה מהלך נבצע היום?' }]);
    }
    init();
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // 2. לוגיקת שליחה למוח
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
          sessionId: 'admin_session', 
          query: q, 
          history: messages.slice(-5),
          customerId: '601992' // בר אורניל כברירת מחדל לניהול
        })
      });

      const data = await res.json();
      
      // זיהוי פקודות שקטות מהמוח (QUICK_ADD / SET_QTY)
      const addMatch = data.answer.match(/\[QUICK_ADD:(.*?)\]/);
      if (addMatch) handleQuickAdd(addMatch[1]);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      toast.error("ניתוק מהמוח המרכזי");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (sku: string) => {
    const { data } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (data) {
      setCart(prev => [...prev, { ...data, qty: 1 }]);
      toast.success(`מק"ט ${sku} נוסף לסל הפקודה`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-[#F8FAFC] rounded-[45px] overflow-hidden border border-slate-200 shadow-2xl relative">
      <Toaster position="top-center" richColors />

      {/* Sidebar - Cart Management */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-y-0 right-0 w-80 bg-white z-[110] shadow-2xl flex flex-col p-8 border-l border-slate-100">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="font-black text-slate-900 italic uppercase">סל פקודה חיה</h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-50 rounded-xl"><X size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                  {cart.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                       <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                       <div className="text-right">
                          <p className="font-black text-xs text-slate-800">{item.product_name}</p>
                          <p className="text-[10px] font-bold text-blue-600 mt-1">QTY: {item.qty}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <button className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black shadow-xl mt-6 active:scale-95 transition-all uppercase text-xs italic tracking-widest">הזרק הזמנה לביצוע 🦾</button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Sub-Header */}
        <div className="h-16 border-b border-slate-100 bg-white/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 font-black text-[10px] uppercase tracking-widest italic">
                 <Sparkles size={14} /> Neural Link Active
              </div>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-50 rounded-xl relative hover:bg-blue-50 transition-colors group">
              <ShoppingCart size={22} className="text-slate-600 group-hover:text-blue-600" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{cart.length}</span>}
           </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[#FAFBFC]">
           {messages.map((m, i) => (
             <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               key={i} 
               className={`flex gap-4 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
             >
                <div className={`max-w-[85%] p-6 rounded-[35px] shadow-sm border ${
                  m.role === 'user' 
                  ? 'bg-white border-slate-200 text-slate-900 rounded-tl-none ring-4 ring-slate-50' 
                  : 'bg-slate-900 text-white border-slate-800 shadow-2xl rounded-tr-none'
                }`}>
                   <div className={`flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest italic opacity-40 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      {m.role === 'user' ? 'Rami Executive' : 'Logistics Brain'}
                      {m.role === 'user' ? <User size={14}/> : <Zap size={14} fill="currentColor"/>}
                   </div>
                   <div className="text-right leading-relaxed font-bold whitespace-pre-wrap italic">
                      <MessageContent text={m.content} />
                   </div>
                </div>
             </motion.div>
           ))}
           {loading && (
             <div className="flex justify-end pr-4">
                <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 flex items-center gap-4 animate-pulse">
                   <Loader2 size={18} className="animate-spin text-blue-600" />
                   <span className="text-xs font-black text-slate-400 uppercase italic tracking-widest">מחשב מהלך לוגיסטי...</span>
                </div>
             </div>
           )}
           <div ref={scrollRef} />
        </div>

        {/* Floating Executive Input */}
        <div className="p-10 absolute bottom-0 w-full pointer-events-none">
           <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-2 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.1)] flex items-center gap-3 pointer-events-auto ring-[15px] ring-slate-50/50">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="כתוב פקודה לביצוע ראמי..." 
                className="flex-1 bg-transparent px-8 py-5 outline-none font-black text-xl text-right text-slate-900 placeholder:text-slate-300" 
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="w-16 h-16 bg-slate-900 hover:bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-xl active:scale-90 transition-all"
              >
                 <Send size={28} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// מפענח טקסט לכותרות ועיצוב בתוך הבועה
function MessageContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith('###')) return <h3 key={i} className="text-blue-400 text-lg font-black uppercase mt-4 mb-2 border-r-4 border-blue-500 pr-3">{line.replace('###', '')}</h3>;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
