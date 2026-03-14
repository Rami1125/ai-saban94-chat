"use client";
import React, { useState, useEffect, useRef } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { ChatShell } from "@/components/chat/chat-shell";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/Composer";
import { ActionOverlays } from "@/components/chat/ActionOverlays";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, Video, Search, Settings, BadgeCheck, Ruler, Zap, 
  Package, PlayCircle, Maximize2, X 
} from "lucide-react";

// --- רכיב כרטיס מוצר ויזואלי ---
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
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
           <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white"><Maximize2 size={20} /></button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-black text-slate-900 text-lg leading-tight">{product.product_name}</h4>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase italic">In Stock</span>
        </div>
        
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 font-medium">{product.description || 'מוצר איכותי מבית ח. סבן'}</p>
        
        <div className="grid grid-cols-2 gap-2">
          {product.video_url && (
            <button 
              onClick={() => setShowVideo(true)}
              className="flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
            >
              <PlayCircle size={14} /> סרטון הדרכה
            </button>
          )}
          <button className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-200">
            <Package size={14} /> פרטים נוספים
          </button>
        </div>
      </div>

      {/* Video Overlay Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <button onClick={() => setShowVideo(false)} className="absolute top-8 right-8 text-white hover:rotate-90 transition-transform"><X size={32} /></button>
          <iframe 
            src={product.video_url.replace("watch?v=", "embed/")} 
            className="w-full max-w-4xl aspect-video rounded-3xl shadow-2xl border-4 border-white/10"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
};

function WhatsAppCloneContent() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const phone = "972508860896";

  useEffect(() => {
    const chatRef = ref(rtdb, `saban94`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const incoming = data.inbound ? Object.entries(data.inbound).map(([id, m]: any) => ({ ...m, id, role: 'user' })) : [];
        const outgoing = data.send ? Object.entries(data.send).map(([id, m]: any) => ({ ...m, id, role: 'assistant' })) : [];
        
        const combined = [...incoming, ...outgoing]
          .filter(m => m.to === phone || m.from === phone || m.receiver === phone)
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        setMessages(combined.map(m => ({
          id: m.id,
          content: m.text || m.content,
          role: m.role,
          product: m.product || null, 
          timestamp: m.timestamp || Date.now()
        })));
      }
    });
    return () => unsubscribe();
  }, [phone]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content }], 
          phone,
          userName: "לקוח סבן" 
        })
      });
      if (!res.ok) throw new Error("Failed to send message");
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-sans selection:bg-blue-100" dir="rtl">
      {/* Sidebar - SabanOS Logic */}
      <aside className="w-[420px] border-l bg-white hidden lg:flex flex-col shadow-xl z-20">
        <header className="p-8 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-blue-200 animate-pulse">
              <Zap size={26} fill="white" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter text-slate-900 italic">SABAN OS</h1>
              <p className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">V4.0 Logistics AI</p>
            </div>
          </div>
          <Settings className="text-slate-300 hover:text-slate-900 transition-colors cursor-pointer" size={22} />
        </header>

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Quick Action Button */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">כלים לוגיסטיים</label>
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-action-overlay', { detail: { type: 'calculator' } }))}
              className="w-full p-6 bg-slate-900 text-white rounded-[32px] font-black flex items-center justify-between group hover:bg-blue-600 transition-all shadow-2xl active:scale-95">
              <div className="flex items-center gap-4">
                <Ruler size={24} className="group-hover:rotate-12 transition-transform" />
                <span className="text-lg">חישוב מ"ר וגבס</span>
              </div>
              <BadgeCheck size={20} className="text-blue-400" />
            </button>
          </div>

          {/* User Card */}
          <div className="p-6 bg-slate-50 rounded-[35px] border-2 border-white shadow-inner flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-[22px] flex items-center justify-center text-white font-black text-3xl shadow-lg italic">S</div>
            <div>
              <span className="font-black text-slate-900 text-xl leading-none">ח. סבן מרכזי</span>
              <div className="flex items-center gap-1.5 mt-2 text-emerald-600 font-bold text-xs">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                 <span>מחובר - חמ"ל פעיל</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col relative bg-white">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-50 flex justify-between items-center px-10 z-10 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200"><MapPin className="text-blue-600" size={20} /></div>
            <div>
              <h2 className="font-black text-xl text-slate-900 tracking-tight">מרכז הזמנות וייעוץ</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Inventory Link</p>
            </div>
          </div>
          <div className="flex gap-10 text-slate-400">
             <Search className="cursor-pointer hover:text-blue-600 transition-all hover:scale-110" size={24} />
             <Phone className="cursor-pointer hover:text-emerald-500 transition-all hover:scale-110" size={24} />
          </div>
        </header>

        {/* Messages List with Product Injection */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-32">
           {messages.map((m, i) => (
             <div key={m.id || i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-5 rounded-[2.5rem] text-base leading-relaxed shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none font-bold' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-none font-medium'
                }`}>
                  {m.content}
                </div>
                {/* הזרקת כרטיס מוצר אם קיים נתון מוצר בהודעה */}
                {m.product && <ProductMediaCard product={m.product} />}
             </div>
           ))}
           {isLoading && <div className="text-blue-600 font-black text-xs animate-pulse flex items-center gap-2"><Zap size={14} /> המוח מעבד נתונים...</div>}
        </div>

        {/* Composer - Fixed Bottom */}
        <footer className="p-8 bg-transparent absolute bottom-0 w-full z-20">
          <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-3xl border-2 border-white p-3 rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.12)]">
            <Composer onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </footer>
      </main>

      <ActionOverlays />
    </div>
  );
}
