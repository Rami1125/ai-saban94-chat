"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, Calculator, ShoppingCart, 
  Package, X, Share2, Trash2, Loader2,
  User, Settings, Zap, Phone, Search, Ruler, BadgeCheck
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from "@/lib/supabase"; 
import { toast, Toaster } from "sonner";
import { ChatShell } from "@/components/chat/chat-shell";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/Composer";
import { ActionOverlays } from "@/components/chat/ActionOverlays";
import { ChatActionsProvider } from "@/context/ChatActionsContext";
import { BusinessConfigProvider } from "@/context/BusinessConfigContext";

/**
 * Saban OS V8.9.4 - Production Fix
 * נתיב מוח: /api/ai/consult
 */

function WhatsAppCloneContent() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const phone = "972508860896";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // טעינת הודעה ראשונית
    setMessages([{ 
      id: '1', 
      role: 'bot', 
      content: 'אהלן ראמי, המוח הלוגיסטי מחובר לביצוע. מה נבדוק היום? 🦾', 
      timestamp: Date.now() 
    }]);
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    const newUserMsg = { 
      id: Date.now().toString(), 
      content, 
      role: 'user', 
      timestamp: Date.now() 
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('api/pro_brain/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: content, 
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: { 
            inventory: messages.find(m => m.product)?.product || null 
          },
          phone: phone,
          userName: "ראמי"
        })
      });
      
      if (!res.ok) throw new Error("Failed to consult the brain");
      
      const data = await res.json();
      
      if (data.answer) {
        const botMsg = {
          id: (Date.now() + 1).toString(),
          content: data.answer,
          role: 'assistant',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMsg]);
      }

    } catch (error: any) {
      console.error("Chat Error:", error);
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
    <div className="flex h-screen bg-[#F2F2F2] dark:bg-zinc-950 overflow-hidden font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-[400px] border-l bg-white/80 backdrop-blur-xl hidden lg:flex flex-col shadow-2xl z-20">
        <header className="p-6 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Zap size={24} fill="white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-slate-900 uppercase italic">SABAN OS</h1>
              <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Consult API Active</p>
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
            <div className="flex-1 text-right">
              <span className="font-black text-slate-800 italic uppercase">ח. סבן מרכזי</span>
              <p className="text-xs font-bold text-slate-400 mt-1">{phone}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#F8F9FA]">
        <header className="h-20 bg-white/90 backdrop-blur-md border-b flex justify-between items-center px-8 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-900 rounded-[18px] flex items-center justify-center text-white font-bold text-xs shadow-lg">S</div>
            <div className="text-right">
              <div className="font-black text-lg text-slate-900 leading-none italic uppercase">Saban Consulting</div>
              <div className="text-[10px] text-emerald-600 font-black uppercase mt-1 tracking-tighter">AI Assistant Online</div>
            </div>
          </div>
          <div className="flex gap-8 text-slate-400">
             <Ruler className="cursor-pointer hover:text-blue-600 transition-colors" size={22} onClick={openGlobalCalculator} />
             <Phone className="cursor-pointer hover:text-slate-900 transition-colors" size={22} />
             <Search className="cursor-pointer hover:text-slate-900 transition-colors" size={22} />
          </div>
        </header>

        <div className="flex-1 relative overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4 pb-32">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm border ${
                  m.role === 'user' ? 'bg-white border-slate-200' : 'bg-blue-600 text-white border-blue-500'
                }`}>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-blue-50 p-3 rounded-xl flex items-center gap-2">
                  <Loader2 className="animate-spin text-blue-500" size={14} />
                  <span className="text-[10px] font-bold text-blue-600 uppercase">מוח מסנכרן...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="p-6 bg-transparent absolute bottom-0 w-full z-20">
          <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-2xl border-2 border-white p-2 rounded-[32px] shadow-2xl flex items-center gap-2">
             <input 
              type="text" 
              placeholder="כתוב פקודה לביצוע..." 
              className="flex-1 bg-transparent px-4 py-3 outline-none font-bold text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
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
