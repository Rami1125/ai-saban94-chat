"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { 
  PlusCircle, Search, User, Package, Trash2, 
  Minus, Plus, Scale, Truck, CheckCircle2, 
  ChevronRight, AlertTriangle, Loader2, Save, 
  MapPin, Phone, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from "sonner";

/**
 * Saban Admin Pro - Quick Order Creator V28.0
 * -----------------------------------------
 * - Customer Search: Interactive VIP selection.
 * - Product Catalog: Real-time weight calculation.
 * - Weight Guard: 12,000kg truck limit enforcement.
 * - API Integration: Direct sync with /api/orders/create.
 */

export default function CreateOrderPage() {
  const router = useRouter();
  
  // States
  const [step, setStep] = useState(1); // 1: Customer, 2: Products, 3: Review
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. טעינת נתונים ראשונית
  useEffect(() => {
    async function loadInitialData() {
      const [custRes, invRes, weightRes] = await Promise.all([
        supabase.from('vip_profiles').select('*').order('full_name'),
        supabase.from('inventory').select('*').order('product_name'),
        supabase.from('product_weights').select('*')
      ]);
      
      setCustomers(custRes.data || []);
      setInventory(invRes.data || []);
      setWeights(weightRes.data || []);
    }
    loadInitialData();
  }, []);

  // 2. חישובי משקל וסל (חוק ה-12 טון)
  const totalWeight = useMemo(() => {
    return cart.reduce((sum, item) => {
      const rule = weights.find(w => w.sku === item.sku);
      const unitWeight = rule ? parseFloat(rule.weight_kg) : 25;
      return sum + (unitWeight * item.qty);
    }, 0);
  }, [cart, weights]);

  const weightStatus = useMemo(() => {
    const limit = selectedCustomer?.truck_limit_kg || 12000;
    const percentage = (totalWeight / limit) * 100;
    return {
      percentage: Math.min(percentage, 100),
      isOver: totalWeight > limit,
      left: Math.max(limit - totalWeight, 0)
    };
  }, [totalWeight, selectedCustomer]);

  // 3. לוגיקת סל
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.sku === product.sku);
      if (existing) {
        return prev.map(i => i.sku === product.sku ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { sku: product.sku, name: product.product_name, qty: 1 }];
    });
    toast.success(`${product.product_name} נוסף לסל`);
  };

  const updateQty = (sku: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.sku === sku) {
        const newQty = Math.max(i.qty + delta, 1);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(i => i.sku !== sku));
  };

  // 4. שליחת הזמנה ל-API
  const handleSubmit = async () => {
    if (!selectedCustomer || cart.length === 0) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading("יוצר פקודת עבודה במוח...");

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          items: cart,
          deliveryDetails: {
            address: selectedCustomer.main_project,
            contact_name: selectedCustomer.nickname || selectedCustomer.full_name,
            contact_phone: selectedCustomer.phone,
            project: selectedCustomer.main_project
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success("ההזמנה הוזרקה לביצוע! 🦾", { id: toastId });
        router.push('/admin_pro/orders');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast.error("תקלה בביצוע: " + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filters
  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchCustomer.toLowerCase()) || 
    c.id.includes(searchCustomer)
  );

  const filteredInventory = inventory.filter(i => 
    i.product_name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    i.sku.includes(searchProduct)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header & Steps */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
              <PlusCircle size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">יצירת הזמנה חדשה</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest italic">Saban OS Logistics Entry</p>
           </div>
        </div>

        <div className="flex items-center gap-2">
           {[1, 2, 3].map((s) => (
             <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                  step === s ? 'bg-blue-600 text-white shadow-lg scale-110' : 
                  step > s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s ? <CheckCircle2 size={20}/> : s}
                </div>
                {s < 3 && <div className={`w-8 h-1 mx-1 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Customer Selection */}
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]"
              >
                <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                   <div className="relative group">
                      <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input 
                        placeholder="חפש לקוח VIP (שם או מזהה)..." 
                        value={searchCustomer}
                        onChange={(e) => setSearchCustomer(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 pr-14 pl-6 py-5 rounded-[25px] font-bold outline-none focus:border-blue-600 transition-all text-lg" 
                      />
                   </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredCustomers.map(c => (
                     <button 
                       key={c.id} 
                       onClick={() => { setSelectedCustomer(c); setStep(2); }}
                       className={`p-6 rounded-[30px] border-2 text-right transition-all group flex items-center justify-between ${
                         selectedCustomer?.id === c.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200 bg-white'
                       }`}
                     >
                       <div>
                          <p className="font-black text-slate-900 text-lg leading-none">{c.full_name}</p>
                          <p className="text-xs font-bold text-slate-400 mt-2 italic flex items-center gap-2 uppercase tracking-tight">
                             <MapPin size={12} className="text-blue-500"/> {c.main_project}
                          </p>
                       </div>
                       <ChevronRight className={`text-slate-300 group-hover:text-blue-600 group-hover:translate-x-[-5px] transition-all`} />
                     </button>
                   ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Product Catalog */}
            {step === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]"
              >
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                   <div className="relative group flex-1 ml-6">
                      <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      <input 
                        placeholder="חפש מוצר מהמלאי (שם או מק''ט)..." 
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 pr-14 pl-6 py-4 rounded-[22px] font-bold outline-none focus:border-blue-600 transition-all" 
                      />
                   </div>
                   <button onClick={() => setStep(1)} className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:bg-slate-200 transition-all"><ArrowLeft/></button>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredInventory.slice(0, 12).map(p => (
                     <div key={p.sku} className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-blue-200 transition-all">
                        <div className="text-right flex-1">
                           <p className="font-black text-slate-800 text-sm leading-none">{p.product_name}</p>
                           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-widest">SKU: {p.sku}</p>
                        </div>
                        <button 
                          onClick={() => addToCart(p)}
                          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all active:scale-90"
                        >
                           <Plus size={24}/>
                        </button>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div 
                key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[45px] border border-slate-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col"
              >
                <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                   <div className="text-right">
                      <h3 className="text-2xl font-black italic uppercase">סיכום פקודת עבודה</h3>
                      <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ready for Brain Injection</p>
                   </div>
                   <Truck size={40} className="text-blue-500 opacity-50" />
                </div>
                <div className="flex-1 p-10 space-y-8">
                   <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[30px] border border-slate-100">
                      <div><p className="text-[10px] font-black text-slate-400 uppercase italic">לקוח VIP</p><p className="font-black text-lg italic">{selectedCustomer.full_name}</p></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase italic">אתר פריקה</p><p className="font-black text-lg italic">{selectedCustomer.main_project}</p></div>
                   </div>
                   <div className="space-y-3">
                      <h4 className="font-black text-slate-900 italic border-b pb-2 text-sm uppercase tracking-widest">Items List</h4>
                      {cart.map(item => (
                        <div key={item.sku} className="flex justify-between items-center p-5 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
                           <div className="text-right">
                              <p className="font-black text-slate-800">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase italic">Quantity: {item.qty}</p>
                           </div>
                           <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-lg shadow-lg italic">x{item.qty}</div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="p-10 border-t border-slate-100">
                   <button 
                     onClick={handleSubmit} 
                     disabled={isSubmitting}
                     className="w-full bg-blue-600 text-white py-8 rounded-[35px] font-black text-2xl flex items-center justify-center gap-6 shadow-2xl active:scale-95 transition-all border-b-8 border-blue-800 uppercase tracking-widest italic"
                   >
                      {isSubmitting ? <Loader2 className="animate-spin" size={32}/> : <Save size={32}/>}
                      הזרק הזמנה למערכת
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar - Cart Summary & Weight Guard */}
        <div className="space-y-6">
           {/* Current Selection Card */}
           {selectedCustomer && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
                <div className="relative z-10 space-y-5">
                   <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-xl"><User size={24}/></div>
                      <div className="text-right">
                         <p className="font-black italic text-lg leading-none">{selectedCustomer.full_name}</p>
                         <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Active VIP Client</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs font-bold opacity-70 italic"><MapPin size={14}/> {selectedCustomer.main_project}</div>
                      <div className="flex items-center gap-3 text-xs font-bold opacity-70 italic"><Phone size={14}/> {selectedCustomer.phone}</div>
                   </div>
                   <button onClick={() => { setSelectedCustomer(null); setStep(1); setCart([]); }} className="text-[10px] font-black uppercase text-rose-400 hover:underline">החלף לקוח 🔄</button>
                </div>
             </motion.div>
           )}

           {/* Weight Guard Monitor */}
           <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-xl">
              <div className="flex justify-between items-center mb-8">
                 <h4 className="font-black text-slate-800 italic uppercase tracking-tighter text-sm flex items-center gap-2">
                    <Scale size={18} className="text-blue-600"/> בקרת חוק 12 טון
                 </h4>
                 {weightStatus.isOver && <AlertTriangle size={20} className="text-rose-500 animate-bounce" />}
              </div>

              <div className="space-y-6">
                 <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                    <motion.div 
                       initial={{ width: 0 }} 
                       animate={{ width: `${weightStatus.percentage}%` }}
                       className={`h-full rounded-full transition-all duration-500 ${weightStatus.isOver ? 'bg-rose-500' : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]'}`} 
                    />
                 </div>
                 
                 <div className="flex justify-between items-end">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase italic mb-1">משקל נוכחי</p>
                       <p className={`text-4xl font-black italic tracking-tighter ${weightStatus.isOver ? 'text-rose-600' : 'text-slate-900'}`}>
                          {totalWeight} <span className="text-xs uppercase">KG</span>
                       </p>
                    </div>
                    <div className="text-left opacity-50">
                       <Truck size={32} />
                    </div>
                 </div>

                 {weightStatus.isOver ? (
                   <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 text-[10px] font-black uppercase italic leading-relaxed">
                      חריגת משקל קריטית! המשאית תעבור את ה-12 טון. צמצם כמויות או פתח משאית נוספת.
                   </div>
                 ) : (
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center italic">
                      נותרו {weightStatus.left} ק"ג לקיבולת מלאה 🦾
                   </p>
                 )}
              </div>
           </div>

           {/* Quick Cart */}
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl flex flex-col max-h-[400px]">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-[40px]">
                 <h4 className="font-black text-slate-800 italic uppercase text-xs flex items-center gap-2"><Package size={16}/> סל זמני ({cart.length})</h4>
                 {cart.length > 0 && <button onClick={() => setCart([])} className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">נקה הכל</button>}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                 {cart.length === 0 ? (
                   <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto text-slate-200"><Package size={24}/></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase italic">הסל ריק</p>
                   </div>
                 ) : (
                   cart.map(item => (
                     <div key={item.sku} className="flex items-center justify-between group">
                        <div className="text-right">
                           <p className="font-black text-slate-800 text-xs leading-none">{item.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-1 italic italic">x{item.qty}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => updateQty(item.sku, -1)} className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600"><Minus size={14}/></button>
                           <button onClick={() => updateQty(item.sku, 1)} className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600"><Plus size={14}/></button>
                           <button onClick={() => removeFromCart(item.sku)} className="p-1.5 bg-rose-50 rounded-lg hover:bg-rose-100 text-rose-500"><Trash2 size={14}/></button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
              {step < 3 && cart.length > 0 && (
                <div className="p-6 border-t border-slate-50">
                   <button 
                     onClick={() => setStep(3)} 
                     className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 italic"
                   >
                      לסיכום וביצוע <ChevronRight size={16}/>
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>

      <footer className="py-12 border-t border-slate-200 opacity-20 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.6em] italic">Saban Logistics High-Speed Entry V28.0</p>
      </footer>
    </div>
  );
}
