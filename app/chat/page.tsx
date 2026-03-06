"use client";

import React, { useState, useEffect, useRef } from "react";
import { rtdb } from "@/lib/firebase"; // הגשר שבנינו
import { ref, onValue, push, serverTimestamp as rtdbTimestamp } from "firebase/database";
import { supabase } from "@/lib/supabase";
import { ChatShell } from "@/components/chat/chat-shell";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/composer";
import { useToast } from "@/hooks/use-toast";
import { Search, MoreVertical, Phone, Video, CheckCheck } from "lucide-react";

export default function WhatsAppClonePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // הגדרת משתמש וטלפון (רמי - במציאות זה יגיע מ-Auth/URL)
  const phone = "972508860896"; 
  const userId = "saban-admin";

  // 1. האזנה בזמן אמת לצינור ה-Firebase (Realtime)
  useEffect(() => {
    const chatRef = ref(rtdb, `saban94`);
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const incoming = data.incoming ? Object.values(data.incoming) : [];
        const outgoing = data.send ? Object.values(data.send) : [];
        
        // איחוד וסידור הודעות לפי זמן
        const allMsgs = [...incoming, ...outgoing]
          .filter((m: any) => m.from === phone || m.to === phone || m.receiver === phone)
          .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
        
        setMessages(allMsgs.map(m => ({
          id: m.timestamp?.toString() || Math.random().toString(),
          content: m.text || m.content,
          role: (m.from === phone || !m.to) ? 'user' : 'assistant',
          createdAt: new Date(m.timestamp)
        })));
      }
    });

    return () => unsubscribe();
  }, [phone]);

  // 2. פונקציית שליחה משולבת (Gemini + Firebase)
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setIsLoading(true);

    try {
      // א. הזרקה ל-Firebase (כדי ש-JONI ישלח ללקוח)
      await push(ref(rtdb, 'saban94/send'), {
        to: phone,
        text: content,
        timestamp: Date.now(),
        from: "admin-panel"
      });

      // ב. קריאה למוח של Gemini (דרך ה-API שבנינו)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          phone: phone,
          userId: userId
        })
      });

      if (!response.ok) throw new Error("כשל במוח של Gemini");

    } catch (error: any) {
      toast({
        title: "שגיאת שליחה",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar - רשימת שיחות (מעוצב כ-Whatsapp) */}
      <aside className="w-80 border-e bg-white dark:bg-zinc-900 hidden md:flex flex-col">
        <header className="p-4 bg-[#f0f2f5] dark:bg-zinc-800 flex justify-between items-center">
          <div className="w-10 h-10 bg-slate-300 rounded-full"></div>
          <div className="flex gap-4 text-gray-500">
            <MoreVertical size={20} />
          </div>
        </header>
        <div className="p-2">
          <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center px-3 py-2">
            <Search size={18} className="text-gray-400" />
            <input placeholder="חפש שיחה..." className="bg-transparent border-none text-sm focus:outline-none px-2 w-full" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b bg-emerald-50 dark:bg-emerald-900/10 cursor-pointer">
            <div className="font-bold text-sm">{phone}</div>
            <div className="text-xs text-gray-500 truncate">הודעה אחרונה בצינור...</div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#e5ddd5] dark:bg-zinc-950 chat-bg-pattern">
        <header className="p-3 bg-[#f0f2f5] dark:bg-zinc-900 border-b flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">ס</div>
            <div>
              <div className="font-bold text-sm">ח. סבן - {phone}</div>
              <div className="text-[10px] text-emerald-600 font-bold">מחובר לצינור JONI</div>
            </div>
          </div>
          <div className="flex gap-5 text-gray-500">
            <Video size={20} className="cursor-pointer" />
            <Phone size={20} className="cursor-pointer" />
            <Search size={20} className="cursor-pointer" />
          </div>
        </header>

        {/* הודעות */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <ChatShell>
            <MessageList messages={messages} />
          </ChatShell>
        </div>

        {/* שדה כתיבה */}
        <footer className="p-3 bg-[#f0f2f5] dark:bg-zinc-900 flex items-center gap-2">
          <Composer 
            onSend={handleSendMessage} 
            placeholder="הקלד הודעה לצינור..."
            disabled={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
