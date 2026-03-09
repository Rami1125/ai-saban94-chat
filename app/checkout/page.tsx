"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Scanner from "@/components/logistics/Scanner";
import { 
  ShoppingCart, ScanLine, Trash2, Plus, Minus, 
  ArrowRight, CreditCard, PackageSearch, X, 
  User, Phone, MapPin, Calendar, Truck, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface CartItem {
  id: string; sku: string; name: string; price: number; quantity: number; category?: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State לטופס המשלוח
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    deliveryDate: "",
    notes: ""
  });

  const handleScanProduct = async (sku: string) => {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("sku", sku).single();
      if (error || !data) {
        toast.error(`מק"ט ${sku} לא נמצא`);
        return;
      }
      addToCart(data);
      setIsScannerOpen(false);
      toast.success(`${data.name} נוסף לסל`);
    } catch (err) { console.error(err); }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.sku === product.sku);
      if (existing) {
        return prev.map(item => item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, sku: product.sku, name: product.name, price: product.price || 0, quantity: 1, category: product.category }];
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmitOrder = async () => {
    if (!formData.customerName || !formData.phone || cart.length === 0) {
      toast.error("נא למלא שם, טלפון ולהוסיף מוצרים");
      return;
    }

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_name: formData.customerName,
          phone: formData.phone,
          address: formData.address,
          delivery_date: formData.deliveryDate,
          total_price: total,
          status: 'pending'
        }]).select().single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      await supabase.from("order_items").insert(orderItems);
      
      toast.success("ההזמנה נשלחה בהצלחה!");
      setCart([]);
      setFormData({ customerName: "", phone: "", address: "", deliveryDate: "", notes: "" });
    } catch (err) {
      toast.error("שגיאה בשליחת ההזמנה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-44" dir="rtl">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b p-4 flex justify-between items-center px-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Truck className="text-white" size={18} /></div>
          <h1 className="text-lg font-black tracking-tight text-slate-900">יציאת משלוח<span className="text-blue-600">.</span></h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}><ArrowRight size={22} /></Button>
      </header>

      <main className="p-5 max-w-xl mx-auto space-y-8">
        {/* כפתור סורק Premium */}
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogTrigger asChild>
            <button className="w-full bg-slate-950 h-24 rounded-[2rem] flex items-center justify-between px-8 shadow-2xl active:scale-95 transition-all border border-white/5">
              <div className="text-right">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Scanner Engine</p>
                <h2 className="text-white text-xl font-black">הוסף מוצר בסריקה</h2>
              </div>
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20"><ScanLine className="text-white" size={28} /></div>
            </button>
          </DialogTrigger>
          <DialogContent className="p-0 border-none bg-slate-950 sm:max-w-[400px] rounded-[3rem] overflow-hidden">
             <Scanner onScan={handleScanProduct} />
             <Button variant="ghost" onClick={() => setIsScannerOpen(false)} className="w-full text-white/40 h-12">סגור</Button>
          </DialogContent>
        </Dialog>

        {/* טופס פרטי לקוח */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <User size={16} className="text-blue-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">פרטי לקוח ומשלוח</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input placeholder="שם הלקוח / קבלן" className="rounded-2xl bg-slate-50 border-none h-12 font-bold px-4" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
            <Input placeholder="טלפון ליצירת קשר" type="tel" className="rounded-2xl bg-slate-50 border-none h-12 font-bold px-4" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input placeholder="כתובת פריקה" className="rounded-2xl bg-slate-50 border-none h-12 font-bold px-4" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <Input type="date" className="rounded-2xl bg-slate-50 border-none h-12 font-bold px-4 pl-12 text-right" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} />
            </div>
          </div>
        </section>

        {/* סל מוצרים */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">פריטים להעמסה ({cart.length})</h3>
          {cart.length === 0 ? (
            <div className="bg-slate-100/50 rounded-[2rem] p-10 text-center border-2 border-dashed border-slate-200">
              <PackageSearch className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-xs font-bold text-slate-400 italic text-pretty">הסל ריק. השתמש בסורק להוספת חומרים.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.sku} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-blue-600 mb-0.5 uppercase">{item.category}</p>
                    <h4 className="font-black text-slate-900 text-sm">{item.name}</h4>
                    <p className="text-slate-400 font-mono text-[10px]">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-1 border">
                    <button onClick={() => { /* logic */ }} className="p-2 text-slate-400"><Minus size={14}/></button>
                    <span className="font-black text-sm">{item.quantity}</span>
                    <button onClick={() => { /* logic */ }} className="p-2 text-slate-900"><Plus size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t p-6 rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.06)] z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
          <div className="text-right shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סה"כ הזמנה</p>
            <p className="text-2xl font-black text-slate-900">₪{total.toLocaleString()}</p>
          </div>
          <button 
            disabled={loading || cart.length === 0}
            onClick={handleSubmitOrder}
            className="flex-1 bg-blue-600 h-16 rounded-2xl text-white font-black text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? "שולח..." : "אשר ושגר משלוח"} <CheckCircle size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
