"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CreditCard, Banknote, Loader2, User, Phone, ShoppingCart, 
  Plus, Minus, Search, ChevronLeft, Palette, Check, X 
} from "lucide-react";
import { toast } from "sonner";

// רשימת גוונים למוצרי צבע/שליכט
const COLORS = [
  { name: "לבן", code: "#FFFFFF" },
  { name: "שמנת", code: "#F5F5DC" },
  { name: "אפור בהיר", code: "#D3D3D3" },
  { name: "נס קפה", code: "#C2B280" },
  { name: "גרפיט", code: "#383838" },
];

export default function PremiumCheckout() {
  const [step, setStep] = useState(1); // 1: קטלוג, 2: פרטים ותשלום
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [form, setForm] = useState({ name: "", phone: "", method: 'credit' as 'credit' | 'counter' });
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('name');
      setProducts(data || []);
    };
    fetchProducts();
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id && item.color?.name === (product.needsColor ? selectedColor.name : undefined));
    if (existing) {
      setCart(cart.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1, 
        color: product.category?.includes('צבע') || product.name.includes('שליכט') ? selectedColor : null 
      }]);
    }
    toast.success(`${product.name} נוסף לסל`);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) newCart.splice(index, 1);
    setCart(newCart);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalOrder = async () => {
    if (!form.name || !form.phone) return toast.error("נא למלא פרטי קשר");
    setLoading(true);
    try {
      const { data: order, error: oErr } = await supabase.from('orders').insert([{
        customer_name: form.name,
        phone: form.phone,
        payment_method: form.method,
        status: 'pending',
        total_price: cartTotal
      }]).select().single();

      if (oErr) throw oErr;

      const items = cart.map(item => ({
        order_id: order.id,
        item_name: item.color ? `${item.name} (גוון: ${item.color.name})` : item.name,
        quantity: item.quantity,
        sku: item.sku || '---'
      }));

      await supabase.from('order_items').insert(items);
      router.push(form.method === 'credit' ? `/payment?orderId=${order.id}` : `/success?method=counter`);
    } catch (err) {
      toast.error("שגיאה בשמירה");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.includes(search) || p.sku?.includes(search));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-900">SabanOS Checkout</h1>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">מערכת הזמנות חכמה</p>
          </div>
          {cart.length > 0 && step === 1 && (
            <button onClick={() => setStep(2)} className="bg-slate-900 text-white px-5 py-2 rounded-2xl text-sm font-bold flex items-center gap-2">
              לקופה ({cart.length}) <ChevronLeft size={16}/>
            </button>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-6 pb-32">
        {step === 1 ? (
          <div className="space-y-8">
            {/* Search & Color Selection */}
            <section className="grid md:grid-cols-2 gap-6 bg-white p-6 rounded-[2.5rem] shadow-sm border">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 mr-2">חיפוש מוצר</label>
                <div className="relative">
                  <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
                  <input 
                    className="w-full p-3.5 pr-12 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="הקלד שם מוצר או מקט..."
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 mr-2">בחירת גוון (לצבע ושליכט)</label>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {COLORS.map(c => (
                    <button 
                      key={c.name}
                      onClick={() => setSelectedColor(c)}
                      className={`flex-shrink-0 w-12 h-12 rounded-full border-4 transition-all flex items-center justify-center ${selectedColor.name === c.name ? 'border-blue-600 scale-110' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: c.code }}
                    >
                      {selectedColor.name === c.name && <Check size={16} className={c.name === 'לבן' ? 'text-black' : 'text-white'} />}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <Card key={product.id} className="rounded-[2rem] border-none shadow-md hover:shadow-xl transition-all overflow-hidden bg-white group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-mono text-slate-400">#{product.sku || 'N/A'}</span>
                      <Palette size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-6 h-14 line-clamp-2 leading-tight">{product.name}</h3>
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-black text-slate-900">₪{product.price}</div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-slate-900 text-white p-3.5 rounded-2xl hover:bg-blue-600 transition-all active:scale-90"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Step 2: Checkout Form */
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <button onClick={() => setStep(1)} className="mb-6 text-slate-400 font-bold flex items-center gap-2 hover:text-slate-900 transition-colors">
              <ChevronLeft className="rotate-180" size={20}/> חזרה לקטלוג
            </button>

            <Card className="rounded-[3rem] shadow-2xl border-none overflow-hidden bg-white">
              <div className="bg-slate-900 p-10 text-white text-center">
                <h2 className="text-3xl font-black italic">פרטי הזמנה</h2>
                <p className="text-slate-400 text-sm mt-2">סיום תהליך ואישור ליקוט</p>
              </div>
              <CardContent className="p-10 space-y-10">
                {/* Cart Summary in Form */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">הסל שלך</p>
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        {item.color && <p className="text-[10px] text-blue-600 font-bold">גוון: {item.color.name}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(idx, -1)} className="p-1 text-slate-400 hover:text-red-500"><Minus size={14}/></button>
                        <span className="font-black text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(idx, 1)} className="p-1 text-slate-400 hover:text-blue-600"><Plus size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute right-4 top-4 text-slate-400" size={18} />
                    <input 
                      className="w-full p-4 pr-12 rounded-2xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-blue-500" 
                      placeholder="שם לקוח"
                      onChange={e => setForm({...form, name: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute right-4 top-4 text-slate-400" size={18} />
                    <input 
                      className="w-full p-4 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-left" 
                      placeholder="טלפון"
                      onChange={e => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setForm({...form, method: 'credit'})}
                    className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${form.method === 'credit' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 grayscale opacity-60'}`}
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm"><CreditCard className="text-blue-600" /></div>
                    <span className="text-xs font-black">תשלום באשראי</span>
                  </div>
                  <div 
                    onClick={() => setForm({...form, method: 'counter'})}
                    className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${form.method === 'counter' ? 'border-orange-600 bg-orange-50/50' : 'border-slate-100 grayscale opacity-60'}`}
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm"><Banknote className="text-orange-600" /></div>
                    <span className="text-xs font-black">מזומן בקופה</span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex justify-between items-center mb-6 px-4">
                    <span className="font-bold text-slate-400 uppercase">סה"כ לתשלום:</span>
                    <span className="text-3xl font-black text-slate-900 underline decoration-blue-500 decoration-4 underline-offset-8">₪{cartTotal}</span>
                  </div>
                  <button 
                    disabled={loading} onClick={handleFinalOrder}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "שלח הזמנה למחסן"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
