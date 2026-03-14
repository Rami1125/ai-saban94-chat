"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { 
  Phone, Video, Search, Settings, BadgeCheck, Ruler, Zap, 
  Package, PlayCircle, Maximize2, X, Send, User, Building2 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- רכיבי עזר ויזואליים ---

const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
};

const ProductMediaCard = ({ product }: { product: any }) => {
  const [showVideo, setShowVideo] = useState(false);
  if (!product) return null;

  return (
    <div className="my-4 bg-white rounded-[24px] overflow-hidden shadow-2xl border border-slate-100 max-w-[300px] animate-in zoom-in-95 duration-300">
      <div className="relative group">
        <img 
          src={product.image_url || 'https://via.placeholder.com/300x200?text=Saban+Logistics'} 
          className="w-full h-44 object-cover transition-transform group-hover:scale-105"
          alt={product.product_name}
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white"><Maximize2 size={20} /></button>
        </div>
      </div>
      <div className="p-5 text-right" dir="rtl">
        <h4 className="font-black text-slate-900 text-lg leading-tight mb-1">{product.product_name}</h4>
        <p className="text-xs text-slate-500 mb-4">{product.description || 'מוצר איכותי מבית ח. סבן'}</p>
        <div className="grid grid-cols-2 gap-2">
          {product.video_url && (
            <button onClick={() => setShowVideo(true)} className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black">
              <PlayCircle size={14} /> וידאו
            </button>
          )}
          <button className="flex items-center justify-center gap-2 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">
            <Package size={14} /> פרטים
          </button>
        </div>
      </div>

      {showVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <button onClick={() => setShowVideo(false)} className="absolute top-8 right-8 text-white"><X size={32} /></button>
          <iframe src={product.video_url.replace("watch?v=", "embed/")} className="w-full max-w-4xl aspect-video rounded-3xl" allowFullScreen />
        </div>
      )}
    </div>
  );
};

// --- הקומפוננטה הראשית של התוכן ---

function WhatsAppCloneContent() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const phone = "972508860896";

  useEffect(() => {
    const savedName = localStorage.getItem('saban_user_name');
    if (savedName) setUserName(savedName);

    const chatRef = ref(rtdb, `saban94`);
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const incoming = data.inbound ? Object.entries(data.inbound).map(([id, m]: any) => ({ ...m, id, role: 'user' })) : [];
        const outgoing = data.send ? Object.entries(data.send).map(([id, m]: any) => ({ ...m, id, role: 'assistant' })) : [];
        const combined = [...incoming, ...outgoing]
          .filter(m => m.to === phone || m.from === phone || m.receiver === phone)
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(combined);
      }
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const content = input;
    setInput('');
    setIsLoading(true);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content }], phone, userName })
      });
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userName) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <Card className="w-full max-w-md p-8 bg-white rounded-[2.5rem] shadow-2xl text-center border-none">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><Building2 className="text-white" size={32} /></div>
          <h2 className="text-2xl font-black mb-6 italic">ח. סבן לוגיסטיקה</h2>
          <Input 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="איך קוראים לך?" 
            className="h-14 rounded-2xl bg-slate-50 text-center font-bold mb-4" 
          />
          <button 
            onClick={() => { localStorage.setItem('saban_user_name', input); setUserName(input); setInput(''); }}
            className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black"
          >
            כניסה 🦾
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden" dir="rtl">
      <aside className="w-[400px] border-l bg-white hidden lg:flex flex-col shadow-xl">
        <header className="p-8 border-b flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100"><Zap className="text-white" size={24} fill="white" /></div>
          <div><h1 className="font-black text-xl italic">SABAN OS</h1><p className="text-[10px] font-black text-blue-600 uppercase">V4.0 AI</p></div>
        </header>
        <div className="p-6 space-y-4">
          <button className="w-full p-6 bg-slate-900 text-white rounded-[28px] font-black flex items-center justify-between group">
            <div className="flex items-center gap-3"><Ruler size={22} /><span>חישוב מ"ר</span></div>
            <BadgeCheck size={18} className="text-blue-400" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex justify-between items-center px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><User size={18} /></div>
            <div><div className="font-black text-slate-900 leading-none">מרכז ייעוץ</div><div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Online</div></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none font-bold' : 'bg-slate-50 text-slate-800 rounded-bl-none font-medium'}`}>
                {m.role === 'assistant' && i === messages.length - 1 ? <TypewriterEffect text={m.text || m.content} /> : m.text || m.content}
              </div>
              {m.product && <ProductMediaCard product={m.product} />}
            </div>
          ))}
          {isLoading && <div className="text-blue-600 text-xs animate-pulse">סורק נתונים...</div>}
          <div ref={scrollRef} />
        </div>

        <footer className="p-6 absolute bottom-0 w-full z-20">
          <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-2xl border-2 border-white p-2 rounded-[32px] shadow-2xl flex items-center gap-2">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="מה נבצע היום?"
              className="flex-1 h-14 border-none bg-transparent font-bold text-lg focus-visible:ring-0"
            />
            <button onClick={handleSendMessage} className="bg-blue-600 p-3.5 rounded-2xl text-white"><Send size={20} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}

// --- 3. הייצוא הראשי והמתוקן ל-Vercel ---

const DynamicChat = dynamic(() => Promise.resolve(WhatsAppCloneContent), {
  ssr: false,
});

export default function Chat7Page() {
  return <DynamicChat />;
}
