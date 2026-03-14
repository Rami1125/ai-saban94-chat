"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, Calculator, ShoppingCart, 
  Package, X, Share2, Trash2, Loader2,
  CheckCircle2, MapPin, Info, ChevronRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Saban OS V8.9
 * מחובר למוח בנתיב: /api/ai/consult
 * כולל ניהול סל, מחשבון לוגיסטי והזרקת Context מהמלאי
 */

// --- Product Calculator Component ---
const ProductActionCard = ({ product, onClose, onAdd }) => {
  const [inputs, setInputs] = useState({ length: "", height: "", waste: "5" });
  
  const calculation = useMemo(() => {
    const l = parseFloat(inputs.length) || 0;
    const h = parseFloat(inputs.height) || 0;
    const wst = parseFloat(inputs.waste) || 5;
    const cov = parseFloat(product?.coverage) || 1.0;
    
    const area = l * h * (1 + wst / 100);
    const units = Math.ceil(area / cov);
    
    return { units, area: area.toFixed(2) };
  }, [inputs, product]);

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
      className="bg-slate-900 border border-blue-500/30 rounded-[32px] overflow-hidden shadow-2xl w-full max-w-lg pointer-events-auto"
    >
      <div className="relative h-44 bg-slate-800 flex items-center justify-center">
        {product.image_url ? (
          <img src={product.image_url} className="w-full h-full object-cover opacity-50" alt={product.product_name} />
        ) : (
          <Package size={48} className="text-slate-700 opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all">
          <X size={20} />
        </button>
        <div className="absolute bottom-4 right-6 text-right">
          <h3 className="text-xl font-black text-white italic leading-tight uppercase tracking-tighter">{product.product_name}</h3>
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">מק"ט: {product.sku} | {product.packaging || 'יחידות'}</p>
        </div>
      </div>

      <div className="p-6 space-y-5 text-right">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">אורך (מ')</label>
            <input 
              type="number" value={inputs.length} onChange={e => setInputs({...inputs, length: e.target.value})}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-bold text-right text-lg"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">גובה (מ')</label>
            <input 
              type="number" value={inputs.height} onChange={e => setInputs({...inputs, height: e.target.value})}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-bold text-right text-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="text-right">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">כמות מומלצת</p>
            <p className="text-3xl font-black text-white italic">{calculation.units} <span className="text-sm font-normal text-slate-500">יח'</span></p>
          </div>
          <div className="text-left text-[9px] text-slate-500 font-bold uppercase leading-tight tracking-tighter">
            שטח: {calculation.area} מ"ר<br/>כיסוי: {product.coverage || 1.0} מ"ר
          </div>
        </div>

        <button 
          onClick={() => onAdd(product, calculation.units)}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <ShoppingCart size={22} /> הוסף להזמנה
        </button>
      </div>
    </motion.div>
  );
};

// --- Main Chat Component ---
export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: 'אהלן ראמי, המוח הלוגיסטי מחובר לביצוע בנתיב המרכזי. מה נבצע היום? 🦾', timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeProduct, loading]);

  // פונקציית חיפוש מלאי (Inventory API)
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

    try {
      // 1. ניסיון לזהות מוצר במלאי לפני הפנייה ל-AI
      const productFound = await fetchInventory(currentInput);

      // 2. פנייה למוח בנתיב המבוקש /api/ai/consult
      const response = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: currentInput,
          context: productFound ? { type: 'inventory', data: productFound } : null,
          history: messages.slice(-5).map(m => ({ role: m.role, content: m.text }))
        })
      });

      if (!response.ok) throw new Error("Brain disconnection");

      const result = await response.json();
      const botAnswer = result.answer || result.text || result.content || "קיבלתי, בודק איך להתקדם... 🦾";

      if (productFound) {
        setActiveProduct(productFound);
      }

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, role: 'bot', text: botAnswer, timestamp: new Date() 
      }]);

    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { 
        id: Date.now(), role: 'bot', text: "יש תקלה בתקשורת למוח הלוגיסטי. בוא נבצע ידנית. 🛠️", timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, units) => {
    setCart(prev => [...prev, { ...product, units, orderId: Date.now() }]);
    setActiveProduct(null);
    setMessages(prev => [...prev, { 
      id: Date.now(), role: 'bot', text: `מעולה. הוספתי ${units} יח' של ${product.product_name} לסל. מה עוד נבצע? 🦾`, timestamp: new Date() 
    }]);
  };

  const shareOrder = () => {
    const summary = cart.map(i => `📦 ${i.product_name} | כמות: ${i.units}`).join('\n');
    const text = encodeURIComponent(`🏗️ הזמנה חדשה לביצוע מ-Saban OS:\n\n${summary}\n\nראמי, הכל מוכן לביצוע. 🦾`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden" dir="rtl">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-20 flex-col items-center py-8 border-l border-white/5 bg-slate-900/50 gap-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 font-black italic">S</div>
        <button className="p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-emerald-400"><User size={24} /></button>
        <button onClick={() => setShowCart(true)} className="p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-blue-400 relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && <span className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full" />}
        </button>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-blue-600/10">S</div>
            <div>
              <h1 className="text-xl font-black italic leading-tight uppercase tracking-tighter">Saban OS <span className="text-blue-500">V8.9</span></h1>
              <div className="flex items-center gap-2 text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Main Brain Connected
              </div>
            </div>
          </div>
          <button onClick={() => setShowCart(!showCart)} className="lg:hidden relative p-3 bg-white/5 rounded-2xl border border-white/5">
            <ShoppingCart size={22} className={cart.length > 0 ? "text-blue-500" : "text-slate-400"} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] md:max-w-[65%] p-5 rounded-[28px] shadow-2xl ${
                msg.role === 'user' 
                ? 'bg-slate-800 border border-white/5 text-slate-100 rounded-tr-none text-right' 
                : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none text-right'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[9px] font-bold text-slate-600 mt-2 block uppercase tracking-widest opacity-40">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.role}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-500" size={16}/>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic tracking-tighter">Querying API...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Action Layer (Calculator) */}
        <AnimatePresence>
          {activeProduct && (
            <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-md flex items-end justify-center p-4 pb-24 pointer-events-none">
              <ProductActionCard 
                product={activeProduct} onClose={() => setActiveProduct(null)} onAdd={addToCart} 
              />
            </div>
          )}
        </AnimatePresence>

        {/* Cart Sidebar Overlay */}
        <AnimatePresence>
          {showCart && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowCart(false)} className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                className="absolute inset-y-0 right-0 w-full md:w-96 bg-slate-900 border-r border-white/5 shadow-2xl z-50 flex flex-col p-6"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black italic uppercase text-white tracking-tighter">הסל של ראמי</h2>
                  <button onClick={() => setShowCart(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide text-right">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20 italic">
                      <Package size={48} className="mb-4" />
                      <p className="font-black uppercase text-xs tracking-widest">אין פריטים בסל</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.orderId} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5 hover:border-blue-500/30 transition-all">
                        <button onClick={() => setCart(cart.filter(i => i.orderId !== item.orderId))} className="text-slate-600 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">{item.product_name}</p>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{item.units} יחידות</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {cart.length > 0 && (
                  <button 
                    onClick={shareOrder}
                    className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 mt-4 shadow-lg transition-all"
                  >
                    <Share2 size={20}/> שתף הזמנה לביצוע
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Input Composer Section */}
        <div className="p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-[24px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative flex items-center">
              <input 
                type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                placeholder="כתוב פקודה למוח הלוגיסטי... (למשל: סיקה 107)" 
                className="w-full bg-slate-900 border border-white/10 rounded-[24px] py-5 pr-6 pl-20 outline-none focus:border-blue-500/50 font-bold text-sm shadow-2xl transition-all text-right" 
              />
              <button 
                onClick={handleSend} disabled={loading} 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-bold text-lg"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">גובה (מטר)</label>
            <input 
              type="number" 
              value={inputs.height} 
              onChange={e => setInputs({...inputs, height: e.target.value})}
              className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-bold text-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="text-right">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">כמות מומלצת</p>
            <p className="text-3xl font-black text-white italic">{calc.units} <span className="text-sm font-normal text-slate-500">יח'</span></p>
          </div>
          <div className="text-left text-[9px] text-slate-500 font-bold leading-tight uppercase tracking-tighter">
            כיסוי: {product.coverage || 0.15} מ"ר<br/>
            פחת: {inputs.waste}%<br/>
            סה"כ: {calc.totalArea} מ"ר
          </div>
        </div>

        <button 
          onClick={() => onAdd(product, calc.units)}
          className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all"
        >
          <ShoppingCart size={22} /> הוסף להזמנה
        </button>
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
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeProduct]);

  // פונקציית שליפה מהמלאי (Inventory Search)
  const fetchInventory = async (query) => {
    // בסימולציה כאן, אנחנו בודקים את לוח הגבס הירוק כדוגמה
    if (query.includes("גבס") || query.includes("ירוק")) {
      return {
        product_name: "לוח גבס ירוק 200 ע 12.50",
        sku: "GP-GRE-200",
        coverage: 3.0, // לוח אחד = 3 מ"ר
        packaging: "לוח (3 מ''ר)",
        image_url: "https://images.unsplash.com/photo-1589939705384-5185138a0470?q=80&w=400"
      };
    }
    
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

    // 1. הוספת הודעת המשתמש למסך
    const userMsg = { id: Date.now(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      // 2. שליפה מהירה מהמלאי (כדי שהמוח ידע על מה מדובר)
      const productFound = await fetchInventory(currentInput);

      // 3. פנייה למוח בנתיב app/api/ai/consult
      const response = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: currentInput,
          context: productFound ? { type: 'inventory', data: productFound } : null,
          history: messages.slice(-5) // שולח רק את 5 ההודעות האחרונות לשמירה על מהירות
        })
      });

      const result = await response.json();

      // 4. אם המוח מצא מוצר, נפעיל את המחשבון הלוגיסטי
      if (productFound) {
        setActiveProduct(productFound);
      }

      // 5. הצגת תשובת המוח (AI) בצ'אט
      const botMsg = { 
        id: Date.now() + 1, 
        role: 'bot', 
        text: result.text || result.answer || "קיבלתי, בודק איך להתקדם...", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Brain Connection Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'bot', 
        text: "משהו השתבש בחיבור למוח, אני זמין כאן לביצוע ידני. 🛠️", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, units) => {
    const newItem = { ...product, units, orderId: Date.now() };
    setCart(prev => [...prev, newItem]);
    setActiveProduct(null);
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      role: 'bot', 
      text: `מעולה, הוספתי ${units} יחידות של ${product.product_name} לסל. מה עוד נבצע? 🦾`, 
      timestamp: new Date() 
    }]);
  };

  const shareToWhatsApp = () => {
    const summary = cart.map(item => `📦 ${item.product_name} | כמות: ${item.units}`).join('\n');
    const text = encodeURIComponent(`🏗️ ח. סבן - סיכום הזמנה לביצוע:\n\n${summary}\n\nראמי, הכל מוכן לביצוע. 🦾`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden" dir="rtl">
      
      {/* Main Interface */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-2xl z-30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center font-black italic text-xl shadow-lg shadow-blue-600/10">S</div>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Saban OS <span className="text-blue-500">V8.4</span></h1>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Logistics & Cart Engine</span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCart(!showCart)}
            className="relative p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
          >
            <ShoppingCart size={22} className={cart.length > 0 ? "text-blue-500" : "text-slate-400"} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                {cart.length}
              </span>
            )}
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-32">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] md:max-w-[65%] p-5 rounded-[28px] shadow-2xl ${
                msg.role === 'user' 
                ? 'bg-slate-800 border border-white/5 text-slate-100 rounded-tr-none' 
                : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[9px] font-bold text-slate-500 mt-2 block opacity-40 uppercase tracking-widest">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.role}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-500" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Sourcing Inventory...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Cart Sidebar / Overlay */}
        <AnimatePresence>
          {showCart && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute inset-y-0 right-0 w-full md:w-96 bg-slate-900 border-r border-white/5 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-8 flex items-center justify-between border-b border-white/5">
                <h2 className="text-xl font-black italic uppercase text-white">סיכום הזמנה</h2>
                <button onClick={() => setShowCart(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-20">
                    <Package size={64} />
                    <p className="font-black uppercase text-xs mt-4 tracking-widest">הסל ריק כרגע</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.orderId} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                      <div>
                        <p className="text-sm font-black text-white">{item.product_name}</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{item.units} יחידות</p>
                      </div>
                      <button 
                        onClick={() => setCart(cart.filter(i => i.orderId !== item.orderId))}
                        className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-slate-800/50 border-t border-white/5 space-y-3">
                  <button 
                    onClick={shareToWhatsApp}
                    className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg"
                  >
                    <Share2 size={20} /> שתף הזמנה לביצוע
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Overlay */}
        <AnimatePresence>
          {activeProduct && (
            <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-md flex items-end justify-center p-4 pb-24">
              <IntegratedProductCard 
                product={activeProduct} 
                onClose={() => setActiveProduct(null)} 
                onAdd={addToCart}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-[24px] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="חפש מוצר... (למשל: לוח גבס ירוק)"
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
