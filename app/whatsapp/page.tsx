"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ShoppingCart, Loader2, Trash2, User, Box, ChevronLeft, Zap, Sparkles, Package } from 'lucide-react';
import { getSupabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';

export default function SabanEliteUnified() {
  const { customerId } = useParams(); 
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [entityInfo, setEntityInfo] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  const initSession = useCallback(async () => {
    if (customerId) {
      const { data } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).maybeSingle();
      if (data) {
        setEntityInfo(data);
        setMessages([{ role: 'assistant', content: `שלום ${data.full_name.split(' ')[0]}! המוח של ח. סבן מוכן להזמנה שלך. מה נשלח היום?` }]);
      }
    } else {
      setEntityInfo({ full_name: 'צוות סידור', role: 'admin' });
      setMessages([{ role: 'assistant', content: `שלום ראמי! המערכת מסונכרנת למלאי. מה נכין להפצה?` }]);
    }
  }, [customerId, supabase]);

  useEffect(() => { initSession(); }, [initSession]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // 🔥 הוספה לסל מתוך המלאי האמיתי
  const addItemToCart = async (identifier: string) => {
    const { data: product } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${identifier}%,sku.eq.${identifier}`)
      .limit(1).maybeSingle();

    if (product) {
      setCart(prev => [...prev, product]);
      toast.success(`נוסף לסל: ${product.product_name}`);
      await supabase.from('saban_action_logs').insert([{
        customer_id: customerId || 'ADMIN',
        action_type: 'CART_ADD',
        details: { product: product.product_name, sku: product.sku }
      }]);
    } else {
      toast.error(`המוצר "${identifier}" לא נמצא במלאי`);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentInput, customerId })
      });
      const data = await res.json();
      
      // המוח מחזיר [QUICK_ADD:SKU] או [ADD_TO_CART:שם]
      const match = data.answer?.match(/\[(?:QUICK_ADD|ADD_TO_CART):(.*?)\]/);
      if (match) await addItemToCart(match[1]);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("נתק במוח"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar - סל הקניות של סבן */}
      <aside className="w-96 bg-white border-l border-slate-100 flex flex-col shadow-2xl z-20">
        <div className="p-8 bg-[#0B2C63] text-white rounded-bl-[40px] shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/10 p-3 rounded-2xl"><ShoppingCart size={24} className="text-blue-300" /></div>
            <h2 className="font-black text-xl italic leading-none">הסל של סבן</h2>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs font-bold">
            פריטים פעילים: {cart.length}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 italic font-bold">
              <Package size={48} className="mb-2" />
              <p>הסל ריק, ציין מוצר בצאט...</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={idx} 
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div className="flex flex-col">
                  <span className="font-black text-slate-700 text-sm">{item.product_name}</span>
                  <span className="text-[10px] text-slate-400 font-bold">מק"ט: {item.sku} | {item.unit_type}</span>
                </div>
                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-6">
           <button className="w-full h-16 bg-[#0B2C63] text-white rounded-[20px] font-black shadow-xl active:scale-95 transition-all">שגר הזמנה לראמי 🚀</button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-white">
        <header className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><User size={24}/></div>
              <div>
                <h3 className="font-black text-slate-800 italic">{entityInfo?.full_name || 'מזהה...'}</h3>
                <p className="text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1 italic"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> LIVE CONNECT</p>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-32 no-scrollbar">
  {messages.map((m, i) => (
    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[75%] p-6 rounded-[35px] shadow-sm ${
        m.role === 'user' 
          ? 'bg-slate-100 text-slate-800 rounded-br-none border border-slate-200' 
          : 'bg-[#0B2C63] text-white rounded-bl-none shadow-xl'
      }`}>
        <p className="font-bold leading-relaxed whitespace-pre-wrap">
          {/* 🛡️ הגנה מפני קריסה: מוודאים שיש תוכן לפני שמנקים תגיות */}
          {m.content 
            ? m.content.replace(/\[.*?\]/g, '') 
            : m.role === 'assistant' ? "מעבד נתונים... ⏳" : ""
          }
        </p>
      </div>
    </div>
  ))}
  <div ref={scrollRef} />
</div>

        <div className="absolute bottom-8 left-0 right-0 px-10">
          <div className="max-w-4xl mx-auto bg-white border border-slate-100 p-2 rounded-[30px] shadow-2xl flex items-center gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="כתוב מה להוסיף לסל..." className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-lg" />
            <button onClick={handleSend} disabled={loading} className="w-14 h-14 bg-[#0B2C63] rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
              {loading ? <Loader2 className="animate-spin"/> : <Send size={24}/>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
