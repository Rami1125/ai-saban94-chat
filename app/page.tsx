"use client";

import React, { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, push } from "firebase/database";
import { ChatShell } from "@/components/chat/chat-shell";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/Composer"; // תיקון C גדולה
import { useToast } from "@/hooks/use-toast";
import { Search, MoreVertical, Phone, Video } from "lucide-react";

export default function WhatsAppClonePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const phone = "972508860896"; 
  const userId = "saban-admin";

  useEffect(() => {
    const chatRef = ref(rtdb, `saban94`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const incoming = data.incoming ? Object.values(data.incoming) : [];
        const outgoing = data.send ? Object.values(data.send) : [];
        
        const allMsgs = [...incoming, ...outgoing]
          .filter((m: any) => m.from === phone || m.to === phone)
          .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
        
        setMessages(allMsgs.map(m => ({
          id: m.timestamp?.toString() || Math.random().toString(),
          content: m.text || m.content,
          role: (m.from === phone) ? 'user' : 'assistant',
          createdAt: new Date(m.timestamp)
        })));
      }
    });
    return () => unsubscribe();
  }, [phone]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: content,
        timestamp: Date.now(),
        from: "admin-panel"
      });
      
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          phone: phone,
          userId: userId
        })
      });
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-zinc-950 overflow-hidden">
      <aside className="w-80 border-e bg-white dark:bg-zinc-900 hidden md:flex flex-col">
        <header className="p-4 bg-[#f0f2f5] dark:bg-zinc-800 flex justify-between items-center">
          <div className="w-10 h-10 bg-slate-300 rounded-full"></div>
          <MoreVertical size={20} className="text-gray-500" />
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b bg-emerald-50 dark:bg-emerald-900/10 font-bold text-sm">{phone}</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#e5ddd5] dark:bg-zinc-950">
        <header className="p-3 bg-[#f0f2f5] dark:bg-zinc-900 border-b flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">ס</div>
            <div className="font-bold text-sm">ח. סבן - {phone}</div>
          </div>
          <div className="flex gap-5 text-gray-500">
            <Video size={20} /><Phone size={20} /><Search size={20} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <ChatShell>
            <MessageList messages={messages} />
          </ChatShell>
        </div>

        <footer className="p-3 bg-[#f0f2f5] dark:bg-zinc-900 flex items-center gap-2">
          <Composer 
            onSend={handleSendMessage} 
            placeholder="הקלד הודעה..."
            disabled={isLoading}
          />
        </footer>
      </main>
    </div>
  );
}
