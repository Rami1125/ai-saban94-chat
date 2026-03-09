"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ProductSelector from "@/components/checkout/ProductSelector";
import ColorSelector from "@/components/checkout/ColorSelector";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, Loader2, User, Phone, CreditCard, Banknote } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", method: 'counter' as 'credit' | 'counter' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      // תיקון שגיאת 400: שליחת אובייקט נקי ללא פרמטר columns מיותר
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerInfo.name,
          phone: customerInfo.phone,
          payment_method: customerInfo.method,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

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

      toast.success("ההזמנה נשלחה בהצלחה");
      router.push(customerInfo.method === 'credit' ? `/payment?id=${order.id}` : `/success`);
    } catch (err) {
      console.error("Supabase Error:", err);
      toast.error("שגיאה ב-DB: וודא שהעמודות קיימות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-32" dir="rtl">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        <ShoppingCart className="text-blue-600" /> קופה מהירה
      </h1>

      <div className="space-y-3 mb-6 bg-white p-5 rounded-3xl border shadow-sm">
        <div className="relative">
          <User className="absolute right-3 top-3.5 text-slate-400" size={18} />
          <input 
            className="w-full p-3 pr-10 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="שם הלקוח"
            value={customerInfo.name}
            onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
          />
        </div>
        <div className="relative">
          <Phone className="absolute right-3 top-3.5 text-slate-400" size={18} />
          <input 
            className="w-full p-3 pr-10 bg-slate-50 rounded-2xl border-none font-bold text-left outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="טלפון"
            value={customerInfo.phone}
            onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-6 bg-slate-100/50 p-5 rounded-3xl border border-slate-200">
        <div>
          <label className="block text-xs font-black mb-2 text-slate-500 mr-2 uppercase">חיפוש מוצר</label>
          <ProductSelector onAddProduct={addToCart} />
        </div>
        <div className="pt-4 border-t border-slate-200">
          <label className="block text-xs font-black mb-2 text-slate-500 mr-2 uppercase">מניפת גוונים</label>
          <ColorSelector onSelect={addToCart} />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="font-black text-lg mr-2">הסל שלך ({cart.length})</h2>
        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-300 text-slate-400">הסל ריק</div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-3">
                  {item.hex ? (
                    <div className="w-12 h-12 rounded-xl border-2 border-white shadow-inner" style={{ backgroundColor: item.hex }} />
                  ) : (
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">BOX</div>
                  )}
                  <div>
                    <p className="font-bold text-sm">{item.name || item.code}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.sku || 'CUSTOM COLOR'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 rounded-xl p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-blue-600"><Minus size={14}/></button>
                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-blue-600"><Plus size={14}/></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t shadow-2xl max-w-md mx-auto z-50 rounded-t-[2.5rem]">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button 
              onClick={() => setCustomerInfo({...customerInfo, method: 'credit'})}
              className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${customerInfo.method === 'credit' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
            >
              <CreditCard size={20} className={customerInfo.method === 'credit' ? 'text-blue-600' : 'text-slate-400'}/>
              <span className="text-[10px] font-black mt-1">אשראי</span>
            </button>
            <button 
              onClick={() => setCustomerInfo({...customerInfo, method: 'counter'})}
              className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${customerInfo.method === 'counter' ? 'border-orange-600 bg-orange-50' : 'border-slate-100'}`}
            >
              <Banknote size={20} className={customerInfo.method === 'counter' ? 'text-orange-600' : 'text-slate-400'}/>
              <span className="text-[10px] font-black mt-1">מזומן</span>
            </button>
          </div>
          <Button 
            disabled={loading}
            onClick={handleFinalOrder}
            className="w-full h-14 text-lg font-black bg-slate-900 rounded-2xl hover:bg-blue-600 shadow-xl transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : "אישור ושליחה למחסן"}
          </Button>
        </div>
      )}
    </div>
  );
}
