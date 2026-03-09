"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Scanner from "@/components/logistics/Scanner";
import { 
  ShoppingCart, 
  ScanLine, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  CreditCard,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // פונקציה להוספת מוצר לסל לפי סריקת מק"ט
  const handleScanProduct = async (sku: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("sku", sku)
        .single();

      if (error || !data) {
        toast.error(`מוצר ${sku} לא נמצא במערכת`);
        return;
      }

      addToCart(data);
      setIsScannerOpen(false); // סגירת המצלמה אחרי זיהוי
      toast.success(`${data.name} נוסף לסל`);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.sku === product.sku);
      if (existing) {
        return prev.map(item => 
          item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        sku: product.sku, 
        name: product.name, 
        price: product.price || 0, 
        quantity: 1 
      }];
    });
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.sku === sku ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(item => item.sku !== sku));
    toast.info("המוצר הוסר מהסל");
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header קבוע */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-2 rounded-xl">
            <ShoppingCart className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-black">קופה מהירה<span className="text-blue-600">.</span></h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowRight size={24} />
        </Button>
      </header>

      <main className="p-6 space-y-6 max-w-2xl mx-auto">
        
        {/* כפתור סריקה פרימיום */}
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogTrigger asChild>
            <button className="w-full bg-slate-900 group overflow-hidden relative h-24 rounded-[2rem] flex items-center justify-between px-8 shadow-2xl active:scale-95 transition-all">
              <div className="relative z-10 flex flex-col items-start">
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Scanner Pro</span>
                <span className="text-white text-xl font-black">סרוק מוצר למכירה</span>
              </div>
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform">
                <ScanLine className="text-white" size={28} />
              </div>
              {/* אלמנט עיצובי ברקע */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl"></div>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 border-none bg-transparent">
            <div className="bg-white p-2 rounded-[2.5rem] overflow-hidden">
               <Scanner onScan={handleScanProduct} />
               <Button 
                variant="ghost" 
                className="w-full h-12 font-bold text-slate-400"
                onClick={() => setIsScannerOpen(false)}
               >
                 ביטול
               </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* רשימת פריטים */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-tighter px-2">הסל שלך ({cart.length})</h2>
          
          {cart.length === 0 ? (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-12 text-center">
              <PackageSearch className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold italic">הסל ריק. השתמש בסורק למעלה.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.sku} className="bg-white p-4 rounded-3xl border shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-right-4">
                <div className="flex-1">
                  <h3 className="font-black text-slate-900">{item.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>
                  <p className="text-blue-600 font-black mt-1">₪{item.price.toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-50 rounded-2xl p-1 border">
                    <button onClick={() => updateQuantity(item.sku, -1)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400"><Minus size={16} /></button>
                    <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.sku, 1)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-900"><Plus size={16} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.sku)} className="text-red-200 hover:text-red-500 transition-colors p-2">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Footer סיכום ותשלום */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 pb-8 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] z-50">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-slate-400 font-bold text-sm">סה"כ לתשלום:</span>
              <span className="text-2xl font-black text-slate-900">₪{total.toLocaleString()}</span>
            </div>
            <button className="w-full bg-blue-600 h-16 rounded-2xl text-white font-black text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all">
              המשך לתשלום <CreditCard size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
