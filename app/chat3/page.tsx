"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, Calculator, MessageCircle, MapPin, 
  Package, User, ShieldCheck, ShoppingCart, 
  Search, Sparkles, Loader2, RotateCcw,
  CheckCircle2, X, Phone, Info
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Saban OS V8.2 - Integrated Chat Interface
 * תיקון: הוספת "use client" וייבוא AnimatePresence
 */
export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: 'אהלן ראמי, כיף שהגעת לח. סבן. המוח הלוגיסטי מוכן לביצוע. איך אפשר לעזור היום? 🦾', timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeAction]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    setTimeout(() => {
      processAIResponse(currentInput);
    }, 600);
  };

  const processAIResponse = (text: string) => {
    let botResponse = { id: Date.now() + 1, role: 'bot', text: "", timestamp: new Date() };
    
    if (text.includes("סיקה") || text.includes("Sika")) {
      botResponse.text = "זיהיתי שאתה מחפש פתרון של סיקה. בחמ''ל סבן אנחנו נותנים לך את המעטפת של אלי המומחה הטכני. הנה הפרטים שלו:";
      setActiveAction('eli');
    } else if (text.includes("107") || text.includes("בלוק")) {
      const productData = {
        name: text.includes("בלוק") ? "בלוק איטונג 10 ס''מ" : "סיקה טופ סיל 107",
        sku: text.includes("בלוק") ? "YT-10-6025" : "SY-107",
        coverage: 0.15,
        packaging: text.includes("בלוק") ? "משטח" : "שק",
        image: "https://images.unsplash.com/photo-1600566753225-6b0bf9b29a9a?q=80&w=400"
      };
      botResponse.text = `מצאתי את ${productData.name} במלאי. הזרקתי לך את המחשבון הלוגיסטי:`;
      setSelectedProduct(productData);
      setActiveAction('product');
    } else {
      botResponse.text = "הבנתי, הבוס. אני בודק את זה. מה תרצה שנבצע? 🦾";
      setActiveAction(null);
    }
    setMessages(prev => [...prev, botResponse]);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden" dir="rtl">
      <main className="flex-1 flex flex-col relative">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-slate-900/30 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center font-black italic">S</div>
            <h2 className="text-lg font-black tracking-tighter uppercase italic">Saban OS <span className="text-blue-500">V8.2</span></h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-slate-800 border border-white/5' : 'bg-blue-600/10 border border-blue-500/20'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <AnimatePresence>
          {activeAction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end justify-center p-4 bg-slate-950/40 backdrop-blur-sm pointer-events-none">
              <div className="w-full max-w-2xl pointer-events-auto">
                {activeAction === 'eli' && <EliExpertCard onClose={() => setActiveAction(null)} />}
                {activeAction === 'product' && <ProductActionCard product={selectedProduct} onClose={() => setActiveAction(null)} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 bg-slate-900/50 border-t border-white/5">
          <div className="max-w-4xl mx-auto relative">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="w-full bg-slate-800 border border-white/5 rounded-2xl py-5 pr-6 pl-16 outline-none focus:border-blue-500/50 font-bold" />
            <button onClick={handleSend} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Send size={20} /></button>
          </div>
        </div>
      </main>
    </div>
  );
}

function EliExpertCard({ onClose }: { onClose: () => void }) {
  return (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-emerald-500/20 rounded-[32px] p-6 shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 left-4 text-slate-500"><X size={18}/></button>
      <h3 className="text-xl font-black text-white italic mb-4">אלי - מומחה טכני סיקה</h3>
      <button onClick={() => window.open('https://wa.me/972544527513', '_blank')} className="w-full h-14 bg-emerald-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2">דבר עם אלי ב-WhatsApp</button>
    </motion.div>
  );
}

function ProductActionCard({ product, onClose }: { product: any, onClose: () => void }) {
  return (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-blue-500/20 rounded-[32px] p-6 shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 left-4 text-slate-500"><X size={18}/></button>
      <h3 className="text-lg font-black text-white italic mb-2">{product?.name}</h3>
      <div className="flex gap-2">
        <button className="flex-1 h-14 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-2">הוסף להזמנה</button>
      </div>
    </motion.div>
  );
}
