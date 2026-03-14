"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Send, Zap, Building2, Package, PlayCircle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- רכיב כרטיס מוצר מחוסן ---
const ProductMediaCard = ({ product }: { product: any }) => {
  const [showVideo, setShowVideo] = useState(false);
  // שימוש ב-Placeholder יציב שלא קורס
  const imageUrl = product?.image_url || "https://placehold.co/400x300/f1f5f9/1d4ed8?text=Saban+Logistics";

  return (
    <div className="my-4 bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 max-w-[300px] animate-in zoom-in-95">
      <img src={imageUrl} className="w-full h-40 object-cover" alt="product" />
      <div className="p-4 text-right" dir="rtl">
        <h4 className="font-black text-slate-900">{product.product_name}</h4>
        <div className="flex gap-2 mt-4">
          {product.video_url && (
            <button onClick={() => setShowVideo(true)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black">וידאו הדרכה</button>
          )}
          <button className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-black">הזמן עכשיו</button>
        </div>
      </div>
      {showVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setShowVideo(false)} className="absolute top-8 right-8 text-white"><X size={32} /></button>
          <iframe src={product.video_url.replace("watch?v=", "embed/")} className="w-full max-w-4xl aspect-video rounded-2xl" allowFullScreen />
        </div>
      )}
    </div>
  );
};

function Chat7Content() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("saban_user_name");
    if (savedName) setUserName(savedName);

    const chatRef = ref(rtdb, "saban94");
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const incoming = data.inbound ? Object.entries(data.inbound).map(([id, m]: any) => ({ ...m, role: 'user' })) : [];
        const outgoing = data.send ? Object.entries(data.send).map(([id, m]: any) => ({ ...m, role: 'assistant' })) : [];
        setMessages([...incoming, ...outgoing].sort((a, b) => a.timestamp - b.timestamp));
      }
    });
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const content = input; setInput(""); setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content }], phone: "972508860896", userName })
      });
      const data = await res.json();
      if (data.answer) setMessages(prev => [...prev, { role: 'assistant', content: data.answer, product: data.product }]);
    } finally { setIsLoading(false); }
  };

  if (!userName) return (
    <div className="h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <Card className="p-8 w-full max-w-md text-center rounded-[2rem] shadow-2xl">
        <h2 className="text-2xl font-black mb-4 italic">ח. סבן לוגיסטיקה</h2>
        <Input onChange={(e) => setInput(e.target.value)} placeholder="איך קוראים לך?" className="mb-4 text-center h-14 rounded-2xl" />
        <button onClick={() => { localStorage.setItem("saban_user_name", input); setUserName(input); setInput(""); }} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black">כניסה 🦾</button>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen bg-white" dir="rtl">
      <main className="flex-1 flex flex-col relative bg-slate-50/50">
        <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
          <span className="font-black italic text-blue-600">SABAN OS V4.5</span>
          <span className="text-xs font-bold text-slate-400">{userName} מחובר</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                {m.content || m.text}
              </div>
              {m.product && <ProductMediaCard product={m.product} />}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <footer className="p-4 absolute bottom-0 w-full">
          <div className="max-w-4xl mx-auto flex gap-2 bg-white p-2 rounded-2xl shadow-xl border">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="מה נבצע היום?" className="flex-1 border-none focus-visible:ring-0 font-bold" />
            <button onClick={sendMessage} className="bg-blue-600 p-3 rounded-xl text-white"><Send size={20} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}

const DynamicChat = dynamic(() => Promise.resolve(Chat7Content), { ssr: false });
export default function Chat7Page() { return <DynamicChat />; }
