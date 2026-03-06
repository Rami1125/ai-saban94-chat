"use client";

import React, { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { ChatShell } from "@/components/chat/chat-shell";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/Composer";
import { ActionOverlays } from "@/components/chat/ActionOverlays";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Video, 
  Search, 
  MoreVertical, 
  BadgeCheck, 
  Ruler, 
  LayoutDashboard, 
  Settings,
  History
} from "lucide-react";

export default function WhatsAppClonePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const phone = "972508860896"; // ח. סבן מרכזי

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
          product: m.product || null, 
          timestamp: m.timestamp || Date.now()
        })));
      }
    });
    return () => unsubscribe();
  }, [phone]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
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
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.text,
          product: data.product || null,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // פונקציה לפתיחת המחשבון באופן ידני מהממשק
  const openGlobalCalculator = () => {
    window.dispatchEvent(new CustomEvent('open-action-overlay', { 
      detail: { type: 'calculator', product: null } 
    }));
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-zinc-950 overflow-hidden font-sans" dir="rtl">
      
      {/* Sidebar מעוצב מחדש */}
      <aside className="w-[380px] border-l bg-white dark:bg-zinc-900 hidden lg:flex flex-col shadow-xl z-20">
        <header className="p-4 bg-[#f0f2f5] dark:bg-zinc-800 flex justify-between items-center border-b border-slate-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <LayoutDashboard size={20} />
            </div>
            <span className="font-black text-slate-800 dark:text-white italic">SABAN PANEL</span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-200 rounded-full transition-colors"><History size={18} /></button>
            <button className="p-2 hover:bg-slate-200 rounded-full transition-colors"><Settings size={18} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* כפתור מחשבון מהיר ב-Sidebar */}
          <div className="p-4">
            <button 
              onClick={openGlobalCalculator}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[20px] font-black flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95"
            >
              <Ruler size={20} />
              מחשבון כמויות מ"ר
            </button>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">S</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-800 dark:text-white">ח. סבן - {phone}</span>
                  <BadgeCheck size={14} className="text-blue-500" />
                </div>
                <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">מסונכרן למחסן</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* אזור הצ'אט המרכזי */}
      <main className="flex-1 flex flex-col relative bg-[#e5ddd5] dark:bg-[#0b141a]">
        <header className="p-3 bg-[#f0f2f5]/95 dark:bg-zinc-900/95 backdrop-blur-md border-b flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-md">S</div>
            <div>
              <div className="font-black text-[15px] dark:text-white leading-tight">ח. סבן (מרכז הזמנות)</div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Gemini 3.1 Live AI</span>
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-slate-500 pl-4">
            <button className="hover:text-blue-600 transition-colors" title="מחשבון"><Ruler size={19} onClick={openGlobalCalculator} /></button>
            <button className="hover:text-emerald-600 transition-colors"><Video size={19} /></button>
            <button className="hover:text-emerald-600 transition-colors"><Phone size={19} /></button>
            <button className="hover:text-slate-800 transition-colors"><Search size={19} /></button>
          </div>
        </header>

        {/* זרימת ההודעות */}
        <div className="flex-1 relative overflow-hidden">
           <ChatShell>
              <MessageList />
           </ChatShell>
        </div>

        {/* אזור ההקלדה */}
        <footer className="p-4 bg-[#f0f2f5] dark:bg-zinc-900 flex items-center gap-2 border-t border-slate-200 dark:border-zinc-800">
          <Composer onSend={handleSendMessage} disabled={isLoading} />
        </footer>
      </main>

      {/* רכיבי צד ואוברליי - מחשבון, הצעות מחיר, מלאי */}
      <ActionOverlays />
      
    </div>
  );
}
