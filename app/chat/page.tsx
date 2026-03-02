"use client";
import React, { useState } from "react";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/composer";
import { Sparkles, MessageSquareDashed } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async (content: string) => {
    if (!content.trim() || loading) return;
    
    const userMsg = { 
      id: Date.now().toString(), 
      role: 'user', 
      content 
    };
    
    setMessages(p => [...p, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      
      setMessages(p => [...p, { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: data.text, 
        products: data.products,
        uiBlueprint: data.uiBlueprint // הזרקת העיצוב החדש
      }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: "שגיאת תקשורת עם המחסן." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="relative h-screen w-full bg-[#fbfbfb] overflow-hidden" dir="rtl">
      {/* רקע נושם גלובלי */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 h-full flex flex-col pt-20">
        {/* כותרת יוקרתית */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-30 backdrop-blur-md bg-white/50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0B2C63] rounded-xl flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="font-black text-[#0B2C63] text-lg italic tracking-tighter">SABAN AI</span>
          </div>
          <button onClick={() => setMessages([])} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <MessageSquareDashed size={20} />
          </button>
        </div>

        {/* רכיב רשימת ההודעות המונפש */}
        <MessageList messages={messages} isStreaming={loading} />

        {/* אזור הכתיבה */}
        <div className="px-6 pb-10 bg-gradient-to-t from-[#fbfbfb] to-transparent pt-10">
          <div className="max-w-4xl mx-auto">
            <Composer onSend={send} isStreaming={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
