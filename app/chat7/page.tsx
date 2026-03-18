"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { supabase } from "@/lib/supabase"; 
import { 
  Send, Zap, ShoppingCart, Loader2, User, ShieldCheck, 
  X, Plus, Minus, ShoppingBag, Award, ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

export default function SabanVIPChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchCartCount();
  }, [id]);

  const fetchCartCount = async () => {
    const { data } = await supabase.from('shopping_carts').select('id').eq('user_id', id);
    setCartCount(data?.length || 0);
  };

  const handleOpenModal = async (sku: string) => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    setLoading(false);
    if (data) {
      setActiveProduct(data);
      setQty(1);
      setIsModalOpen(true);
    }
  };

  const finalizeOrder = async () => {
    if (!activeProduct) return;
    const { error } = await supabase.from('shopping_carts').upsert({
      user_id: id,
      sku: activeProduct.sku,
      product_name: activeProduct.product_name,
      price: activeProduct.price || 0,
      quantity: qty,
      image_url: activeProduct.image_url
    }, { onConflict: 'user_id,sku' });

    if (!error) {
      toast.success("המוצר הוזרק לסל לביצוע! 🦾");
      setIsModalOpen(false);
      fetchCartCount();
    } else {
      toast.error("תקלה בהזרקה ל-DB");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    const res = await fetch('/api/admin_pro/brain', {
      method: 'POST',
      body: JSON.stringify({ customerId: id, query: q, history: messages.slice(-5) })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    setLoading(false);
  };

  if (!mounted) return null;

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />

      {/* --- Note 25 Qty Modal --- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[45px] w-full max-w-sm overflow-hidden shadow-2xl border border-white/10 p-8 space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black italic uppercase">כמות לביצוע</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-xl"><X size={20}/></button>
               </div>
               <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                  <img src={activeProduct?.image_url} className="w-16 h-16 rounded-xl object-cover shadow-md" />
                  <div className="text-right">
                     <p className="font-black text-slate-900">{activeProduct?.product_name}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">SKU: {activeProduct?.sku}</p>
                  </div>
               </div>
               <div className="flex items-center justify-center gap-8 py-6 bg-slate-50 rounded-[30px]">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center"><Minus size={20}/></button>
                  <span className="text-4xl font-black text-slate-900">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-md flex items-center justify-center"><Plus size={20}/></button>
               </div>
               <button onClick={finalizeOrder} className="w-full bg-blue-600 text-white py-5 rounded-[30px] font-black text-lg uppercase italic shadow-xl active:scale-95 transition-all">
                  אשר ושגר לסל 🦾
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Chat UI --- */}
      <header className="h-20 border-b border-slate-100 flex items-center justify-between px-6 bg-white/95 sticky top-0 z-50">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#020617] rounded-2xl flex items-center justify-center text-blue-500 shadow-lg border-2 border-white ring-4 ring-slate-50"><Zap size={20} fill="currentColor" /></div>
            <h2 className="text-sm font-black italic uppercase">Saban VIP OS</h2>
         </div>
         <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-all ${cartCount > 0 ? 'bg-blue-600 text-white animate-bounce shadow-xl' : 'bg-slate-50 text-slate-400'}`}>
               <ShoppingBag size={20} />
               {cartCount > 0 && <span className="mr-2 font-black text-xs">{cartCount}</span>}
            </div>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 scrollbar-hide">
         {messages.map((m, i) => (
           <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[90%] p-6 rounded-[35px] border ${m.role === 'user' ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#020617] text-white border-white/5 shadow-2xl'}`}>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-4">{m.role === 'user' ? 'Client Request' : 'OS Intelligence'}</p>
                 <SmartRenderer text={m.content} onAdd={handleOpenModal} />
              </div>
           </div>
         ))}
         {loading && <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />}
         <div ref={scrollRef} className="h-20" />
      </div>

      <footer className="p-6 bg-white border-t border-slate-100">
         <div className="max-w-3xl mx-auto flex gap-4 bg-slate-50 p-2 rounded-[40px] shadow-inner">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="ראמי, מה נבצע עכשיו?" className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-lg text-right text-slate-900" />
            <button onClick={handleSend} className="w-14 h-14 bg-[#020617] rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-all"><Send size={24} /></button>
         </div>
      </footer>
    </div>
  );
}

function SmartRenderer({ text, onAdd }: any) {
  const skuMatch = text.match(/\[QUICK_ADD:\s*([^\]]+)\]/i);
  const sku = skuMatch ? skuMatch[1] : null;
  const cleanText = text.replace(/\[GALLERY:[\s\S]*?\]/gi, '').replace(/\[QUICK_ADD:[\s\S]*?\]/gi, '').trim();

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {cleanText.split('\n').map((line: string, i: number) => (
        <p key={i} className="text-sm font-bold leading-relaxed">{line}</p>
      ))}
      {sku && (
        <button onClick={() => onAdd(sku)} className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border-b-4 border-slate-200 active:scale-95 transition-all">
          הוסף להזמנה <ShoppingCart size={16} className="text-blue-600" />
        </button>
      )}
    </div>
  );
}
