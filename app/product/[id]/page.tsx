"use client";

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, MoreVertical, Minus, Plus, 
  ShoppingCart, Home, Cpu, User, Trash2, 
  ChevronRight, Truck, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban OS V29.0 - Cart Review Elite
 * -------------------------------------------
 * - Theme: Stitched UI (Slate-950 + Emerald-500)
 * - Logic: Real-time quantity management & dynamic calculations.
 */

export default function CartReviewPage() {
  // נתוני דמו (במציאות יישלפו מה-Context של הסל)
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Titanium Core Paint", sku: "19255", price: 249.00, qty: 1, type: "Elite Series Grade", img: "https://gilar.co.il/wp-content/uploads/2020/03/GLR_MOCKUP_SITE_PICS_013-400x400.png" },
    { id: 2, name: "Graphene Sealant", sku: "SY-107", price: 185.00, qty: 2, type: "Nano-tech Coating", img: "https://gilar.co.il/wp-content/uploads/2020/03/SikaCeram-255-Starflex-LD-90x90.png" }
  ]);

  const updateQty = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const removeItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast.error("המוצר הוסר מהסל");
  };

  const { subtotal, tax, total } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const t = sub * 0.17; // מע"מ ישראלי
    return { subtotal: sub, tax: t, total: sub + t };
  }, [cartItems]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans selection:bg-emerald-500/30" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />
      
      <div className="relative flex h-auto min-h-screen w-full max-w-md mx-auto flex-col bg-[#F8FAFC] dark:bg-[#020617] overflow-x-hidden border-x border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Header Stitched */}
        <header className="flex items-center p-6 justify-between">
          <button onClick={() => window.history.back()} className="size-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border border-dashed border-emerald-500/30 text-slate-900 dark:text-white transition-transform active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-[0.3em] flex-1 text-center italic">Cart Review - Saban OS</h2>
          <button className="size-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border border-dashed border-emerald-500/30">
            <MoreVertical size={20} className="text-slate-400" />
          </button>
        </header>

        {/* Elite Selection List */}
        <div className="px-6 py-4 flex-1">
          <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-[60px] border border-dashed border-emerald-500/30">
            <div className="bg-white dark:bg-[#0F172A] rounded-[60px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-slate-900 dark:text-white text-2xl font-black italic uppercase tracking-tighter">Elite Selection</h2>
                 <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">{cartItems.length} ITEMS</span>
              </div>

              <AnimatePresence mode="popLayout">
                {cartItems.map((item) => (
                  <motion.div 
                    layout key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="group"
                  >
                    <div className="flex items-center gap-5 py-4">
                      <div className="relative size-20 shrink-0">
                        <img src={item.img} className="w-full h-full object-cover rounded-[22px] ring-2 ring-emerald-500/10" alt={item.name} />
                        <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                           <Trash2 size={12} />
                        </button>
                      </div>
                      
                      <div className="flex-1 text-right">
                        <p className="text-slate-900 dark:text-white font-black text-lg leading-tight italic">{item.name}</p>
                        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-1 mb-3">{item.type}</p>
                        
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 w-fit px-3 py-1.5 rounded-full border border-slate-100 dark:border-white/5">
                          <button onClick={() => updateQty(item.id, -1)} className="text-emerald-500 hover:scale-125 transition-transform"><Minus size={14}/></button>
                          <span className="text-sm font-black dark:text-white w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="text-emerald-500 hover:scale-125 transition-transform"><Plus size={14}/></button>
                        </div>
                      </div>
                      
                      <div className="text-left shrink-0">
                        <p className="text-slate-900 dark:text-white font-black text-lg">₪{(item.price * item.qty).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-white/5 my-2 last:hidden" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Summary & Logistics */}
        <div className="mt-auto px-6 pb-32">
          <div className="bg-slate-100 dark:bg-slate-900/80 p-8 rounded-[60px] border border-dashed border-emerald-500/30 backdrop-blur-xl">
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Subtotal</span>
                <span className="text-slate-900 dark:text-white font-black">₪{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><Truck size={14}/> Saban Logistics</span>
                <span className="text-emerald-500 font-black italic">FREE</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Priority Tax (17%)</span>
                <span className="text-slate-900 dark:text-white font-black">₪{tax.toLocaleString()}</span>
              </div>
              <div className="h-px bg-slate-300 dark:bg-white/10 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] italic leading-none">Total Amount</span>
                <span className="text-4xl font-black text-emerald-500 italic tracking-tighter leading-none">₪{total.toLocaleString()}</span>
              </div>
            </div>

            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-black text-xl py-7 rounded-[40px] flex items-center justify-center gap-4 transition-all active:translate-y-1 border-b-[8px] border-emerald-700 shadow-2xl uppercase italic tracking-tighter group">
              <ShoppingCart size={24} className="group-hover:rotate-12 transition-transform" />
              PROCEED TO COMMAND 🦾
            </button>
          </div>
        </div>

        {/* Bottom Nav Stitched */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
          <div className="flex gap-2 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#020617] px-8 pb-8 pt-5 rounded-t-[50px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
            {[
              { icon: Home, label: "Home", active: false },
              { icon: ShoppingCart, label: "Cart", active: true, badge: cartItems.length },
              { icon: Cpu, label: "Specs", active: false },
              { icon: User, label: "Account", active: false }
            ].map((nav, i) => (
              <button key={i} className={`flex flex-1 flex-col items-center justify-center gap-1.5 transition-all ${nav.active ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
                <div className="relative">
                  <nav.icon size={22} fill={nav.active ? "currentColor" : "none"} />
                  {nav.badge && (
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-[#020617] text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#020617] shadow-lg">
                      {nav.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">{nav.label}</p>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
