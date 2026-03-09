"use client";
import { useState } from "react";
import ProductSelector from "@/components/checkout/ProductSelector";
import ColorSelector from "@/components/checkout/ColorSelector";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });

  // פונקציה להוספת מוצר/צבע לסל
  const addToCart = (item) => {
    setCart((prev) => {
      // בדיקה אם המוצר כבר קיים בסל (לפי מק"ט או קוד גוון)
      const existingIndex = prev.findIndex(i => (i.sku && i.sku === item.sku) || (i.code && i.code === item.code));
      
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

  return (
    <div className="max-w-md mx-auto p-4 pb-24 dir-rtl" dir="rtl">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        <ShoppingCart className="text-blue-600" /> קופה מהירה
      </h1>

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

      {/* כפתור שליחה צף */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] max-w-md mx-auto">
          <Button className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700">
            שלח הזמנה להכנה במחסן
          </Button>
        </div>
      )}
    </div>
  );
}
