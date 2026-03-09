"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductSelector from "@/components/checkout/ProductSelector";
import ColorSelector from "@/components/checkout/ColorSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingCart, Loader2, User, Phone } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  // State לניהול הסל והלקוח
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // הוספת פריט לסל (מוצר מלאי או גוון מניפה)
  const addToCart = (item) => {
    setCart((prev) => {
      // זיהוי אם הפריט כבר קיים (לפי מק"ט או קוד גוון)
      const existingIndex = prev.findIndex(
        (i) => (item.sku && i.sku === item.sku) || (item.code && i.code === item.code)
      );

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      
      // פריט חדש - מוסיפים מזהה ייחודי זמני לרינדור
      return [...prev, { ...item, quantity: 1, cartId: crypto.randomUUID() }];
    });
    toast.success(`התווסף לסל: ${item.name || item.code}`);
  };

  const updateQuantity = (cartId, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
    toast.info("הפריט הוסר מהסל");
  };

  // פונקציית השליחה המרכזית
  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error("חובה למלא שם וטלפון כדי שנזהה אותך במחסן");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. יצירת "ראש הזמנה" בטבלת orders
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customerInfo.name,
            phone: customerInfo.phone,
            total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
            status: "pending",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. הכנת השורות לטבלת order_items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        sku: item.sku || null,
        item_name: item.name || item.code,
        quantity: item.quantity,
        hex_color: item.hex || null,
        container_size: item.size || null,
      }));

      // 3. שליחה מרוכזת של כל הפריטים
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      // הצלחה ואיפוס
      toast.success("ההזמנה התקבלה! צוות ח. סבן כבר מכין אותה.");
      setCart([]);
      setCustomerInfo({ name: "", phone: "" });
      
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("משהו השתבש בשליחה. נסה שוב או פנה לדלפק.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-32 min-h-screen bg-slate-50/50" dir="rtl">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex justify-center items-center gap-2">
          <ShoppingCart className="text-blue-600 w-8 h-8" />
          קופה מהירה
        </h1>
        <p className="text-slate-500 text-sm mt-1">ח. סבן חומרי בניין 1994 בע"מ</p>
      </header>

      {/* פרטי לקוח */}
      <section className="mb-6 space-y-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <User size={16} /> פרטים אישיים
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <Input
            placeholder="שם מלא"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            className="bg-slate-50 border-none h-12"
          />
          <Input
            placeholder="מספר טלפון"
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            className="bg-slate-50 border-none h-12"
          />
        </div>
      </section>

      {/* הוספת מוצרים */}
      <section className="space-y-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold mb-3">חיפוש מהמלאי (מקט/שם)</h2>
          <ProductSelector onAddProduct={addToCart} />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold mb-3">בחירת גוון נירלט/טמבור</h2>
          <ColorSelector onSelect={addToCart} />
        </div>
      </section>

      {/* רשימת הסל */}
      <section className="mb-10">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          הזמנה נוכחית <span className="text-blue-600 bg-blue-50 px-2 rounded-full text-sm">{cart.length}</span>
        </h2>
        
        {cart.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">הסל שלך מחכה למוצרים...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <Card key={item.cartId} className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.hex ? (
                      <div className="w-12 h-12 rounded-lg border shadow-inner" style={{ backgroundColor: item.hex }} />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Plus size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 text-sm leading-tight">{item.name || item.code}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {item.sku ? `מק"ט: ${item.sku}` : "גוון בהתאמה"} {item.size && ` | ${item.size}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-full px-2 py-1">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:text-blue-600 transition-colors"><Minus size={14} /></button>
                      <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:text-blue-600 transition-colors"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeItem(item.cartId)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* כפתור שליחה צף */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || cart.length === 0}
            className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-2xl transition-all active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                מעבד הזמנה...
              </>
            ) : (
              `שלח הזמנה להכנה (${cart.length})`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
