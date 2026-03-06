"use client";

import React, { useState, useEffect, useRef } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, push } from "firebase/database";
import { ChatShell } from "@/components/chat/chat-shell";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/Composer";
import { useToast } from "@/hooks/use-toast";
import { Phone, Video, Search, MoreVertical } from "lucide-react";

export default function WhatsAppClonePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const phone = "972508860896"; // המספר של הלקוח/שלך לניטור

  useEffect(() => {
    // האזנה לכל תעבורת הצינור של סבן
    const chatRef = ref(rtdb, `saban94`);
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // שאיבת הודעות נכנסות (מהווטסאפ) והודעות שנשלחו (מהממשק/Gemini)
        const incoming = data.incoming ? Object.entries(data.incoming).map(([id, m]: any) => ({ ...m, id, type: 'in' })) : [];
        const outgoing = data.send ? Object.entries(data.send).map(([id, m]: any) => ({ ...m, id, type: 'out' })) : [];
        
        // סינון לפי מספר הטלפון וסידור כרונולוגי
        const combined = [...incoming, ...outgoing]
          .filter(m => m.to === phone || m.from === phone || m.receiver === phone)
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        setMessages(combined.map(m => ({
          id: m.id,
          content: m.text || m.content,
          role: (m.type === 'in') ? 'user' : 'assistant', // 'user' זה הלקוח בוואטסאפ
          createdAt: new Date(m.timestamp)
        })));
        
        // גלילה אוטומטית למטה
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    });

    return () => unsubscribe();
  }, [phone]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      // הזרקה לצינור השליחה - JONI ימשוך את זה וישלח לווטסאפ
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: content,
        timestamp: Date.now(),
        from: "admin-panel"
      });
      
      // הפעלת המוח (Gemini) לסנכרון היסטוריה ב-Supabase
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          phone: phone,
          userId: 'admin'
        })
      });
    } catch (error: any) {
      toast({ title: "שגיאה בשליחה", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-e bg-white dark:bg-zinc-900 hidden md:flex flex-col">
        <header className="p-4 bg-[#f0f2f5] dark:bg-zinc-800 flex justify-between items-center">
          <div className="w-10 h-10 bg-slate-300 rounded-full"></div>
          <MoreVertical className="text-gray-500 cursor-pointer" size={20} />
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b bg-emerald-50 dark:bg-emerald-900/10 flex items-center gap-3 cursor-pointer">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">ח</div>
            <div>
              <div className="font-bold text-sm">ח. סבן - {phone}</div>
              <div className="text-xs text-emerald-600">בסנכרון מלא...</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative bg-[#e5ddd5] dark:bg-zinc-950">
        <header className="p-3 bg-[#f0f2f5] dark:bg-zinc-900 border-b flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">S</div>
             <div className="font-bold text-sm">ח. סבן (ווטסאפ חי)</div>
          </div>
          <div className="flex gap-5 text-gray-500 pr-2">
            <Video size={20} className="cursor-pointer" />
            <Phone size={20} className="cursor-pointer" />
            <Search size={20} className="cursor-pointer" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <ChatShell>
            <MessageList messages={messages} />
            <div ref={scrollRef} />
          </ChatShell>
        </div>

        <footer className="p-3 bg-[#f0f2f5] dark:bg-zinc-900 flex items-center gap-2">
          <Composer 
            onSend={handleSendMessage} 
            placeholder="שלח הודעה לווטסאפ..." 
            disabled={isLoading} 
          />
        </footer>
      </main>
    </div>
  );
}
