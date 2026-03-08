"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, Search, Package, MessageSquare, 
  ChevronRight, Calculator, Plus, Minus, Send,
  Info, CheckCircle2, X, Play, Loader2
} from "lucide-react";
import { ProductCard } from "@/components/chat/ProductCard"; // שימוש בקומפוננטה שלך
import { ActionOverlays } from "@/components/chat/ActionOverlays"; // שימוש במחשבון שלך
import { toast } from "sonner";

export default function SabanOnlineStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. שליפת מוצרים מהמלאי (Supabase)
  useEffect(() => {
    async function getStoreData() {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .order("product_name");
      setProducts(data || []);
      setLoading(false);
    }
    getStoreData();
  }, []);

  // 2. פונקציית ייעוץ מול ה-API של Gemini
  const askGemini = async (text: string) => {
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...messages, userMsg],
          phone: "store_web_user",
          userId: "web_customer"
        }),
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.text,
        product: data.product // אם Gemini זיהה מוצר ב-DB, הוא יחזור כאן
      }]);
    } catch (e) {
      toast.error("שגיאה בחיבור ליועץ ה-AI");
    }
  };

  const addToCart = (product: any, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.sku === product.sku);
      if (existing) {
        return prev.map(item => item.sku === product.sku ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { ...product, qty }];
    });
    toast.success(`נוסף לסל: ${product.product_name}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100" dir="rtl">
      
      {/* Header מקצועי */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">ח. סבן 1994</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">חומרי בניין ופתרונות לוגיסטיים</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="חפש מוצר טכני..." 
                className="bg-slate-100 border-none rounded-2xl py-2.5 pr-10 pl-4 w-64 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors">
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-12">
        <header className="mb-12">
          <h2 className="text-4xl font-black text-slate-800 mb-2">קטלוג מוצרים</h2>
          <div className="flex gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-action-overlay', { detail: { type: 'calculator' } }))}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all"
            >
              <Calculator size={14} /> מחשבון כמויות גבס
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.filter(p => p.product_name.includes(searchTerm)).map((product) => (
              <ProductCard key={product.sku} product={product} onAddToCart={(qty) => addToCart(product, qty)} />
            ))}
          </div>
        )}
      </main>

      {/* Floating AI Chat Button */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-8 left-8 z-[60] bg-blue-600 text-white p-4 rounded-full shadow-2xl shadow-blue-400/40 hover:scale-110 active:scale-95 transition-all"
      >
        {chatOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Side Chat Interface */}
      <AnimatePresence>
        {chatOpen && (
          <motion.aside 
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-white shadow-3xl border-r border-slate-200 flex flex-col"
          >
            <header className="p-6 border-b bg-slate-50 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold italic">S</div>
              <div>
                <h3 className="font-black text-slate-800 italic uppercase">Saban AI Advisor</h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Gemini 3.1 Live
                </span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="bg-blue-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Info className="text-blue-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 leading-relaxed">שאל אותי על חומרים, כמויות<br/>או ייעוץ טכני לביצוע עבודה.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] space-y-3">
                    <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' ? 'bg-blue-600 text-white rounded-tl-none' : 'bg-slate-100 text-slate-700 rounded-tr-none'
                    }`}>
                      {m.content}
                    </div>
                    {m.product && <ProductCard product={m.product} />}
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 border-t bg-slate-50/50">
              <div className="relative flex items-center gap-2">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askGemini(input)}
                  placeholder="כתוב הודעה ליועץ..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pr-6 pl-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button onClick={() => askGemini(input)} className="absolute left-2 p-3 bg-blue-600 text-white rounded-xl">
                  <Send size={18} />
                </button>
              </div>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>

      <ActionOverlays />
    </div>
  );
}
