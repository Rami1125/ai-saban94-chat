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
      // בדיקה אם המוצר כבר קיים בסל (לפי מק"ט או קוד גוון)
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
      // 1. יצירת הזמנה ראשית
      const { data: order, error: orderError } = await supabase.from('orders').insert([{
        customer_name: customerInfo.name,
        phone: customerInfo.phone,
        payment_method: customerInfo.method,
        status: 'pending'
      }]).select().single();

      if (orderError) throw orderError;

      // 2. הכנסת פריטים לטבלת order_items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        item_name: item.name || `גוון: ${item.code}`,
        quantity: item.quantity,
        sku: item.sku || item.code || '---'
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      toast.success("ההזמנה נשלחה להכנה!");
      router.push(customerInfo.method === 'credit' ? `/payment?id=${order.id}` : `/success`);
    } catch (err) {
      toast.error("שגיאה בשליחת ההזמנה");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-32 dir-rtl" dir="rtl">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        <ShoppingCart className="text-blue-600" /> קופה מהירה
      </h1>

      {/* פרטי לקוח */}
      <div className="space-y-3 mb-6 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <User className="absolute right-3 top-3 text-slate-400" size={16} />
          <input 
            className="w-full p-2.5 pr-10 bg-slate-50 rounded-lg border-none text-sm font-bold"
            placeholder="שם הלקוח"
            value={customerInfo.name}
            onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
          />
        </div>
        <div className="relative">
          <Phone className="absolute right-3 top-3 text-slate-400" size={16} />
          <input 
            className="w-full p-2.5 pr-10 bg-slate-50 rounded-lg border-none text-sm font-bold text-left"
            placeholder="טלפון"
            value={customerInfo.phone}
            onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
          />
        </div>
      </div>

      {/* בחירת מוצרים ומניפה */}
      <div className="space-y-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-sm font-bold mb-2">חיפוש מוצר מהמלאי</label>
          <ProductSelector onAddProduct={addToCart} />
        </div>
        
        <div className="pt-4 border-t border-slate-200">
          <label className="block text-sm font-bold mb-2">בחירת גוון ממניפה</label>
          <ColorSelector onSelect={addToCart} />
        </div>
      </div>

      {/* תצוגת הסל */}
      <div className="mt-8">
        <h2 className="font-bold mb-4">הסל שלך ({cart.length})</h2>
        {cart.length === 0 ? (
          <p className="text-slate-400 text-center py-8">הסל ריק כרגע...</p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-3">
                  {item.hex ? (
                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: item.hex }} />
                  ) : (
                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center text-blue-600">
                      <Plus size={18} />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm leading-tight">{item.name || item.code}</p>
                    <p className="text-[10px] text-slate-500">{item.sku || 'גוון מותאם'} {item.size ? `| ${item.size}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md px-1 bg-slate-50">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1"><Minus size={14}/></button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1"><Plus size={14}/></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-red-500 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* שיטת תשלום וכפתור שליחה */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-2xl max-w-md mx-auto z-50">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button 
              onClick={() => setCustomerInfo({...customerInfo, method: 'credit'})}
              className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 text-xs font-bold ${customerInfo.method === 'credit' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
            >
              <CreditCard size={16}/> אשראי
            </button>
            <button 
              onClick={() => setCustomerInfo({...customerInfo, method: 'counter'})}
              className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 text-xs font-bold ${customerInfo.method === 'counter' ? 'border-orange-600 bg-orange-50' : 'border-slate-100'}`}
            >
              <Banknote size={16}/> מזומן בקופה
            </button>
          </div>
          <Button 
            disabled={loading}
            onClick={handleFinalOrder}
            className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-blue-600 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" /> : "שלח הזמנה להכנה במחסן"}
          </Button>
        </div>
      )}
    </div>
  );
}
