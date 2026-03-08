"use client";

import React, { useState, useEffect, useRef } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, push } from "firebase/database";
import { 
  Send, 
  Package, 
  ShoppingCart, 
  Info, 
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrderChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const phone = "972508860896"; // ח. סבן מרכזי

  // סנכרון הודעות בזמן אמת
  useEffect(() => {
    const chatRef = ref(rtdb, `saban94/chats/${phone}`);
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data).sort((a: any, b: any) => a.timestamp - b.timestamp));
      }
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: text }],
          phone: phone,
          userId: 'customer_123'
        })
      });
      const data = await res.json();
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#efeae2] dark:bg-zinc-950 font-sans" dir="rtl">
      {/* אזור הצ'אט המרכזי */}
      <div className="flex-1 flex flex-col border-l border-zinc-200 dark:border-zinc-800">
        <header className="p-4 bg-[#f0f2f5] dark:bg-zinc-900 border-b flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h2 className="font-bold text-sm">ח. סבן - ייעוץ והזמנות</h2>
              <span className="text-[10px] text-emerald-600 animate-pulse font-bold">Gemini 3.1 Online</span>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                m.role === 'user' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white dark:bg-zinc-800 rounded-tl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                {/* הצגת מוצר אם קיים בתגובה */}
                {m.product && (
                  <Card className="mt-3 overflow-hidden border-emerald-100 bg-emerald-50/50">
                    <div className="p-3 flex gap-3">
                      {m.product.image && <img src={m.product.image} className="w-16 h-16 rounded object-cover" />}
                      <div className="flex-1">
                        <h4 className="font-bold text-xs">{m.product.product_name}</h4>
                        <p className="text-[10px] text-zinc-500 line-clamp-2">{m.product.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-black text-emerald-700 text-xs">₪{m.product.price}</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                            onClick={() => setCart([...cart, m.product])}
                          >
                            הוסף לסל
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ))}
        </div>

        <footer className="p-4 bg-[#f0f2f5] dark:bg-zinc-900 border-t flex items-center gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="שאל על חומרים, כמויות או ייעוץ טכני..."
            className="flex-1 p-2.5 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <Button onClick={() => handleSend(input)} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
            <Send size={18} />
          </Button>
        </footer>
      </div>

      {/* סרגל הזמנה (Cart) */}
      <aside className="w-80 bg-white dark:bg-zinc-900 hidden lg:flex flex-col">
        <div className="p-6 border-b">
          <h3 className="font-black flex items-center gap-2 text-zinc-800 dark:text-white">
            <ShoppingCart size={20} />
            הסל שלי ({cart.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">הסל ריק. שאל את ה-AI לייעוץ!</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100">
                <div className="w-10 h-10 bg-zinc-200 rounded flex items-center justify-center text-[10px]"><Package size={14}/></div>
                <div className="flex-1">
                  <div className="text-xs font-bold line-clamp-1">{item.product_name}</div>
                  <div className="text-[10px] text-emerald-600">₪{item.price}</div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex justify-between mb-4 font-bold">
              <span>סה"כ:</span>
              <span>₪{cart.reduce((sum, item) => sum + (item.price || 0), 0)}</span>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-emerald-500/20">
              בצע הזמנה עכשיו
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}
