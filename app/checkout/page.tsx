"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ScannerEngine from "@/components/logistics/ScannerEngine";
import { 
  Sparkles, 
  ShoppingCart, 
  Palette, 
  CheckCircle2, 
  Search, 
  X, 
  MessageSquare, 
  Scan, 
  MapPin 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PremiumCheckout() {
  const [cart, setCart] = useState<any[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*");
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const addToCart = (product: any, color = "סטנדרט") => {
    setCart(prev => [...prev, { ...product, selectedColor: color, quantity: 1 }]);
    toast.success(`${product.name} {`נוסף לסל`}`);
  };

  const handleScanProduct = async (sku: string) => {
    const { data } = await supabase.from("products").select("*").eq("sku", sku).single();
    if (data) {
      addToCart(data);
      setIsScannerOpen(false);
    } else {
      toast.error(`מק"ט ${sku} {`לא נמצא`}`);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-[#FCF9F5] pb-32" dir="rtl">
      {/* Header יוקרתי */}
      <header className="bg-white p-6 rounded-b-[3rem] shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-xl mx-auto">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">{`ח.סבן`} <span className="text-blue-600">1994</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Logistics App</p>
          </div>
          <button onClick={() => setIsAiOpen(true)} className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
            <Sparkles className="text-white" size={20} />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-xl mx-auto space-y-8">
        {/* כפתורי פעולה גדולים */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setIsScannerOpen(true)} className="bg-slate-900 h-36 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
            <div className="bg-blue-600 p-3 rounded-xl"><Scan className="text-white" size={24} /></div>
            <span className="text-white font-black text-sm tracking-wide">{`סרוק מוצר`}</span>
          </button>
          
          <Dialog>
            <DialogTrigger asChild>
              <button className="bg-white h-36 rounded-[2.5rem] border-4 border-white shadow-md flex flex-col items-center justify-center gap-3 active:scale-95">
                <div className="bg-slate-50 p-3 rounded-xl"><Search className="text-slate-400" size={24} /></div>
                <span className="text-slate-900 font-black text-sm tracking-wide">{`חיפוש במלאי`}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-[2rem] max-h-[70vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-right font-black">{`קטלוג ח.סבן`}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-3 p-2 text-right">
                {products.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)} className="flex justify-between p-4 bg-slate-50 rounded-2xl font-bold hover:bg-blue-50 transition-colors">
                    <span>{p.name}</span>
                    <span className="text-blue-600">₪{p.price}</span>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* רשימת ליקוט */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">{`פריטים לליקוט`} ({cart.length})</h3>
          {cart.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200 opacity-50 font-bold text-slate-400">
              {`הסל ריק - התחל לסרוק או לחפש`}
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between animate-in slide-in-from-bottom-2">
                <div className="flex-1 text-right">
                  <h4 className="font-black text-slate-900">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-2 justify-end">
                     <span className="text-[10px] font-bold text-slate-500">{`גוון:`} {item.selectedColor}</span>
                     <Palette size={12} className="text-blue-500" />
                  </div>
                </div>
                <p className="font-black text-blue-600 ml-4">₪{item.price}</p>
              </div>
            ))
          )}
        </div>
      </main>

      {/* יועץ AI Popup */}
      <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-2xl border-none rounded-[3rem] p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <MessageSquare className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{`יועץ המומחה של סבן`}</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            {`"שלום רמי, אני כאן כדי לעזור לך להתאים את החומרים המדויקים לפרויקט. דבקים, איטום או גיוון שליכט - רק תשאל."`}
          </p>
          <Button className="w-full h-14 bg-slate-900 rounded-2xl font-black text-lg" onClick={() => setIsAiOpen(false)}>{`בוא נתחיל לסחור`}</Button>
        </DialogContent>
      </Dialog>

      {/* סורק Popup */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="p-0 bg-transparent border-none overflow-hidden max-w-[400px]">
           <div className="bg-slate-900 p-2 rounded-[3rem]">
              <ScannerEngine onScan={handleScanProduct} />
              <Button variant="ghost" className="w-full text-white/50 h-14" onClick={() => setIsScannerOpen(false)}>{`ביטול`}</Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* סיכום הזמנה בתחתית */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl border-t p-8 rounded-t-[3.5rem] shadow-2xl z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{`סה"כ הזמנה`}</p>
            <p className="text-3xl font-black text-slate-900">₪{total.toLocaleString()}</p>
          </div>
          <button className="bg-blue-600 h-16 px-10 rounded-2xl text-white font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-all">
            {`אישור ושיגור`}
          </button>
        </div>
      </div>
    </div>
  );
}
