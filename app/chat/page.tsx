"use client";

import React, { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { ChatShell } from "@/components/chat/chat-shell";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/Composer";
import { useToast } from "@/hooks/use-toast";
import { Phone, Video, Search, MoreVertical } from "lucide-react";

export default function WhatsAppClonePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // מספר הטלפון לניטור - ח. סבן
  const phone = "972508860896"; 

  // סנכרון Realtime מול Firebase
  useEffect(() => {
    const chatRef = ref(rtdb, `saban94`);
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const incoming = data.incoming ? Object.entries(data.incoming).map(([id, m]: any) => ({ ...m, id, role: 'user' })) : [];
        const outgoing = data.send ? Object.entries(data.send).map(([id, m]: any) => ({ ...m, id, role: 'assistant' })) : [];
        
        const combined = [...incoming, ...outgoing]
          .filter(m => m.to === phone || m.from === phone || m.receiver === phone)
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        setMessages(combined.map(m => ({
          id: m.id,
          content: m.text || m.content,
          role: m.role,
          product: m.product || null, // וידוא שמוצר מה-DB של Firebase נטען
          timestamp: m.timestamp || Date.now()
        })));
      }
    });

    return () => unsubscribe();
  }, [phone]);

  // פונקציית שליחה שמעדכנת את הכרטיס המעוצב בממשק
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // עדכון מקומי של הודעת המשתמש
    const userMsg = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          phone: phone,
          userId: 'admin'
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // הזרקת התשובה של Gemini + אובייקט המוצר המעוצב לתוך ה-UI
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.text || "סליחה, קרתה שגיאה בקבלת תשובה.",
          product: data.product || null, // כאן קורה הקסם - הכרטיס המעוצב מוזרק
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "שגיאה בתקשורת עם השרת");
      }
      
    } catch (error: any) {
      toast({ 
        title: "שגיאה", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 border-e bg-white dark:bg-zinc-900 hidden md:flex flex-col shadow-sm">
        <header className="p-4 bg-[#f0f2f5] dark:bg-zinc-800 flex justify-between items-center border-b">
          <div className="w-10 h-10 bg-slate-200 rounded-full border border-slate-300"></div>
          <MoreVertical size={20} className="text-gray-500 cursor-pointer" />
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-b flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md uppercase">S</div>
            <div>
              <div className="font-black text-sm text-slate-800 dark:text-slate-100 italic tracking-tight">ח. סבן - {phone}</div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest animate-pulse">Live Sync Active</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#e5ddd5] dark:bg-[#0b141a]">
        <header className="p-3 bg-[#f0f2f5] dark:bg-zinc-900 border-b flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">S</div>
            <div>
              <div className="font-bold text-sm dark:text-white">ח. סבן (ניהול ווטסאפ)</div>
              <div className="text-[10px] text-emerald-500 font-bold">מחובר למלאי בזמן אמת</div>
            </div>
          </div>
          <div className="flex gap-6 text-gray-500 pr-2">
            <Video size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
            <Phone size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
            <Search size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
          </div>
        </header>

        {/* זרימת ההודעות */}
        <div className="flex-1 relative overflow-hidden">
           <ChatShell>
              <MessageList />
           </ChatShell>
        </div>

        {/* אזור ההקלדה */}
        <footer className="p-3 bg-[#f0f2f5] dark:bg-zinc-900 flex items-center gap-2 border-t border-slate-200 dark:border-zinc-800">
          <Composer onSend={handleSendMessage} disabled={isLoading} />
        </footer>
      </main>
    </div>
  );
}
