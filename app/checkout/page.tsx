"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Banknote, Loader2, User, Phone, ShoppingCart, Plus, Minus, Search } from "lucide-react";
import { toast } from "sonner";

export default function IntegratedCheckout() {
  const [step, setStep] = useState(1); // 1: בחירת מוצרים, 2: פרטי לקוח ותשלום
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", method: 'credit' as 'credit' | 'counter' });
  const router = useRouter();

  // שליפת מוצרים מהקטלוג
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      setProducts(data || []);
    };
    fetchProducts();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existing = cart.find(item => item.id === productId);
    if (existing?.quantity === 1) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item));
    }
  };

  const handleFinalOrder = async () => {
    if (!form.name || !form.phone) return toast.error("נא למלא פרטי קשר");
    if (cart.length === 0) return toast.error("הסל ריק");

    setLoading(true);
    try {
      // 1. יצירת הזמנה ראשית
      const { data: order, error: orderError } = await supabase.from('orders').insert([{
        customer_name: form.name,
        phone: form.phone,
        payment_method: form.method,
        status: 'pending'
      }]).select().single();

      if (orderError) throw orderError;

      // 2. יצירת פריטי הזמנה עם מק"ט
      const orderItems = cart.map(item => ({
        order_id: order.id,
        item_name: item.name,
        quantity: item.quantity,
        sku: item.sku || '---'
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. ניתוב לפי סוג תשלום
      if (form.method === 'credit') {
        router.push(`/payment?orderId=${order.id}`);
      } else {
        router.push(`/success?method=counter`);
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בביצוע ההזמנה - וודא שהעמודות קיימות ב-DB");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.includes(search));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {step === 1 ? (
          <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
              <h1 className="text-2xl font-black text-slate-900">בחירת מוצרים</h1>
              <div className="relative w-64">
                <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                <input 
                  className="w-full pr-10 p-2 bg-slate-100 rounded-xl border-none text-sm" 
                  placeholder="חיפוש מוצר..." 
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="rounded-3xl border-none shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
                  <CardContent className="p-5">
                    <div className="text-[10px] text-blue-600 font-bold mb-1 uppercase tracking-tighter">מק"ט: {product.sku}</div>
                    <h3 className="font-bold text-slate-800 mb-4 h-12 overflow-hidden">{product.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="font-black text-lg">₪{product.price}</span>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-slate-900 text-white p-2 rounded-xl hover:bg-blue-600"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white p-6 rounded-[2.5rem] shadow-2xl border flex justify-between items-center z-50">
                <div>
                  <div className="text-xs text-slate-400 font-bold">סה"כ פריטים: {cart.length}</div>
                  <div className="text-xl font-black">₪{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2"
                >
                  המשך לתשלום <ShoppingCart size={20}/>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-6">
            <button onClick={() => setStep(1)} className="text-slate-400 font-bold text-sm mb-4">→ חזרה לבחירת מוצרים</button>
            <Card className="rounded-[2.5rem] shadow-2xl border-none">
              <CardHeader className="bg-slate-900 text-white p-8 text-center rounded-t-[2.5rem]">
                <CardTitle className="text-2xl font-black">פרטי לקוח ותשלום</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <input 
                  className="w-full p-4 rounded-2xl bg-slate-100 border-none font-bold" 
                  placeholder="שם מלא"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                />
                <input 
                  className="w-full p-4 rounded-2xl bg-slate-100 border-none font-bold text-left" 
                  placeholder="טלפון" type="tel"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setForm({...form, method: 'credit'})}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 ${form.method === 'credit' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
                  >
                    <CreditCard className={form.method === 'credit' ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="text-xs font-bold">אשראי</span>
                  </div>
                  <div 
                    onClick={() => setForm({...form, method: 'counter'})}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 ${form.method === 'counter' ? 'border-orange-600 bg-orange-50' : 'border-slate-100'}`}
                  >
                    <Banknote className={form.method === 'counter' ? 'text-orange-600' : 'text-slate-400'} />
                    <span className="text-xs font-bold">תשלום בקופה</span>
                  </div>
                </div>

                <button 
                  disabled={loading} onClick={handleFinalOrder}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "שלח הזמנה למחסן"}
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
