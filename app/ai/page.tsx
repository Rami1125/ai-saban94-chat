"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { supabase } from "@/lib/supabase"; 
import { 
  Send, Zap, ShoppingCart, Loader2, User, ShieldCheck, 
  X, Plus, Minus, ShoppingBag, Award, ImageIcon,
  CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V55.0 - Unified VIP Chat (PostgreSQL Cart Integration)
 * --------------------------------------------------------
 * - Feature: Direct SQL injection to 'shopping_carts' table.
 * - Sync: Real-time cart badge using Supabase subscriptions.
 * - UX: Note 25 Compact Modal for Qty selection.
 */

export default function UnifiedVipChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Cart & Modal States
  const [cartCount, setCartCount] = useState(0);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [productToOrder, setProductToOrder] = useState<any>(null);
  const [qty, setQty] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    async function init() {
      // 1. שליפת פרופיל הלקוח
      const { data: p } = await supabase.from('vip_profiles').select('*').eq('id', id).maybeSingle();
      setClient(p);

      // 2. שליפת כמות ראשונית מהסל ב-SQL
      fetchCartState();

      // 3. האזנה לשינויים ב-SQL בזמן אמת (Real-time Sync)
      const channel = supabase.channel('cart_updates')
        .on('postgres_changes', { event: '*', table: 'shopping_carts', filter: `user_id=eq.${id}` }, () => {
          fetchCartState();
        })
        .subscribe();

      setMessages([{ 
        role: 'assistant', 
        content: `### חדר מצב Saban OS פעיל 🦾\nשלום ${p?.nickname || 'אחי'}, המוח מוכן להזרים פקודות לביצוע ב**${p?.main_project || 'שטח'}**.` 
      }]);

      return () => { supabase.removeChannel(channel); };
    }
    init();
  }, [id, mounted]);

  const fetchCartState = async () => {
    const { data } = await supabase.from('shopping_carts').select('id').eq('user_id', id);
    setCartCount(data?.length || 0);
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // פתיחת המודאל - שליפת המוצר מהמלאי
  const triggerOrder = async (sku: string) => {
    setLoading(true);
    const { data: p } = await supabase.from('inventory').select('*').eq('sku', sku).maybeSingle();
    setLoading(false);
    
    if (p) {
      setProductToOrder(p);
      setQty(1);
      setIsQtyModalOpen(true);
    } else {
      toast.error("מוצר לא אותר במלאי המערכת");
    }
  };

  // הזרקה סופית לטבלת ה-SQL החדשה
  const finalizeAddToSql = async () => {
    if (!productToOrder) return;
    const toastId = toast.loading(`מזריק ${productToOrder.product_name} לסל...`);

    try {
      const { error } = await supabase.from('shopping_carts').upsert({
        user_id: id,
        sku: productToOrder.sku,
        product_name: productToOrder.product_name,
        price: productToOrder.price || 0,
        quantity: qty,
        image_url: productToOrder.image_url
      }, { onConflict: 'user_id,sku' });

      if (error) throw error;

      setIsQtyModalOpen(false);
      toast.success("המוצר הוזרק ללוח הזמנות! 🦾", { id: toastId });
    } catch (e: any) {
      toast.error("תקלה בהזרקה ל-Database", { id: toastId });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input; setInput("");
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, history: messages.slice(-5), customerId: id })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) { toast.error("נתק ב-DNA המערכת"); } finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* --- Note 25 Quantity Modal --- */}
      <AnimatePresence>
        {isQtyModalOpen && productToOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white rounded-[50px] w-full max-w-sm overflow-hidden shadow-2xl border border-white/10">
               <div className="bg-[#020617] p-8 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full" />
                  <div className="text-right z-10">
                     <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">כמות לביצוע</h3>
                     <p className="text-blue-400 text-[8px] font-bold uppercase mt-1 tracking-widest flex items-center gap-1 justify-end"><Award size={10}/> SQL INTEGRATED</p>
                  </div>
                  <button onClick={() => setIsQtyModalOpen(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white"><X size={20}/></button>
               </div>
               
               <div className="p-8 space-y-8 text-center">
                  <div className="flex items-center gap-4 justify-center">
                     <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md">
                        <img src={productToOrder.image_url} className="w-full h-full object-cover" />
                     </div>
                     <div className="text-right">
                        <h4 className="text-base font-black text-slate-900 leading-tight truncate max-w-[150px]">{productToOrder.product_name}</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">SKU: {productToOrder.sku}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-8 py-6 bg-slate-50 rounded-[35px] shadow-inner">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-md border border-slate-200 active:scale-90 transition-all"><Minus size={20}/></button>
                     <span className="text-5xl font-black italic text-slate-900 tracking-tighter w-20">{qty}</span>
                     <button onClick={() => setQty(qty + 1)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-all hover:bg-blue-600"><Plus size={20}/></button>
                  </div>

                  <button 
                    onClick={finalizeAddToSql}
                    className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-lg uppercase italic tracking-widest shadow-xl flex items-center justify-center gap-4 border-b-8 border-blue-800 active:translate-y-1 transition-all"
                  >
                    אשר ושגר לסל 🦾
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative bg-white max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/95 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#020617] rounded-2xl flex items-center justify-center text-blue-500 shadow-lg border-2 border-white ring-4 ring-slate-50">
                 <Zap size={20} fill="currentColor" />
              </div>
              <div className="text-right">
                 <h2 className="text-sm font-black italic uppercase leading-none">{client?.full_name || 'VIP Portal'}</h2>
                 <p className="text-[7px] text-emerald-500 font-black uppercase tracking-widest mt-1 flex items-center gap-1 italic">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Saban SQL Link
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.href='/cart'} 
                className={`relative p-3 rounded-2xl transition-all shadow-md flex items-center gap-2 ${cartCount > 0 ? 'bg-blue-600 text-white animate-bounce' : 'bg-slate-50 text-slate-400'}`}
              >
                 <ShoppingBag size={18} />
                 {cartCount > 0 && <span className="font-black text-xs italic">{cartCount}</span>}
              </motion.button>
              <img src="/ai.png" alt="S" className="h-7 object-contain" />
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-12 pb-40 scrollbar-hide bg-[#FBFCFD]">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[95%] p-8 rounded-[45px] shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200 text-slate-900 shadow-xl' : 'bg-[#020617] text-white border-white/5 shadow-2xl rounded-tr-none'
                }`}>
                  <div className={`flex items-center gap-3 mb-6 opacity-30 ${m.role === 'user' ? 'text-slate-500' : 'text-blue-300'}`}>
                     <span className="text-[8px] font-black uppercase tracking-[0.4em] italic">{m.role === 'user' ? 'VIP REQUEST' : 'OS INTELLIGENCE'}</span>
                  </div>
                  <SmartRenderer text={m.content} onAdd={triggerOrder} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
             <div className="flex justify-end pr-6">
                <div className="bg-slate-900 px-8 py-4 rounded-[30px] flex items-center gap-4 border border-white/5 animate-pulse shadow-xl">
                   <Loader2 className="animate-spin text-blue-500" size={18} />
                   <span className="text-[10px] font-black text-blue-400 uppercase italic tracking-widest">DNA Syncing...</span>
                </div>
             </div>
          )}
          <div ref={scrollRef} className="h-10" />
        </div>

        <footer className="p-6 absolute bottom-0 w-full z-20 bg-gradient-to-t from-white via-white pt-10">
          <div className="max-w-3xl mx-auto bg-white border-2 border-slate-100 p-2 rounded-[50px] shadow-[0_50px_100px_rgba(0,0,0,0.2)] flex items-center gap-4 ring-[15px] ring-slate-50/50 backdrop-blur-3xl focus-within:ring-blue-100/50 transition-all">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="כתוב פקודה או בחר מוצר לביצוע..." 
              className="flex-1 bg-transparent px-6 py-4 outline-none font-black text-xl text-right text-slate-900" 
            />
            <button onClick={handleSend} className="w-14 h-14 bg-[#020617] rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-xl">
              <Send size={24} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

function SmartRenderer({ text, onAdd }: any) {
  if (!text) return null;

  const skuMatch = text.match(/\[QUICK_ADD:\s*([^\]]+)\]/i);
  const sku = skuMatch ? skuMatch[1] : null;

  const galleryMatch = text.match(/\[GALLERY:\s*([^\]]+)\]/i);
  const urls = galleryMatch ? galleryMatch[1].split(',').map(u => u.trim()).filter(u => u.length > 5) : [];

  const cleanText = text
    .replace(/\[GALLERY:[\s\S]*?\]/gi, '')
    .replace(/\[QUICK_ADD:[\s\S]*?\]/gi, '')
    .replace(/\[VIDEO:[\s\S]*?\]/gi, '')
    .trim();

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {urls.length > 0 && (
        <div className="my-4 grid grid-cols-12 gap-3 h-48">
           <div className="col-span-8 bg-slate-900 rounded-[30px] overflow-hidden border border-white/5 relative shadow-lg">
              <img src={urls[0]} className="w-full h-full object-cover" alt="Main" />
           </div>
           <div className="col-span-4 flex flex-col gap-3">
              {urls.slice(1, 3).map((url, i) => (
                <div key={i} className="flex-1 bg-slate-900 rounded-[20px] overflow-hidden border border-white/5 shadow-sm">
                   <img src={url} className="w-full h-full object-cover grayscale opacity-60" alt="Thumb" />
                </div>
              ))}
           </div>
        </div>
      )}

      {cleanText.split('\n').map((line: string, i: number) => {
        if (!line.trim()) return null;
        if (line.startsWith('###')) return <h3 key={i} className="text-2xl font-black text-white italic border-r-6 border-blue-600 pr-4 my-8 uppercase tracking-tight">{line.replace('###', '')}</h3>;
        return <p key={i} className="text-[18px] leading-relaxed font-bold text-white/90 tracking-tight">{line}</p>;
      })}

      {sku && (
        <button 
          onClick={() => onAdd(sku)}
          className="w-full mt-8 bg-white text-slate-950 py-6 rounded-[35px] font-black text-[11px] uppercase tracking-[0.5em] shadow-xl flex items-center justify-center gap-4 border-b-6 border-slate-200 active:scale-95 transition-all italic cursor-pointer"
        >
          הוסף להזמנה <ShoppingCart size={22} className="text-blue-600" />
        </button>
      )}
    </div>
  );
}
