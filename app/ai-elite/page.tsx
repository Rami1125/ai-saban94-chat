"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Zap, ShoppingCart, Loader2, ShieldCheck, Trash2, X, Share2 } from 'lucide-react';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

// שימוש בלוגיקת העיצוב של סבן מהמאגר
const LOGO_PATH = "/ai.png";

export default function AiElitePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // חיבור למוח הקיים ללא שינוי קוד המוח
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('/api/pro_brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: input, 
          history: messages.slice(-5) 
        })
      });
      
      const data = await res.json();
      
      // פענוח פקודות אוטומטיות מהמוח (כמו הוספה לסל)
      if (data.answer.includes('[QUICK_ADD:')) {
        const sku = data.answer.match(/\[QUICK_ADD:(.*?)\]/)?.[1];
        if (sku) await addItemToCart(sku);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      toast.error("תקלה בתקשורת עם המוח");
    } finally {
      setLoading(false);
    }
  };

  const addItemToCart = async (sku: string) => {
    const { data: product } = await supabase.from('inventory').select('*').eq('sku', sku).single();
    if (product) {
      setCart(prev => [...prev, product]);
      toast.success(`נוסף לסל: ${product.product_name}`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Sidebar - סל ביצוע */}
      <aside className="w-80 bg-white border-l p-6 flex flex-col shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <img src={LOGO_PATH} className="w-10 h-10" alt="Saban AI" />
          <h2 className="font-black text-xl italic">Saban Elite</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          <h3 className="text-sm font-bold text-blue-600 uppercase flex items-center gap-2">
            <ShoppingCart size={16} /> סל פעיל ({cart.length})
          </h3>
          {cart.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
              <span className="font-bold text-sm">{item.product_name}</span>
              <button onClick={() => setCart(cart.filter((_, i) => i !== idx))}><Trash2 size={14} className="text-red-400" /></button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-32">
          {messages.map((m, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} 
              className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-6 rounded-[30px] ${m.role === 'user' ? 'bg-white border shadow-sm' : 'bg-blue-600 text-white shadow-blue-200 shadow-lg'}`}>
                <p className="font-bold leading-relaxed">{m.content.replace(/\[.*?\]/g, '')}</p>
              </div>
            </motion.div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="absolute bottom-10 left-0 right-0 px-10">
          <div className="max-w-4xl mx-auto bg-white border-2 p-2 rounded-full shadow-2xl flex items-center gap-4 ring-8 ring-slate-100/50">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="פקודה לביצוע..." 
              className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-lg"
            />
            <button onClick={handleSend} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform">
              {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
