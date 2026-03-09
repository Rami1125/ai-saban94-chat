"use client";

import { useState } from "react";
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
  PackageSearch,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. פונקציית הקסם: סריקה והוספה אוטומטית
  const handleScanProduct = async (sku: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("sku", sku)
        .single();

      if (error || !data) {
        toast.error(`מק"ט ${sku} לא קיים במערכת`, {
          description: "אנא וודא שהמוצר הוזן לטבלת המלאי",
        });
        return;
      }

      addToCart(data);
      setIsScannerOpen(false); // סגירה אוטומטית לחוויה חלקה
      toast.success(`${data.name} נוסף לסל`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
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
        quantity: 1,
        category: product.category
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
    toast.info("המוצר הוסר");
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-40" dir="rtl">
      {/* Header יוקרתי */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
            <ShoppingCart className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black leading-none text-slate-900">קופה מהירה</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Saban94 Logistics</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.history.back()}>
          <ArrowRight size={24} />
        </Button>
      </header>

      <main className="p-5 max-w-xl mx-auto space-y-6">
        
        {/* כפתור סריקה - הלב של הדף */}
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogTrigger asChild>
            <button className="w-full bg-slate-900 group relative h-28 rounded-[2.5rem] flex items-center justify-between px-8 shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98]">
              <div className="text-right">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">מצלמה מוכנה</p>
                <h2 className="text-white text-2xl font-black">סרוק מוצר</h2>
              </div>
              <div className="bg-blue-600 p-5 rounded-[1.5rem] shadow-xl group-hover:scale-110 transition-transform">
                <ScanLine className="text-white" size={32} />
              </div>
              {/* דקורציה */}
              <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none"></div>
            </button>
          </DialogTrigger>
          
          <DialogContent className="p-0 border-none bg-transparent sm:max-w-[400px]">
            <div className="bg-slate-900 rounded-[3rem] p-2 shadow-2xl relative">
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="absolute top-6 right-6 z-50 bg-white/10 backdrop-blur-md p-2 rounded-full text-white"
              >
                <X size={20} />
              </button>
              <Scanner onScan={handleScanProduct} />
              <div className="p-6 text-center">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest italic">כוון את המלבן לברקוד</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* רשימת המוצרים בסל */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase">פריטים בסל ({cart.length})</h3>
            {cart.length > 0 && (
               <button onClick={() => setCart([])} className="text-[10px] font-bold text-red-400 underline">רוקן סל</button>
            )}
          </div>
          
          {cart.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 py-16 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageSearch className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-400 font-bold">הסל מחכה לסריקה הראשונה שלך</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.sku} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between animate-in slide-in-from-right-4">
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{item.category || 'כללי'}</span>
                    <h4 className="font-black text-slate-900 mt-1">{item.name}</h4>
                    <p className="text-blue-600 font-black text-sm mt-1">₪{item.price.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border">
                    <button onClick={() => updateQuantity(item.sku, -1)} className="p-2 text-slate-400 hover:text-slate-900"><Minus size={16} /></button>
                    <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.sku, 1)} className="p-2 text-slate-900"><Plus size={16} /></button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                    <button onClick={() => removeFromCart(item.sku)} className="p-2 text-red-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer צף לסיכום ותשלום */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t p-6 pb-10 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.08)] z-50">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
            <div className="text-right">
              <p className="text-slate-400 text-xs font-bold uppercase">סה"כ לתשלום</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">₪{total.toLocaleString()}</p>
            </div>
            <button className="flex-1 bg-blue-600 h-16 rounded-[1.5rem] text-white font-black text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
              סיום עסקה <CreditCard size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
