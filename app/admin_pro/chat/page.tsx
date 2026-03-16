"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Send, Zap, ShoppingCart, User, 
  Loader2, X, Trash2, Scale, Truck, 
  ChevronRight, Sparkles, Plus, Save,
  CheckCircle2, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import { useRouter } from 'next/navigation';

/**
 * Saban Admin Pro - Executive Chat Interface V33.0
 * ----------------------------------------------
 * הממשק המרכזי שבו ראמי מנהל את המוח וסוגר פקודות לביצוע.
 * כולל: מנגנון ניקוי פקודות מהטקסט, סל פקודה מבצעי, וחיבור ל-API ההזמנות.
 */

const LOGO_PATH = "/ai.png";

export default function AdminProChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. טעינת היסטוריה וסנכרון ראשוני
  useEffect(() => {
    async function init() {
      const { data } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', 'admin_session')
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) setMessages(data);
      else setMessages([{ role: 'assistant', content: '### ברוך הבא ראמי הבוס 🦾\nהמוח הלוגיסטי מחובר למלאי ולשטח. איזה מהלך נבצע היום?' }]);
    }
    init();
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // 2. שליחת פקודה למוח ופענוח תשובה
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
          customerId: '601992' // בר אורניל כברירת מחדל
        })
      });

      const data = await res.json();
      
      // זיהוי והזרקה לסל (פקודות שקטות)
      const addMatch = data.answer.match(/\[QUICK_ADD:(.*?)\]/);
      if (addMatch) handleQuickAdd(addMatch[1]);
      
      const qtyMatch = data.answer.match(/\[SET_QTY:(.*?):(.*?)\]/);
      if (qtyMatch) handleUpdateQty(qtyMatch[1], parseInt(qtyMatch[2]));

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      toast.error("ניתוק מהמוח הלוגיסטי");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (sku: string) => {
    const { data } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (data) {
      setCart(prev => {
        const existing = prev.find(i => i.sku === sku);
        if (existing) return prev.map(i => i.sku === sku ? {...i, qty: i.qty + 1} : i);
        return [...prev, { sku: data.sku, product_name: data.product_name, qty: 1 }];
      });
      toast.success(`נוסף לסל: ${data.product_name}`);
    }
  };

  const handleUpdateQty = (sku: string, qty: number) => {
    setCart(prev => prev.map(i => i.sku === sku ? {...i, qty} : i));
  };

  // 3. הזרקה סופית ל-Database (סגירת המעגל)
  const handleInjectOrder = async () => {
    if (cart.length === 0 || isInjecting) return;
    setIsInjecting(true);
    const toastId = toast.loading("מזריק פקודת עבודה למערכת...");

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: '601992', // בר אורניל
          items: cart,
          deliveryDetails: {
            address: "סטרומה 4, הרצליה",
            contact_name: "בר",
            contact_phone: "054-5998111",
            project: "סטרומה 4"
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success("ההזמנה הוזרקה לביצוע! 🚛", { id: toastId });
      setCart([]);
      setIsSidebarOpen(false);
      
      // מעבר אוטומטי לראות את ההזמנה בחדר המצב
      setTimeout(() => router.push('/admin_pro/orders'), 1000);

    } catch (err: any) {
      toast.error("תקלה בהזרקה: " + err.message, { id: toastId });
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-[#F8FAFC] rounded-[45px] overflow-hidden border border-slate-200 shadow-2xl relative" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Sidebar - סל פקודה */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-y-0 right-0 w-80 bg-white z-[110] shadow-2xl flex flex-col p-8 border-l border-slate-100">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-2">
                    <ShoppingCart size={20} className="text-blue-600"/> סל פקודה
                  </h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"><X size={20}/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                  {cart.length === 0 && (
                    <div className="py-20 text-center opacity-20">
                      <Package size={48} className="mx-auto mb-4" />
                      <p className="font-black uppercase text-xs tracking-widest">הסל ריק</p>
                    </div>
                  )}
                  {cart.map((item, i) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-[25px] border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-blue-200 transition-all">
                       <button onClick={() => setCart(cart.filter(c => c.sku !== item.sku))} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                       <div className="text-right">
                          <p className="font-black text-sm text-slate-800 leading-tight">{item.product_name}</p>
                          <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest italic">QTY: {item.qty}</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={handleInjectOrder}
                    disabled={cart.length === 0 || isInjecting}
                    className="w-full bg-slate-950 text-white py-6 rounded-[28px] font-black shadow-xl hover:bg-blue-600 active:scale-95 transition-all uppercase text-[11px] italic tracking-[0.2em] flex items-center justify-center gap-3 border-b-8 border-slate-800 disabled:opacity-30 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-none"
                  >
                    {isInjecting ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                    הזרק הזמנה לביצוע 🦾
                  </button>
               </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        
        {/* Sub-Header */}
        <div className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 font-black text-[10px] uppercase tracking-widest italic shadow-sm">
                 <Sparkles size={14} className="animate-pulse" /> Neural Link Online
              </div>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-900 text-white rounded-2xl relative hover:bg-blue-600 transition-all shadow-xl group">
              <ShoppingCart size={22} />
              {cart.length > 0 && <span className="absolute -top-2 -left-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">{cart.length}</span>}
           </button>
        </div>

        {/* Message Arena */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 scrollbar-hide bg-[#FAFBFC] pb-48">
           {messages.map((m, i) => (
             <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               key={i} 
               className={`flex gap-5 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
             >
                <div className={`max-w-[85%] p-8 rounded-[40px] shadow-sm border ${
                  m.role === 'user' 
                  ? 'bg-white border-slate-200 text-slate-900 rounded-tl-none ring-[15px] ring-slate-50' 
                  : 'bg-slate-900 text-white border-slate-800 shadow-2xl rounded-tr-none'
                }`}>
                   <div className={`flex items-center gap-3 mb-6 text-[10px] font-black uppercase tracking-[0.3em] italic opacity-40 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      {m.role === 'user' ? <User size={14}/> : <Zap size={14} fill="currentColor"/>}
                      {m.role === 'user' ? 'Executive Mode' : 'Logistics Brain'}
                   </div>
                   <div className="text-right leading-relaxed font-bold italic">
                      <SmartMessageRenderer text={m.content} onAdd={handleQuickAdd} />
                   </div>
                </div>
             </motion.div>
           ))}
           {loading && (
             <div className="flex justify-end pr-4">
                <div className="bg-slate-50 px-8 py-5 rounded-[30px] border border-slate-100 flex items-center gap-5 animate-pulse">
                   <Loader2 size={24} className="animate-spin text-blue-600" />
                   <span className="text-sm font-black text-slate-400 uppercase italic tracking-widest">מחשב מהלך לוגיסטי...</span>
                </div>
             </div>
           )}
           <div ref={scrollRef} />
        </div>

        {/* Floating Executive Input */}
        <div className="p-10 absolute bottom-0 w-full pointer-events-none">
           <div className="max-w-4xl mx-auto bg-white border-2 border-slate-100 p-3 rounded-[50px] shadow-[0_40px_100px_rgba(0,0,0,0.2)] flex items-center gap-4 pointer-events-auto ring-[25px] ring-slate-50/50 backdrop-blur-2xl">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="כתוב פקודה לביצוע ראמי..." 
                className="flex-1 bg-transparent px-8 py-6 outline-none font-black text-2xl text-right text-slate-900 placeholder:text-slate-200" 
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="w-20 h-20 bg-slate-900 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all group"
              >
                 <Send size={32} className="group-hover:rotate-12 transition-transform" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- המפענח החכם (The UI Engine) ---
function SmartMessageRenderer({ text, onAdd }: { text: string, onAdd: any }) {
  if (!text) return null;

  // ניקוי טקסט טכני וסימני Markdown עודפים
  const cleanContent = text
    .replace(/```text|```|text```/gi, '')
    .replace(/\[QUICK_ADD:.*?\]/g, '')
    .replace(/\[SET_QTY:.*?:.*?\]/g, '')
    .trim();

  const lines = cleanContent.split('\n');

  return (
    <div className="space-y-5">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        
        // כותרות
        if (line.startsWith('###')) {
          return (
            <h3 key={i} className="text-blue-400 text-xl md:text-2xl font-black uppercase mt-8 mb-4 border-r-6 border-blue-500 pr-5 italic tracking-tighter">
              {line.replace('###', '').trim()}
            </h3>
          );
        }

        // טקסט רגיל עם תמיכה בבולד
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-[18px] md:text-[22px] leading-relaxed tracking-tight">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j} className="text-blue-300 font-black underline decoration-blue-500/30 decoration-4 underline-offset-8">{p.slice(2, -2)}</strong> : p)}
          </p>
        );
      })}

      {/* הזרקת כפתורי פעולה אם יש פקודות מוסתרות */}
      {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
        <motion.button 
          key={i}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAdd(match[1])}
          className="w-full mt-6 bg-blue-600 text-white py-6 rounded-[30px] font-black shadow-2xl flex items-center justify-center gap-4 text-sm md:text-base uppercase tracking-widest italic border-b-8 border-blue-800 hover:bg-blue-500"
        >
          <Plus size={24} /> שמור מוצר {match[1]} לסל פקודה
        </motion.button>
      ))}
    </div>
  );
}
