"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  Banknote, 
  Loader2, 
  User, 
  Phone, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  ChevronLeft,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function IntegratedCheckout() {
  const [step, setStep] = useState(1); // 1: בחירת מוצרים, 2: פרטי לקוח ותשלום
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ 
    name: "", 
    phone: "", 
    method: 'credit' as 'credit' | 'counter' 
  });
  const router = useRouter();

  // שליפת מוצרים מהקטלוג (טבלת products)
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        toast.error("שגיאה בטעינת מוצרים");
      } else {
        setProducts(data || []);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existing = cart.find(item => item.id === productId);
    if (existing?.quantity === 1) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item => 
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalOrder = async () => {
    if (!form.name || !form.phone) {
      toast.error("נא למלא שם ומספר טלפון");
      return;
    }
    if (cart.length === 0) {
      toast.error("סל הקניות ריק");
      return;
    }

    setLoading(true);
    try {
      // 1. יצירת ההזמנה הראשית בטבלת orders
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: form.name,
          phone: form.phone,
          payment_method: form.method,
          status: 'pending',
          total_price: cartTotal
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. יצירת פריטי ההזמנה בטבלת order_items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        item_name: item.name,
        quantity: item.quantity,
        sku: item.sku || '---',
        price_at_order: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. ניתוב לפי בחירת תשלום
      if (form.method === 'credit') {
        router.push(`/payment?orderId=${order.id}`);
      } else {
        router.push(`/success?method=counter&orderId=${order.id}`);
      }
      
      toast.success("ההזמנה נשלחה בהצלחה!");
    } catch (err: any) {
      console.error("Order Error:", err);
      toast.error("שגיאה בביצוע ההזמנה: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.includes(search))
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {step === 1 ? (
          <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">ח. סבן - קטלוג מוצרים</h1>
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">בחר פריטים לליקוט</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                <input 
                  className="w-full pr-10 p-3 bg-slate-100 rounded-2xl border-none text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="חיפוש לפי שם או מק\"ט..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const inCart = cart.find(item => item.id === product.id);
                return (
                  <Card key={product.id} className="rounded-3xl border-none shadow-md overflow-hidden transition-all hover:shadow-xl">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase">מק"ט: {product.sku || '---'}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 mb-4 h-12 line-clamp-2 leading-tight">{product.name}</h3>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="font-black text-xl text-slate-900">₪{product.price}</span>
                        
                        {inCart ? (
                          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => removeFromCart(product.id)} className="p-1 hover:text-red-500 transition-colors"><Minus size={18}/></button>
                            <span className="font-bold w-4 text-center">{inCart.quantity}</span>
                            <button onClick={() => addToCart(product)} className="p-1 hover:text-blue-600 transition-colors"><Plus size={18}/></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(product)}
                            className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-blue-600 transition-colors shadow-lg"
                          >
                            <Plus size={20} />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Bottom Floating Cart Bar */}
            {cart.length > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 flex justify-between items-center z-[100] animate-in slide-in-from-bottom-10">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl text-white relative">
                    <ShoppingCart size={24} />
                    <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">סה"כ לתשלום</div>
                    <div className="text-2xl font-black text-slate-900">₪{cartTotal}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-95"
                >
                  המשך לקופה <ChevronLeft size={20}/>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Checkout & Details */
          <div className="max-w-xl mx-auto space-y-6">
            <button 
              onClick={() => setStep(1)} 
              className="flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
            >
              <Plus size={16} className="rotate-45" /> חזרה לבחירת מוצרים
            </button>
            
            <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8 text-center">
                <CardTitle className="text-2xl font-black">פרטי לקוח ותשלום</CardTitle>
                <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">SabanOS Security Checkout</p>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute right-4 top-4 text-slate-400" size={18} />
                    <input 
                      className="w-full p-4 pr-12 rounded-2xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="שם מלא (עבור ההזמנה)"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute right-4 top-4 text-slate-400" size={18} />
                    <input 
                      className="w-full p-4 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-left outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                      placeholder="מספר טלפון לתיאום" type="tel"
                      value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <p className="font-black text-slate-800 mr-2 text-sm uppercase">אמצעי תשלום</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setForm({...form, method: 'credit'})}
                      className={`p-5 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${form.method === 'credit' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      <CreditCard className={form.method === 'credit' ? 'text-blue-600' : 'text-slate-400'} size={28} />
                      <span className="text-xs font-black">הקלדת אשראי</span>
                    </div>
                    <div 
                      onClick={() => setForm({...form, method: 'counter'})}
                      className={`p-5 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${form.method === 'counter' ? 'border-orange-600 bg-orange-50' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      <Banknote className={form.method === 'counter' ? 'text-orange-600' : 'text-slate-400'} size={28} />
                      <span className="text-xs font-black">מזומן בקופה</span>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-dashed border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-500">סיכום ביניים:</span>
                    <span className="font-black text-xl">₪{cartTotal}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed italic text-center">
                    בבחירת "מזומן בקופה", ההזמנה תישלח לליקוט מיידי במחסן ותמתין לך לתשלום ואיסוף בדלפק.
                  </div>
                </div>

                <button 
                  disabled={loading} onClick={handleFinalOrder}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>אישור ושליחת הזמנה <ChevronLeft size={20}/></>}
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
