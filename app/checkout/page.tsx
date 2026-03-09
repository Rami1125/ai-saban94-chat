"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Scanner from "@/components/logistics/Scanner";
import { 
  ShoppingCart, ScanLine, Trash2, Plus, Minus, 
  ArrowRight, CreditCard, PackageSearch, X, 
  User, Phone, MapPin, Calendar, Truck, CheckCircle, Search, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CartItem {
  id: string; sku: string; name: string; price: number; quantity: number; category?: string; color?: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: "", phone: "", address: "", deliveryDate: "", notes: ""
  });

  // שליפת רשימת מוצרים לבחירה ידנית
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*").order('name');
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const handleScanProduct = async (sku: string) => {
    const { data, error } = await supabase.from("products").select("*").eq("sku", sku).single();
    if (error || !data) {
      toast.error(`מק"ט ${sku} לא נמצא`);
      return;
    }
    addToCart(data);
    setIsScannerOpen(false);
    toast.success(`${data.name} נוסף`);
  };

  const addToCart = (product: any, color?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.sku === product.sku && item.color === color);
      if (existing) {
        return prev.map(item => (item.sku === product.sku && item.color === color) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, color: color || "רגיל" }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-44 px-4" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b -mx-4 p-4 flex justify-between items-center px-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Truck className="text-white" size={18} /></div>
          <h1 className="text-lg font-black text-slate-900">יציאת משלוח<span className="text-blue-600">.</span></h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}><ArrowRight size={22} /></Button>
      </header>

      <div className="max-w-xl mx-auto space-y-6">
        {/* פעולות מהירות: סורק + בחירה ידנית */}
        <div className="grid grid-cols-2 gap-4">
          <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
            <DialogTrigger asChild>
              <button className="bg-slate-900 h-32 rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-xl active:scale-95 transition-all border border-white/5">
                <ScanLine className="text-blue-400" size={32} />
                <span className="text-white font-black text-sm">סריקת ברקוד</span>
              </button>
            </DialogTrigger>
            <DialogContent className="p-0 border-none bg-slate-950 rounded-[3rem] overflow-hidden">
               <Scanner onScan={handleScanProduct} />
            </DialogContent>
          </Dialog>

          <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
            <DialogTrigger asChild>
              <button className="bg-white h-32 rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-md border border-slate-100 active:scale-95 transition-all">
                <Search className="text-blue-600" size={32} />
                <span className="text-slate-900 font-black text-sm">בחירה ידנית</span>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-[2rem] max-h-[80vh] overflow-y-auto p-6">
              <DialogHeader><DialogTitle className="text-right font-black mb-4">בחר מוצר מהרשימה</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {products.map(p => (
                  <button key={p.id} onClick={() => { addToCart(p); setIsManualOpen(false); }} className="w-full text-right p-4 bg-slate-50 rounded-2xl font-bold hover:bg-blue-50 transition-colors flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-blue-600 font-mono text-xs">₪{p.price}</span>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* טופס לקוח */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">פרטי משלוח</h3>
          <div className="space-y-3">
            <Input placeholder="שם הלקוח" className="rounded-2xl bg-slate-50 border-none h-12 font-bold px-4" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
            <Input placeholder="טלפון" type="tel" className="rounded-2xl bg-slate-50 border-none h-12 font-bold px-4" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input placeholder="כתובת פריקה" className="rounded-2xl bg-slate-50 border-none h-12 font-bold px-4" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
        </section>

        {/* סל מוצרים עם בחירת גוון */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 font-mono">סל העמסה ({cart.length})</h3>
          {cart.length === 0 ? (
            <div className="bg-slate-100/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
              <PackageSearch className="mx-auto text-slate-200 mb-2" size={40} />
              <p className="text-xs font-bold text-slate-400 italic">הסל ריק</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={`${item.sku}-${index}`} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-right-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-sm leading-tight">{item.name}</h4>
                      <p className="text-slate-400 font-mono text-[10px] mt-1">{item.sku}</p>
                    </div>
                    <button onClick={() => setCart(prev => prev.filter((_, i) => i !== index))} className="text-slate-300 hover:text-red-500"><X size={18}/></button>
                  </div>

                  {/* בחירת גוון / צבע */}
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-slate-400" />
                    <Select onValueChange={(val) => setCart(prev => prev.map((it, i) => i === index ? {...it, color: val} : it))}>
                      <SelectTrigger className="h-8 bg-slate-50 border-none rounded-lg text-[10px] font-bold w-32">
                        <SelectValue placeholder="בחר גוון" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">
                        <SelectItem value="לבן">לבן</SelectItem>
                        <SelectItem value="שמנת">שמנת</SelectItem>
                        <SelectItem value="אפור">אפור</SelectItem>
                        <SelectItem value="בז'">בז'</SelectItem>
                        <SelectItem value="שקוף">שקוף</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <p className="font-black text-blue-600 text-sm">₪{(item.price * item.quantity).toLocaleString()}</p>
                    <div className="flex items-center gap-3 bg-slate-900 text-white rounded-xl p-1 px-2">
                      <button onClick={() => updateQuantity(index, -1)} className="p-1"><Minus size={14}/></button>
                      <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, 1)} className="p-1"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* סיכום עסקה ושיגור */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t p-6 pb-10 rounded-t-[3rem] shadow-[0_-15px_50px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סה"כ לתשלום</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">₪{total.toLocaleString()}</p>
            </div>
            <button onClick={() => toast.success("הזמנה שוגרה!")} className="flex-1 bg-blue-600 h-16 rounded-2xl text-white font-black text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
              שגר משלוח <CheckCircle size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
