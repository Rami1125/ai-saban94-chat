"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, Calculator, MessageCircle, MapPin, 
  Package, User, ShieldCheck, ShoppingCart, 
  Search, Sparkles, Loader2, RotateCcw,
  CheckCircle2, X, Phone, Info, ArrowRight,
  TrendingUp, Box
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Saban OS V8.3 - המערכת המאוחדת
 * מחברת את המחשבון הלוגיסטי לזרם הנתונים של המלאי והצ'אט
 */

// --- רכיב המחשבון הלוגיסטי (מוזרק לתוך הצ'אט) ---
const IntegratedProductCard = ({ product, onClose, onAdd }) => {
  const [inputs, setInputs] = useState({ length: "", height: "", waste: "5" });
  
  const calc = useMemo(() => {
    const l = parseFloat(inputs.length) || 0;
    const h = parseFloat(inputs.height) || 0;
    const wst = parseFloat(inputs.waste) || 5;
    const cov = parseFloat(product?.coverage) || 0.15;
    
    const totalArea = l * h * (1 + wst / 100);
    const units = Math.ceil(totalArea / cov);
    
    return { units, totalArea: totalArea.toFixed(2) };
  }, [inputs, product]);

  if (!product) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="bg-slate-900 border border-blue-500/30 rounded-[32px] overflow-hidden shadow-2xl w-full max-w-lg"
    >
      <div className="relative h-48 bg-slate-800 flex items-center justify-center overflow-hidden">
        <img src={product.image_url} className="w-full h-full object-cover opacity-60" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-white/70 hover:text-white backdrop-blur-md">
          <X size={20} />
        </button>
        <div className="absolute bottom-4 right-6 text-right">
          <h3 className="text-2xl font-black text-white italic leading-tight uppercase tracking-tighter">{product.product_name}</h3>
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">SKU: {product.sku} | {product.packaging || 'יחידות'}</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">אורך (מטר)</label>
            <input 
              type="number" 
              value={inputs.length} 
              onChange={e => setInputs({...inputs, length: e.target.value})}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-bold"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">גובה (מטר)</label>
            <input 
              type="number" 
              value={inputs.height} 
              onChange={e => setInputs({...inputs, height: e.target.value})}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-bold"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="text-right">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">כמות מומלצת</p>
            <p className="text-3xl font-black text-white italic">{calc.units} <span className="text-sm font-normal text-slate-500">יח'</span></p>
          </div>
          <div className="text-left text-[9px] text-slate-500 font-bold leading-tight">
            כיסוי: {product.coverage || 0.15} מ"ר<br/>
            פחת: {inputs.waste}%<br/>
            סה"כ: {calc.totalArea} מ"ר
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => onAdd(product, calc.units)}
            className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all"
          >
            <ShoppingCart size={20} /> הוסף להזמנה
          </button>
          <button className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-400 transition-all">
            <MapPin size={22} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- דף הצ'אט הראשי ---
export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: 'אהלן ראמי, המוח הלוגיסטי של ח. סבן מחובר למלאי. איזה מוצר נשלוף היום? 🦾', timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeProduct]);

  // פונקציית שליפה מהמלאי (Inventory Search)
  const fetchInventory = async (query) => {
    try {
      const res = await fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    // לוגיקת האזנה: מחפש מילות מפתח למלאי (למשל: "סיקה", "107", "דבק")
    const product = await fetchInventory(currentInput);

    setTimeout(() => {
      let botText = "הבנתי הבוס. אני מעבד את הנתונים...";
      
      if (product) {
        botText = `מצאתי את ${product.product_name} במלאי. הזרקתי לך את המחשבון כדי שנדייק את הכמות לביצוע. 🏗️`;
        setActiveProduct(product);
      } else if (currentInput.includes("אלי") || currentInput.includes("סיקה")) {
        botText = "לגבי פתרונות טכניים של סיקה, הכי נכון לדבר עם אלי. רוצה שאפתח לך צ'אט מולו? 🟢";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: botText, timestamp: new Date() }]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden" dir="rtl">
      
      {/* Main Chat View */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-2xl z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center font-black italic text-xl shadow-lg">S</div>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter uppercase">Saban OS <span className="text-blue-500">V8.3</span></h1>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Inventory Connection
              </div>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <div className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold border border-white/5 uppercase tracking-widest text-slate-400">
              User: Rami_Admin
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-32">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] md:max-w-[60%] p-5 rounded-[28px] shadow-2xl ${
                msg.role === 'user' 
                ? 'bg-slate-800 border border-white/5 text-slate-100 rounded-tr-none' 
                : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                <div className="flex items-center justify-between mt-3 opacity-40">
                  <span className="text-[9px] font-black uppercase">{msg.role}</span>
                  <span className="text-[9px]">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-500" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Processing DNA...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Action Overlay (מחשבון המוצר שמאזין לנתונים) */}
        <AnimatePresence>
          {activeProduct && (
            <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-md flex items-end justify-center p-4 pb-24">
              <IntegratedProductCard 
                product={activeProduct} 
                onClose={() => setActiveProduct(null)} 
                onAdd={(p, units) => {
                  setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: `מעולה, הוספתי ${units} יחידות של ${p.product_name} לסל. מה עוד נבצע? 🦾`, timestamp: new Date() }]);
                  setActiveProduct(null);
                }}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="חפש מוצר במלאי (למשל: סיקה 107)..."
                className="w-full bg-slate-900 border border-white/10 rounded-[24px] py-5 pr-6 pl-20 outline-none focus:border-blue-500/50 transition-all font-bold text-sm shadow-2xl"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="absolute left-3 w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 rounded-2xl flex items-center justify-center transition-all text-white shadow-lg shadow-blue-600/30"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
