"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ShoppingCart, Loader2, Trash2, User, Box, ChevronLeft, Zap, Sparkles } from 'lucide-react';
import { getSupabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';

export default function SabanEliteUnified() {
  const { customerId } = useParams(); // זיהוי לקוח מה-URL
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [entityInfo, setEntityInfo] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // --- 1. זיהוי משתמש ושליפת נתונים ---
  const initSession = useCallback(async () => {
    if (customerId) {
      // מצב לקוח
      const { data } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).maybeSingle();
      if (data) {
        setEntityInfo(data);
        setMessages([{
          role: 'assistant',
          content: `שלום ${data.full_name.split(' ')[0]}! אני המוח של ח. סבן. איך נתקדם עם הפרויקט היום?`
        }]);
      }
    } else {
      // מצב איש סידור (ראמי/יואב)
      setEntityInfo({ full_name: 'צוות סבן', role: 'admin' });
      setMessages([{
        role: 'assistant',
        content: `שלום ראמי! המערכת מוכנה לניהול מלאי וסידור. מה הפקודה?`
      }]);
    }
  }, [customerId, supabase]);

  useEffect(() => { initSession(); }, [initSession]);

  // גלילה אוטומטית
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 2. לוגיקת סל קניות ---
  const addItemToCart = async (productName: string) => {
    // חיפוש מוצר במלאי לפי שם או מק"ט
    const { data: product } = await supabase
      .from('inventory')
      .select('*')
      .ilike('product_name', `%${productName}%`)
      .limit(1)
      .maybeSingle();

    if (product) {
      setCart(prev => [...prev, product]);
      toast.success(`נוסף לסל: ${product.product_name}`);
      
      // תיעוד הפעולה ב-DB (Log)
      await supabase.from('saban_action_logs').insert([{
        customer_id: customerId || 'ADMIN',
        action_type: 'CART_ADD',
        details: { product: product.product_name, time: new Date().toISOString() }
      }]);
    } else {
      toast.error(`המוצר "${productName}" לא נמצא במלאי`);
    }
  };

  // --- 3. שליחה למוח ---
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('/api/admin_pro/brain', { // שימוש בנתיב המוח הקיים
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: currentInput, 
          context: customerId ? 'CLIENT_INTERFACE' : 'ADMIN_INTERFACE',
          customerId: customerId 
        })
      });
      
      const data = await res.json();
      
      // המוח מחזיר פקודה כמו [ADD_TO_CART:חול]
      if (data.aiResponse && data.aiResponse.includes('[ADD_TO_CART:')) {
        const product = data.aiResponse.match(/\[ADD_TO_CART:(.*?)\]/)?.[1];
        if (product) await addItemToCart(product);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.aiResponse || data.answer }]);
    } catch (e) {
      toast.error("נתק במוח הלוגיסטי");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar - סל קניות מעוצב */}
      <aside className="w-96 bg-white border-l border-slate-100 flex flex-col shadow-2xl z-20">
        <div className="p-8 bg-[#0B2C63] text-white rounded-bl-[40px]">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
              <ShoppingCart size={24} className="text-blue-300" />
            </div>
            <div>
              <h2 className="font-black text-xl italic leading-none">הסל של סבן</h2>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest mt-1">Order Builder</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-xs font-bold opacity-80">פריטים בסל:</span>
            <Badge className="bg-blue-500 text-white font-black">{cart.length}</Badge>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 italic font-bold">
              <Box size={48} className="mb-2" />
              <p>הסל ריק, דבר עם ה-AI...</p>
            </div>
          ) : (
            <AnimatePresence>
              {cart.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  key={idx} 
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm font-black text-xs">{idx+1}</div>
                    <span className="font-black text-slate-700">{item.product_name}</span>
                  </div>
                  <button 
                    onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                    className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="p-6 border-t border-slate-50">
           <button className="w-full h-16 bg-[#0B2C63] text-white rounded-[20px] font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-transform flex items-center justify-center gap-3">
             שגר הזמנה לסידור 🚀
           </button>
        </div>
      </aside>

      {/* Main Chat - האזור המרכזי */}
      <main className="flex-1 flex flex-col relative bg-white">
        {/* Header אישי */}
        <header className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-none">{entityInfo?.full_name || 'טוען...'}</h3>
                <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> מחובר למוח הלוגיסטי
                </p>
              </div>
           </div>
           <div className="flex gap-2">
             <button className="p-3 bg-slate-50 text-slate-400 rounded-xl"><Zap size={20}/></button>
           </div>
        </header>

        {/* הודעות צאט */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-32 no-scrollbar">
          {messages.map((m, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              key={i} 
              className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[70%] p-6 rounded-[35px] shadow-sm relative ${
                m.role === 'user' 
                ? 'bg-slate-100 text-slate-800 rounded-br-none border border-slate-200' 
                : 'bg-[#0B2C63] text-white rounded-bl-none shadow-blue-900/20 shadow-xl'
              }`}>
                {m.role === 'assistant' && <Sparkles className="absolute -top-2 -right-2 text-blue-400 bg-white rounded-full p-1 shadow-sm" size={24} />}
                <p className="font-bold leading-relaxed whitespace-pre-wrap">{m.content.replace(/\[.*?\]/g, '')}</p>
              </div>
            </motion.div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input מעוצב כבועה צפה */}
        <div className="absolute bottom-8 left-0 right-0 px-10">
          <div className="max-w-4xl mx-auto bg-white border border-slate-100 p-2 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-3 backdrop-blur-xl bg-white/90">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב הודעה או פקודה..." 
              className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-lg placeholder:text-slate-300"
            />
            <button 
              onClick={handleSend} 
              disabled={loading}
              className="w-14 h-14 bg-[#0B2C63] rounded-2xl flex items-center justify-center text-white hover:rotate-12 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// קומפוננטת עזר תגית
const Badge = ({ children, className }: any) => (
  <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black ${className}`}>
    {children}
  </span>
);
