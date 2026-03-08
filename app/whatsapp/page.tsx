"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase"; // שימוש באותו לקוח מהקובץ שלך
import { 
  Send, Package, ShoppingCart, Info, 
  Video, Image as ImageIcon, CheckCircle2,
  ChevronRight, ArrowRight, Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function SabanChatOrder() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. פונקציית ייעוץ - מחפשת בטבלה שאתה מנהל
  const consultInventory = async (query: string) => {
    setLoading(true);
    try {
      // חיפוש בטבלת ה-inventory בדיוק כמו ב-Editor
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`)
        .limit(2);

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Search error", e);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    // שליפת נתונים מהטבלה בזמן אמת
    const foundProducts = await consultInventory(currentInput);

    // יצירת תשובה מהירה (בשלב הבא תוכל לחבר כאן את Gemini לניתוח עמוק יותר)
    const assistantMsg = {
      role: "assistant",
      content: foundProducts.length > 0 
        ? `מצאתי עבורך את המוצרים הבאים מהמלאי שלנו:` 
        : "מצטער, לא מצאתי מוצר תואם במלאי. נסה לתאר את החומר שאתה מחפש.",
      products: foundProducts,
      timestamp: Date.now()
    };

    setTimeout(() => {
      setMessages(prev => [...prev, assistantMsg]);
    }, 600);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans" dir="rtl">
      {/* אזור הצ'אט */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto border-x border-white/5 bg-slate-900/20 backdrop-blur-xl">
        <header className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black italic uppercase text-lg leading-none">Saban AI Chat</h1>
              <span className="text-[10px] text-blue-400 font-bold tracking-widest">LIVE INVENTORY CONNECTION</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] ${m.role === 'user' ? 'bg-blue-600 p-4 rounded-3xl rounded-tr-none' : ''}`}>
                <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                
                {/* הצגת כרטיסי מוצר מהטבלה שלך */}
                {m.products?.map((p: any) => (
                  <div key={p.sku} className="mt-4 bg-slate-800/50 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row">
                      {p.image_url && (
                        <img src={p.image_url} className="w-full sm:w-32 h-32 object-cover" alt={p.product_name} />
                      )}
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-white">{p.product_name}</h4>
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold">₪{p.price}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{p.description}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setCart([...cart, p]);
                              toast.success(`${p.product_name} נוסף לסל`);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black py-2 rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={14} /> הוסף להזמנה
                          </button>
                          {p.youtube_url && (
                            <button className="p-2 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                              <Video size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {loading && <Loader2 className="animate-spin text-blue-500 mx-auto" />}
        </div>

        <footer className="p-6 bg-white/5 border-t border-white/5">
          <div className="relative flex items-center gap-3">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="איזה חומר אתה מחפש? (למשל: דבק קרמיקה, שליכט...)"
              className="flex-1 bg-slate-800 border border-white/5 rounded-2xl py-4 pr-6 pl-14 outline-none focus:border-blue-500/50 transition-all text-sm font-bold"
            />
            <button 
              onClick={handleSend}
              className="absolute left-2 p-3 bg-blue-600 rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </footer>
      </main>

      {/* סל קניות צדדי */}
      <aside className="w-80 bg-slate-900/40 p-6 hidden lg:flex flex-col border-r border-white/5 backdrop-blur-2xl">
        <h3 className="font-black italic flex items-center gap-2 mb-8">
          <ShoppingCart size={20} className="text-blue-500" /> סל הזמנה
        </h3>
        <div className="flex-1 space-y-4 overflow-y-auto">
          {cart.map((item, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 items-center">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center"><Package size={16} className="text-blue-500"/></div>
              <div className="flex-1">
                <div className="text-[11px] font-bold line-clamp-1">{item.product_name}</div>
                <div className="text-[10px] text-blue-400">₪{item.price}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-6 bg-blue-600 py-4 rounded-2xl font-black italic uppercase tracking-widest text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
          שלח הזמנה לבוט
        </button>
      </aside>
    </div>
  );
}
