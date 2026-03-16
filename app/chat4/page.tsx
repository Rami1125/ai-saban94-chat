"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, MoreVertical, Minus, Plus, 
  ShoppingCart, Home, Cpu, User, Trash2, 
  Truck, ShieldCheck, Loader2, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import { initializeApp, getApp, getApps } from 'firebase/app'; // הוספת getApp, getApps
import { getFirestore, collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

/**
 * Saban OS V31.0 - Cart Review Live Sync (Build Safe)
 * -------------------------------------------
 * Fix: Added check to prevent duplicate Firebase initialization during build.
 */

const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');

// בדיקה אם האפליקציה כבר קיימת לפני אתחול (מונע שגיאת duplicate-app ב-Vercel)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "saban-os-v1";

export default function CartReviewPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    initAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const cartCollection = collection(db, 'artifacts', appId, 'users', user.uid, 'cart');
    const unsubscribeCart = onSnapshot(cartCollection, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCartItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Cart fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribeCart();
  }, [user]);

  const updateQty = async (id: string, delta: number) => {
    if (!user) return;
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(1, item.qty + delta);
    const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'cart', id);
    await updateDoc(itemRef, { qty: newQty });
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'cart', id);
    await deleteDoc(itemRef);
    toast.error("המוצר הוסר מהסל");
  };

  const { subtotal, tax, total } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const t = sub * 0.17;
    return { subtotal: sub, tax: t, total: sub + t };
  }, [cartItems]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    toast.success("ההזמנה שודרה לביצוע בחדר המצב! 🦾");
  };

  if (loading && !user) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
       <Loader2 className="animate-spin text-emerald-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans selection:bg-emerald-500/30" dir="rtl">
      <Toaster position="top-center" richColors theme="dark" />
      
      <div className="relative flex h-auto min-h-screen w-full max-w-md mx-auto flex-col bg-[#F8FAFC] dark:bg-[#020617] overflow-x-hidden border-x border-slate-200 dark:border-slate-800 shadow-2xl">
        <header className="flex items-center p-6 justify-between">
          <button onClick={() => window.history.back()} className="size-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border border-dashed border-emerald-500/30 text-slate-900 dark:text-white transition-transform active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-[0.3em] flex-1 text-center italic">Cart Review</h2>
          <button className="size-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border border-dashed border-emerald-500/30">
            <MoreVertical size={20} className="text-slate-400" />
          </button>
        </header>

        <div className="px-6 py-4 flex-1">
          <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-[60px] border border-dashed border-emerald-500/30">
            <div className="bg-white dark:bg-[#0F172A] rounded-[60px] p-8 shadow-2xl min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-slate-900 dark:text-white text-2xl font-black italic uppercase tracking-tighter">Elite Selection</h2>
                 <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">{cartItems.length} ITEMS</span>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-20 text-center opacity-20">
                   <ShoppingBag size={64} className="mx-auto mb-4" />
                   <p className="font-black uppercase tracking-widest italic">סל ריק</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => (
                    <motion.div layout key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="group">
                      <div className="flex items-center gap-5 py-4">
                        <div className="relative size-20 shrink-0">
                          <img src={item.img} className="w-full h-full object-cover rounded-[22px] ring-2 ring-emerald-500/10" alt={item.name} />
                          <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-slate-900 dark:text-white font-black text-lg leading-tight italic truncate max-w-[120px]">{item.name}</p>
                          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 w-fit px-3 py-1.5 rounded-full mt-3">
                            <button onClick={() => updateQty(item.id, -1)} className="text-emerald-500"><Minus size={14}/></button>
                            <span className="text-sm font-black dark:text-white">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="text-emerald-500"><Plus size={14}/></button>
                          </div>
                        </div>
                        <div className="text-left shrink-0"><p className="text-slate-900 dark:text-white font-black text-lg">₪{(item.price * item.qty).toLocaleString()}</p></div>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-white/5 my-2 last:hidden" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto px-6 pb-32">
          <div className="bg-slate-100 dark:bg-slate-900/80 p-8 rounded-[60px] border border-dashed border-emerald-500/30 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-8">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">Total Amount</span>
              <span className="text-4xl font-black text-emerald-500 italic tracking-tighter leading-none">₪{total.toLocaleString()}</span>
            </div>
            <button onClick={handleCheckout} disabled={cartItems.length === 0} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-black text-xl py-7 rounded-[40px] flex items-center justify-center gap-4 transition-all active:translate-y-1 border-b-[8px] border-emerald-700 shadow-2xl uppercase italic disabled:opacity-30">
              <ShoppingCart size={24} /> PROCEED TO COMMAND 🦾
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
