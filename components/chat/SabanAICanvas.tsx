"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Send, ShoppingCart, User, MapPin, Truck, 
  Calendar, Phone, Menu, Sparkles, CheckCircle2,
  ChevronLeft, Info, Play, Loader2, Plus
} from "lucide-react";
import ProductCard from "@/components/chat/ProductCard";
import { toast } from "sonner";

export default function SabanAICanvas({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [orderStep, setOrderStep] = useState<'consult' | 'logistics'>('consult');
  
  // לוגיקת פרטי לקוח
  const [customerData, setCustomerData] = useState({
    name: "", address: "", phone: "", contact: "",
    deliveryDate: "", deliveryTime: "", transportType: "manual" // manual | crane
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // הודעת פתיחה אנושית ומזמינה
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      simulateAIResponse("שלום! אני כאן לעזור לך לבחור את החומרים הנכונים לפרויקט שלך. מה אנחנו בונים היום? (גבס, איטום, צבע?) ✨");
    }
  }, [isOpen]);

  const simulateAIResponse = (text: string, product?: any) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: text, product }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");

    // קריאה ל"מוח" (API Route) שעדכנו קודם
    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, { role: "user", content: userMsg }], phone: customerData.phone }),
      });
      const data = await res.json();
      simulateAIResponse(data.text, data.product);
    } catch (e) {
      simulateAIResponse("משהו השתבש בחיבור, אבל אני כאן. ספר לי שוב מה חסר לך?");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[999] bg-white flex flex-col md:flex-row overflow-hidden"
        >
          {/* Sidebar - פרטי לקוח ולוגיסטיקה (תפריט המבורגר בנייד) */}
          <div className="w-full md:w-[350px] bg-slate-50 border-l border-slate-200 p-6 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <Menu className="text-blue-600" />
              <h2 className="font-black text-slate-800 tracking-tighter italic">H. SABAN LOGISTICS</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
            </div>

            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <User size={12}/> פרטי הזמנה
                </h3>
                <InputGroup label="שם לקוח" value={customerData.name} onChange={(v) => setCustomerData({...customerData, name: v})} />
                <InputGroup label="נייד" value={customerData.phone} onChange={(v) => setCustomerData({...customerData, phone: v})} />
                <InputGroup label="כתובת אספקה" value={customerData.address} onChange={(v) => setCustomerData({...customerData, address: v})} icon={<MapPin size={14}/>} />
              </section>

              <section className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Truck size={12}/> שיטת הובלה
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <TransportBtn active={customerData.transportType === 'manual'} label="ידנית" onClick={() => setCustomerData({...customerData, transportType: 'manual'})} />
                  <TransportBtn active={customerData.transportType === 'crane'} label="מנוף" onClick={() => setCustomerData({...customerData, transportType: 'crane'})} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InputGroup label="תאריך" type="date" value={customerData.deliveryDate} onChange={(v) => setCustomerData({...customerData, deliveryDate: v})} />
                  <InputGroup label="שעה" type="time" value={customerData.deliveryTime} onChange={(v) => setCustomerData({...customerData, deliveryTime: v})} />
                </div>
              </section>
            </div>
          </div>

          {/* Main Canvas Area - הצאט הויזואלי */}
          <div className="flex-1 flex flex-col bg-slate-100/50 relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8" ref={scrollRef}>
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-2xl w-full space-y-4 ${m.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <div className={`p-6 rounded-[32px] text-lg font-medium shadow-sm leading-relaxed ${
                      m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'
                    }`}>
                      {m.content}
                    </div>

                    {/* כרטיס מוצר ויזואלי שנפרס בתוך הקנבס */}
                    {m.product && (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
                         <ProductCard product={m.product} onAddToCart={() => toast.success("המוצר נוסף לסל הלוגיסטי")} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-2 p-4 bg-white/50 w-24 rounded-full justify-center shadow-inner italic text-xs text-slate-400">
                   כותב... <Loader2 size={14} className="animate-spin"/>
                </div>
              )}
            </div>

            {/* Input Area */}
            <footer className="p-8 bg-gradient-to-t from-white via-white to-transparent">
              <div className="max-w-3xl mx-auto relative group">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="כתוב כאן... (לדוגמא: אני צריך דבק קרמיקה חזק מאוד)"
                  className="w-full bg-white border-2 border-slate-100 rounded-[32px] py-6 pr-8 pl-20 shadow-2xl focus:border-blue-500 outline-none text-lg transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-4 bg-blue-600 text-white rounded-[24px] hover:bg-blue-700 transition-all active:scale-90"
                >
                  <Send size={24} />
                </button>
              </div>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// קומפוננטות עזר לעיצוב הבהיר
const InputGroup = ({ label, value, onChange, type = "text", icon }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 mr-2 uppercase">{label}</label>
    <div className="relative">
      <input 
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>}
    </div>
  </div>
);

const TransportBtn = ({ active, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-xl text-xs font-bold transition-all border ${
      active ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-500 border-slate-200'
    }`}
  >
    {label}
  </button>
);
