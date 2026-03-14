import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, Calculator, MessageCircle, MapPin, 
  Package, User, ShieldCheck, ShoppingCart, 
  Search, Sparkles, Loader2, RotateCcw,
  CheckCircle2, X, Phone, Info
} from 'lucide-react';

/**
 * Saban OS V8.2 - Integrated Chat Interface
 * מחבר את המוח, המלאי, אלי והמחשבון לממשק אחד
 */
export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: 'אהלן ראמי, כיף שהגעת לח. סבן. המוח הלוגיסטי מוכן לביצוע. איך אפשר לעזור היום? 🦾', timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [activeAction, setActiveAction] = useState(null); // 'product' | 'eli' | null
  const [selectedProduct, setSelectedProduct] = useState(null);
  const scrollRef = useRef(null);

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeAction]);

  // לוגיקת זיהוי פקודות ומוצרים (Saban DNA Logic)
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    // סימולציית "חשיבה" של המוח
    setTimeout(() => {
      processAIResponse(currentInput);
    }, 600);
  };

  const processAIResponse = (text) => {
    let botResponse = { id: Date.now() + 1, role: 'bot', text: "", timestamp: new Date() };
    
    // 1. בדיקת זיהוי סיקה (אלי)
    if (text.includes("סיקה") || text.includes("Sika")) {
      botResponse.text = "זיהיתי שאתה מחפש פתרון של סיקה. בחמ''ל סבן אנחנו נותנים לך את המעטפת של אלי, המומחה הטכני שלנו. הנה הפרטים שלו:";
      setActiveAction('eli');
    } 
    // 2. בדיקת זיהוי מוצר ספציפי (סימולציית שליפה מהמלאי)
    else if (text.includes("107") || text.includes("בלוק")) {
      const isBlock = text.includes("בלוק");
      const productData = isBlock ? {
        name: "בלוק איטונג 10 ס''מ",
        sku: "YT-10-6025",
        coverage: 0.15,
        packaging: "משטח (1.5 טון)",
        image: "https://images.unsplash.com/photo-1600566753225-6b0bf9b29a9a?q=80&w=400"
      } : {
        name: "סיקה טופ סיל 107",
        sku: "SY-107",
        coverage: 0.25,
        packaging: "שק 25 ק''ג",
        image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=400"
      };
      
      botResponse.text = `מצאתי את ${productData.name} במלאי. הזרקתי לך את המחשבון הלוגיסטי כדי שנוכל לדייק את הכמות לביצוע:`;
      setSelectedProduct(productData);
      setActiveAction('product');
    }
    // 3. מענה כללי
    else {
      botResponse.text = "הבנתי, הבוס. אני בודק את זה מול המערכת. מה תרצה שנבצע לגבי זה? 🦾";
      setActiveAction(null);
    }

    setMessages(prev => [...prev, botResponse]);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden" dir="rtl">
      
      {/* Side Actions (Desktop Only) */}
      <aside className="hidden lg:flex w-20 flex-col items-center py-8 border-l border-white/5 bg-slate-900/50 gap-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Sparkles className="text-white" size={24} />
        </div>
        <button onClick={() => setActiveAction('eli')} className="p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-emerald-400">
          <User size={24} />
        </button>
        <button className="p-3 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-blue-400">
          <Package size={24} />
        </button>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-slate-900/30 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center font-black italic shadow-lg">S</div>
            <div>
              <h2 className="text-lg font-black tracking-tighter uppercase italic">Saban OS <span className="text-blue-500">V8.2</span></h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                מערכת מבצעית פעילה
              </div>
            </div>
          </div>
          <button onClick={() => window.open('/branches', '_blank')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
            <MapPin size={14} /> סניפים וניווט
          </button>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-3xl ${
                msg.role === 'user' 
                ? 'bg-slate-800 border border-white/5 text-slate-100 rounded-tr-none' 
                : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[10px] text-slate-500 mt-2 block opacity-50">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Action Overlays (The Magic Layer) */}
        <AnimatePresence>
          {activeAction && (
            <div className="absolute inset-0 z-50 flex items-end justify-center p-4 bg-slate-950/40 backdrop-blur-sm pointer-events-none">
              <div className="w-full max-w-2xl pointer-events-auto">
                {activeAction === 'eli' && <EliExpertCard onClose={() => setActiveAction(null)} />}
                {activeAction === 'product' && <ProductActionCard product={selectedProduct} onClose={() => setActiveAction(null)} />}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div className="p-6 bg-slate-900/50 border-t border-white/5">
          <div className="max-w-4xl mx-auto relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="הקלד הודעה לראמי... (נסה 'סיקה' או 'בלוק')"
              className="w-full bg-slate-800 border border-white/5 rounded-2xl py-5 pr-6 pl-16 outline-none focus:border-blue-500/50 transition-all font-bold text-sm shadow-2xl"
            />
            <button 
              onClick={handleSend}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center transition-all text-white shadow-lg shadow-blue-600/20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * כרטיס המומחה של אלי (Eli Expert Component)
 */
function EliExpertCard({ onClose }) {
  const whatsappEli = () => {
    const text = encodeURIComponent("היי אלי, אני לקוח של ח. סבן ואשמח לייעוץ טכני לגבי פרויקט.");
    window.open(`https://wa.me/972544527513?text=${text}`, '_blank');
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/20 rounded-[32px] p-6 shadow-2xl mb-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
      <button onClick={onClose} className="absolute top-4 left-4 text-slate-500 hover:text-white"><X size={18}/></button>
      
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <User size={32} className="text-slate-950" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white italic">אלי - מומחה טכני סיקה</h3>
          <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">אנציקלופדיה מהלכת למוצרי איטום</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-white/5 rounded-xl text-xs border border-white/5">🛠️ התאמת חומרים בשטח</div>
        <div className="p-3 bg-white/5 rounded-xl text-xs border border-white/5">🧪 ייעוץ למפרטי איטום</div>
      </div>

      <button onClick={whatsappEli} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl">
        <MessageCircle size={20} /> דבר עם אלי ב-WhatsApp
      </button>
    </div>
  );
}

/**
 * כרטיס מוצר משולב עם מחשבון (Product Action Component)
 */
function ProductActionCard({ product, onClose }) {
  const [inputs, setInputs] = useState({ length: "", height: "", waste: "5" });
  
  const calcUnits = useMemo(() => {
    const l = parseFloat(inputs.length) || 0;
    const h = parseFloat(inputs.height) || 0;
    const wst = parseFloat(inputs.waste) || 5;
    const cov = product?.coverage || 0.15;
    
    return Math.ceil((l * h * (1 + wst/100)) / cov);
  }, [inputs, product]);

  return (
    <div className="bg-slate-900 border border-blue-500/20 rounded-[32px] p-6 shadow-2xl mb-4 relative">
      <button onClick={onClose} className="absolute top-4 left-4 text-slate-500 hover:text-white"><X size={18}/></button>
      
      <div className="flex gap-4 mb-6">
        <img src={product.image} className="w-20 h-20 rounded-2xl object-cover border border-white/5" alt="" />
        <div>
          <h3 className="text-lg font-black text-white italic leading-tight">{product.name}</h3>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">מק"ט: {product.sku} | אריזה: {product.packaging}</p>
        </div>
      </div>

      <div className="bg-black/20 rounded-2xl p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input 
            type="number" 
            placeholder="אורך (מטר)" 
            value={inputs.length}
            onChange={e => setInputs({...inputs, length: e.target.value})}
            className="bg-slate-800 border border-white/5 rounded-xl p-3 text-xs outline-none focus:border-blue-500 text-white"
          />
          <input 
            type="number" 
            placeholder="גובה (מטר)" 
            value={inputs.height}
            onChange={e => setInputs({...inputs, height: e.target.value})}
            className="bg-slate-800 border border-white/5 rounded-xl p-3 text-xs outline-none focus:border-blue-500 text-white"
          />
        </div>
        
        <div className="bg-blue-600/10 p-3 rounded-xl border border-blue-500/20 text-center">
          <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">כמות מומלצת לביצוע</p>
          <p className="text-2xl font-black text-white italic">{calcUnits} יחידות</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all">
          <ShoppingCart size={18} /> הוסף להזמנה
        </button>
        <button onClick={() => window.open('/product/' + product.sku, '_blank')} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all">
          <Info size={20} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
}
