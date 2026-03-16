"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Send, Zap, Phone, Search, Loader2, User, ShieldCheck, 
  ShoppingCart, ChevronRight, Menu, Trash2, X, Share2, 
  MapPin, Scale, Clock, CheckCircle
} from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Ai-Saban OS V22.0 - VIP Portal Order Integration
 * -------------------------------------------
 * - Sync: Automatically saves chat orders to public.orders table.
 * - Feedback: Haptic-style feedback on successful injection.
 * - Navigation: Link to Live Track after order close.
 */

const LOGO_PATH = "/ai.png";
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

const VIP_PROFILES: any = {
  "601992": {
    id: "601992",
    name: "בר אורניל",
    fullName: "בר אורניל (אורניל/אבי לוי)",
    project: "סטרומה 4, הרצליה",
    phone: "054-5998111"
  }
};

export default function VipAppPortal() {
  const { id } = useParams();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && VIP_PROFILES[id as string]) {
      setClient(VIP_PROFILES[id as string]);
    }
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isBotTyping]);

  const handleAction = async (sku: string, qty = 1) => {
    let { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    if (p) {
      setCart(prev => {
        const ex = prev.find(i => i.sku === p?.sku);
        if (ex) return prev.map(i => i.sku === p?.sku ? {...i, qty: i.qty + qty} : i);
        return [...prev, { ...p, qty }];
      });
      toast.success(`${p.product_name} נוסף לסל 🦾`);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isBotTyping) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsBotTyping(true);

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: `vip_${id}`, query: q, history: messages.slice(-5), customerId: id })
      });
      const data = await res.json();
      
      const qMatch = data.answer.match(/\[SET_QTY:(.*?):(.*?)\]/);
      if (qMatch) handleAction(qMatch[1], parseInt(qMatch[2]));
      
      const aMatch = data.answer.match(/\[QUICK_ADD:(.*?)\]/);
      if (aMatch) handleAction(aMatch[1]);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("ניתוק מהמוח הלוגיסטי"); } finally { setIsBotTyping(false); }
  };

  // --- פונקציית הקסם: שמירת הזמנה ל-DB ומעבר לווצאפ ---
  const handleFinalOrder = async () => {
    if (cart.length === 0 || isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    const toastId = toast.loading("מעבד פקודת עבודה לביצוע...");

    try {
      // 1. הזרקה ל-Database דרך ה-API
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: id,
          items: cart.map(item => ({ sku: item.sku, product_name: item.product_name, qty: item.qty })),
          deliveryDetails: {
            address: client.project,
            contact_name: client.name,
            contact_phone: client.phone,
            project: client.project
          }
        })
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // 2. הפעלת צליל הצלחה ושליחה לווצאפ
      new Audio(SUCCESS_SOUND).play().catch(() => {});
      const itemsText = cart.map((item, i) => `• *${item.product_name}* | כמות: ${item.qty}`).join('\n');
      const waText = encodeURIComponent(
        `🏗️ *אישור הזמנה לביצוע - ח. סבן*\n` +
        `-----------------------------------\n` +
        `👤 *לקוח:* ${client.fullName}\n` +
        `🏗️ *פרויקט:* ${client.project}\n` +
        `📋 *מספר פקודה:* #${result.orderId.slice(-6)}\n\n` +
        `*פירוט פריטים:*\n${itemsText}\n\n` +
        `*ראמי, ההזמנה נקלטה במערכת. נא לאשר העמסה.* 🦾`
      );

      toast.success("ההזמנה נרשמה בחדר המצב!", { id: toastId });
      
      // פתיחת ווצאפ
      window.open(`https://wa.me/972508860896?text=${waText}`, '_blank');
      
      // 3. ניקוי סל והעברה לדף מעקב חי
      setCart([]);
      setShowSummary(false);
      router.push(`/vip/${id}/track`);

    } catch (err: any) {
      toast.error("תקלה ברישום: " + err.message, { id: toastId });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!client) return null;

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="light" />
      
      {/* Sidebar Cart */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[200] lg:hidden" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-[85%] bg-white z-[210] flex flex-col rounded-l-[40px] shadow-2xl">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-blue-700 italic">סל פקודה</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white rounded-2xl"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {cart.map(item => (
                  <div key={item.sku} className="p-5 bg-slate-50 rounded-[25px] border border-slate-100 flex justify-between items-center group">
                    <button onClick={() => setCart(cart.filter(c => c.sku !== item.sku))} className="text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
                    <div className="text-right">
                      <p className="font-black text-sm text-slate-800">{item.product_name}</p>
                      <p className="text-xs font-bold text-blue-600 mt-1">כמות: {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-8 border-t">
                <button onClick={() => {setShowSummary(true); setIsSidebarOpen(false);}} disabled={cart.length === 0} className="w-full bg-slate-950 text-white py-5 rounded-[25px] font-black shadow-xl">סגור הזמנה 🦾</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative bg-white lg:max-w-4xl lg:mx-auto">
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-5 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-50 rounded-2xl relative shadow-sm">
              <Menu size={22} />
              {cart.length > 0 && <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{cart.length}</span>}
            </button>
            <div className="text-right">
              <h2 className="text-xs font-black text-slate-950 italic">VIP Agent</h2>
              <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Live Syncing</p>
            </div>
          </div>
          <img src={LOGO_PATH} alt="Saban" className="h-8 md:h-10 object-contain" />
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-40 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
               <Zap size={48} className="text-blue-600 mb-4" />
               <p className="font-black italic uppercase tracking-[0.2em]">Saban OS Initialized</p>
               <button onClick={() => setMessages([{role:'assistant', content: `### שלום ${client.name} אחי 🦾\nהמוח מזהה אותך ב**${client.project}**. מה נבצע היום?`}])} className="mt-4 text-blue-600 font-bold underline">התחל שיחה</button>
            </div>
          )}
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[88%] p-5 rounded-[30px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200' : 'bg-blue-600 text-white border-blue-500 shadow-xl'
                }`}>
                  <SmartAppRenderer text={m.content} onAdd={handleAction} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isBotTyping && <div className="text-right pr-4"><Loader2 className="animate-spin text-blue-600 inline ml-2" size={14} /><span className="text-[10px] font-black text-slate-400 italic uppercase">מעבד נתונים...</span></div>}
          <div ref={scrollRef} />
        </div>

        <footer className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-transparent pointer-events-none lg:relative">
          <div className="max-w-3xl mx-auto bg-white border-2 border-slate-100 p-2 rounded-[35px] shadow-2xl flex items-center gap-2 pointer-events-auto ring-8 ring-slate-50/50">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder={`מה בונים היום ב${client.project.split(',')[0]}?`} 
              className="flex-1 bg-transparent px-5 py-4 outline-none font-black text-[16px] text-right" 
            />
            <button onClick={handleSend} className="w-14 h-14 bg-blue-600 rounded-[25px] flex items-center justify-center text-white active:scale-90 transition-all shadow-xl">
              <Send size={24} />
            </button>
          </div>
        </footer>
      </main>

      {/* Summary Modal with API Call */}
      <AnimatePresence>
        {showSummary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[45px] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div className="text-right">
                  <h2 className="font-black italic uppercase text-2xl">סיכום לביצוע</h2>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest mt-1">Ready for Brain Injection</p>
                </div>
                <button onClick={() => setShowSummary(false)} className="p-2.5 bg-white/10 rounded-2xl"><X /></button>
              </div>
              <div className="p-8 space-y-6 text-right">
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                  {cart.map((item, i) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-[28px] flex justify-between items-center border border-slate-100 shadow-sm">
                       <span className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md">{item.qty}</span>
                       <p className="font-black text-slate-800 text-sm leading-tight flex-1 mr-4">{item.product_name}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleFinalOrder} 
                  disabled={isSubmittingOrder} 
                  className="w-full bg-[#25D366] text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-xl border-b-8 border-green-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmittingOrder ? <Loader2 className="animate-spin" size={28}/> : <Share2 size={28} />}
                  אשר ושלח לביצוע
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SmartAppRenderer({ text, onAdd }: any) {
  const clean = text.replace(/\[QUICK_ADD:.*?\]/g, '').trim();
  const lines = clean.split('\n');
  return (
    <div className="space-y-4">
      {lines.map((line:any, i:any) => (
        <p key={i} className="text-right leading-relaxed text-[15px] font-bold">
          {line.startsWith('###') ? <span className="text-lg underline decoration-blue-300 font-black italic">{line.replace('###', '')}</span> : line}
        </p>
      ))}
      {Array.from(text.matchAll(/\[QUICK_ADD:(.*?)\]/g)).map((match, i) => (
        <button key={i} onClick={() => onAdd(match[1])} className="w-full bg-white text-blue-700 py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 text-sm mt-4 border border-blue-50">
          <ShoppingCart size={18} /> הוסף {match[1]} לסל 🦾
        </button>
      ))}
    </div>
  );
}
