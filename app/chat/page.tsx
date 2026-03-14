"use client";

import React, { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { ChatShell } from "@/components/chat/chat-shell";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/Composer";
import { ActionOverlays } from "@/components/chat/ActionOverlays";
import { useToast } from "@/hooks/use-toast";
import { ChatActionsProvider } from "@/context/ChatActionsContext";
import { BusinessConfigProvider } from "@/context/BusinessConfigContext";
import { 
  Phone, Video, Search, Settings, BadgeCheck, Ruler, Zap 
} from "lucide-react";

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
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content }], phone })
      });
      if (!res.ok) throw new Error("Failed to send message");
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openGlobalCalculator = () => {
    window.dispatchEvent(new CustomEvent('open-action-overlay', { 
      detail: { type: 'calculator', product: null } 
    }));
  };

  return (
    <div className="flex h-screen bg-[#F2F2F2] dark:bg-zinc-950 overflow-hidden font-sans selection:bg-blue-100" dir="rtl">
      {/* Sidebar - SabanOS Style */}
      <aside className="w-[400px] border-l bg-white/80 backdrop-blur-xl hidden lg:flex flex-col shadow-2xl z-20">
        <header className="p-6 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[22px] flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Zap size={24} fill="white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-slate-900">SABAN OS</h1>
              <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Premium Logistics</p>
            </div>
          </div>
          <Settings className="text-slate-400 hover:rotate-90 transition-transform cursor-pointer" size={20} />
        </header>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <button 
            onClick={openGlobalCalculator}
            className="w-full p-5 bg-black text-white rounded-[28px] font-black flex items-center justify-between group hover:bg-blue-600 transition-all shadow-xl active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Ruler size={22} className="group-hover:rotate-12 transition-transform" />
              <span>מחשבון כמויות מ"ר</span>
            </div>
            <BadgeCheck size={18} className="text-blue-400" />
          </button>

          <div className="p-5 bg-slate-50 rounded-[30px] border border-white shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-[20px] flex items-center justify-center text-white font-black text-2xl shadow-inner">S</div>
            <div className="flex-1">
              <span className="font-black text-slate-800">ח. סבן מרכזי</span>
              <p className="text-xs font-bold text-slate-400 mt-1">{phone}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#F8F9FA]">
        <header className="h-20 bg-white/90 backdrop-blur-md border-b flex justify-between items-center px-8 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-900 rounded-[18px] flex items-center justify-center text-white font-bold text-xs">S</div>
            <div>
              <div className="font-black text-lg text-slate-900 leading-none">מרכז הזמנות</div>
              <div className="text-[10px] text-emerald-600 font-black uppercase mt-1 tracking-tighter">AI Assistant Online</div>
            </div>
          </div>
          <div className="flex gap-8 text-slate-400">
             <Ruler className="cursor-pointer hover:text-blue-600 transition-colors" size={22} onClick={openGlobalCalculator} />
             <Phone className="cursor-pointer hover:text-slate-900 transition-colors" size={22} />
             <Search className="cursor-pointer hover:text-slate-900 transition-colors" size={22} />
          </div>
        </header>

        <div className="flex-1 relative">
           <ChatShell>
              <MessageList />
           </ChatShell>
        </div>

        <footer className="p-6 bg-transparent absolute bottom-0 w-full z-20">
          <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-2xl border-2 border-white p-2 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-2">
            <Composer onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </footer>
      </main>

      <ActionOverlays />
    </div>
  );
}

export default function WhatsAppClonePage() {
  return (
    <BusinessConfigProvider>
      <ChatActionsProvider>
        <WhatsAppCloneContent />
      </ChatActionsProvider>
    </BusinessConfigProvider>
  );
}
