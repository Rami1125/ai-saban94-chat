"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ProductSelector from "@/components/checkout/ProductSelector";
import ColorSelector from "@/components/checkout/ColorSelector";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, Loader2, User, Phone, CreditCard, Banknote, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", method: 'counter' as 'credit' | 'counter' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // פונקציה להוספה לסל - לוגיקה מקורית
  const addToCart = (item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(i => 
        (item.sku && i.sku === item.sku) || (item.code && i.code === item.code)
      );
      
      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      return [...prev, { ...item, quantity: 1, id: crypto.randomUUID() }];
    });
    toast.success(`${item.name || item.code} נוסף לסל`);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleFinalOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      return toast.error("נא למלא שם ומספר טלפון");
    }
    if (cart.length === 0) return toast.error("הסל ריק");

    setLoading(true);
    try {
      // 1. יצירת ההזמנה - ללא שימוש ב-select(*) שגורם ל-400 אם אין הרשאות
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerInfo.name,
          phone: customerInfo.phone,
          payment_method: customerInfo.method,
          status: 'pending'
        })
        .select('id') // מחזירים רק ID כדי לחסוך ברוחב פס ולמנוע שגיאות RLS
        .single();

      if (orderError) throw orderError;

      // 2. הכנסת פריטים
      const orderItems = cart.map(item => ({
        order_id: order.id,
        item_name: item.name || `גוון: ${item.code}`,
        quantity: item.quantity,
        sku: item.sku || item.code || '---'
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("ההזמנה התקבלה במערכת");
      router.push(customerInfo.method === 'credit' ? `/payment?id=${order.id}` : `/success`);
      
    } catch (err: any) {
      console.error("Critical Supabase Error:", err.message);
      toast.error(`שגיאה: ${err.message === 'New row violates row-level security policy' ? 'אין הרשאות כתיבה (RLS)' : 'וודא שטבלת orders קיימת'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-40" dir="rtl">
      {/* Header עם סגנון פרימיום */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tighter">קופה<span className="text-blue-600">.</span></h1>
        <div className="bg-slate-100 p-2 rounded-2xl">
          <ShoppingCart size={20} className="text-slate-600" />
        </div>
      </div>

      {/* פרטי לקוח - כרטיס מעוצב */}
      <section className="mb-8 space-y-4">
        <h2 className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">מידע להזמנה</h2>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm space-y-4">
          <div className="relative">
            <User className="absolute right-4 top-3.5 text-slate-300" size={18} />
            <input 
              className="w-full p-3 pr-12 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="שם מלא"
              onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
            />
          </div>
          <div className="relative">
            <Phone className="absolute right-4 top-3.5 text-slate-300" size={18} />
            <input 
              className="w-full p-3 pr-12 bg-slate-50 rounded-2xl border-none font-bold text-left outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="מספר טלפון"
              type="tel"
              onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
            />
          </div>
        </div>
      </section>

      {/* בחירה - מוצרים וצבעים */}
      <section className="space-y-4 mb-8">
        <h2 className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">ליקוט פריטים</h2>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 mr-1">חיפוש בקטלוג</label>
            <ProductSelector onAddProduct={addToCart} />
          </div>
          <div className="pt-4 border-t border-slate-800">
            <label className="text-[10px] font-bold text-slate-400 mr-1">מניפת גוונים</label>
            <ColorSelector onSelect={addToCart} />
          </div>
        </div>
      </section>

      {/* רשימת הסל */}
      <section className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">הסל שלך ({cart.length})</h2>
        {cart.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400 italic text-sm">הסל מחכה לפריטים...</div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl border shadow-inner flex-shrink-0" 
                    style={{ backgroundColor: item.hex || '#f1f5f9' }}
                  />
                  <div>
                    <p className="font-bold text-sm text-slate-800 leading-tight">{item.name || item.code}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">{item.sku || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-50 rounded-lg p-1 border">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-blue-600"><Minus size={14}/></
