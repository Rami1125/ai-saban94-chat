"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, MoreVertical, Minus, Plus, 
  ShoppingCart, Home, Cpu, User, Trash2, 
  Truck, ShieldCheck, Loader2, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

/**
 * Saban OS V31.0 - Cart Review Live Sync (Build Safe)
 * -------------------------------------------
 * Fix: Removed "projectId" provided error by checking config existence.
 */

const getFirebaseDB = () => {
  const configRaw = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!configRaw) return null;
  try {
    const config = JSON.parse(configRaw);
    if (!config.projectId) return null;
    const app = !getApps().length ? initializeApp(config) : getApp();
    return { db: getFirestore(app), auth: getAuth(app) };
  } catch (e) { return null; }
};

const firebase = getFirebaseDB();
const appId = "saban-os-v1";

export default function CartReviewPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try { await signInAnonymously(firebase.auth); } catch (err) {}
    };
    initAuth();
    
    const unsubscribeAuth = onAuthStateChanged(firebase.auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !firebase) return;

    setLoading(true);
    const cartCollection = collection(firebase.db, 'artifacts', appId, 'users', user.uid, 'cart');
    const unsubscribeCart = onSnapshot(cartCollection, (snapshot) => {
      setCartItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsubscribeCart();
  }, [user]);

  const updateQty = async (id: string, delta: number) => {
    if (!user || !firebase) return;
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(1, item.qty + delta);
    const itemRef = doc(firebase.db, 'artifacts', appId, 'users', user.uid, 'cart', id);
    await updateDoc(itemRef, { qty: newQty });
  };

  const removeItem = async (id: string) => {
    if (!user || !firebase) return;
    const itemRef = doc(firebase.db, 'artifacts', appId, 'users', user.uid, 'cart', id);
    await deleteDoc(itemRef);
    toast.error("המוצר הוסר מהסל");
  };

  const { total } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    return { total: sub * 1.17 };
  }, [cartItems]);

  if (loading && !cartItems.length) return (
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
                 <h2 className="text-slate-900 dark:text-white text-2xl font-black italic uppercase tracking-tighter leading-none">Elite Selection</h2>
                 <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">{cartItems.length} ITEMS</span>
              </div>

              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-5">
                    <img src={item.img} className="size-16 rounded-2xl object-cover ring-2 ring-white/10" alt={item.name} />
                    <div className="flex-1 text-right">
                      <p className="text-white font-black text-sm leading-tight italic">{item.name}</p>
                      <div className="flex items-center gap-4 bg-slate-800 w-fit px-3 py-1.5 rounded-full mt-2">
                        <button onClick={() => updateQty(item.id, -1)} className="text-emerald-500"><Minus size={14}/></button>
                        <span className="text-sm font-black text-white">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="text-emerald-500"><Plus size={14}/></button>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-rose-500 p-2"><Trash2 size={16}/></button>
                  </div>
                ))}
                {!cartItems.length && <p className="text-center text-slate-500 italic py-20">סל ריק - מחכה לפקודה</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto px-6 pb-32">
          <div className="bg-slate-100 dark:bg-slate-900/80 p-8 rounded-[60px] border border-dashed border-emerald-500/30 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-8">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Total Amount</span>
              <span className="text-4xl font-black text-emerald-500 italic tracking-tighter leading-none">₪{total.toLocaleString()}</span>
            </div>
            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#020617] font-black text-xl py-7 rounded-[40px] flex items-center justify-center gap-4 transition-all active:translate-y-1 border-b-[8px] border-emerald-700 shadow-2xl uppercase italic">
              <ShoppingCart size={24} /> PROCEED TO COMMAND 🦾
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
