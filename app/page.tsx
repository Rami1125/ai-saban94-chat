"use client";

import React, { useState, useEffect } from "react";
import { ChatWindow } from "@/components/chatwindow";
import { Composer } from "@/components/chat/composer"; 
import { SafeIcon } from "@/components/SafeIcon";
import { SafeChatIcon } from "@/components/SafeChatIcon";
import { useConfig } from "@/context/BusinessConfigContext";
import { useChatActions } from "@/context/ChatActionsContext";

export default function ChatCanvasPage() {
  const config = useConfig();
  const { messages } = useChatActions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-blue-600 animate-pulse uppercase">SABAN AI LOADING...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row h-screen overflow-hidden font-sans" dir="rtl">
      
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B2C63] text-white p-6 space-y-8 shadow-2xl z-30">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <div className="p-2 bg-white rounded-xl shadow-inner">
            <SafeIcon name="Zap" className="text-[#0B2C63]" size={24} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl leading-none tracking-tighter">
              {config.businessName}
            </span>
            <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mt-1">Enterprise AI</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-white/10 text-white rounded-2xl font-bold border border-white/5 transition-all">
            <SafeChatIcon size={20} />
            <span>צ'אט ייעוץ</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-2xl font-medium transition-all group">
            <SafeIcon name="LayoutGrid" size={20} className="group-hover:scale-110 transition-transform" />
            <span>קטלוג מוצרים</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-2xl font-medium transition-all group">
            <SafeIcon name="Database" size={20} className="group-hover:scale-110 transition-transform" />
            <span>מלאי סניפים</span>
          </button>
        </nav>

        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-lg border border-white/20 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-white">
              <SafeIcon name="ShieldCheck" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Secured DB</span>
            </div>
            <p className="text-[11px] leading-tight text-blue-50 font-medium">
              הנתונים מסונכרנים מול טבלאות Supabase בזמן אמת.
            </p>
          </div>
          <SafeIcon name="Database" size={80} className="absolute -bottom-4 -left-4 opacity-10 group-hover:rotate-12 transition-transform" />
        </div>
      </aside>

      {/* Main Canvas */}
      <section className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden p-2 bg-[#0B2C63] rounded-lg text-white">
               <SafeChatIcon size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">ממשק ניהול חכם</h1>
              <p className="text-[10px] text-green-500 font-bold uppercase mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Connected to Unified DB
              </p>
            </div>
          </div>
          <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 border border-slate-200 uppercase tracking-tighter shadow-sm">
            Session: {messages.length} Events
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto relative px-4 pt-6 pb-2">
          <div className="flex-1 relative z-10 flex flex-col bg-white rounded-t-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
            <ChatWindow />
          </div>
        </div>

        <div className="bg-white border-t border-slate-100 px-6 py-8 z-20 shadow-[0_-15px_50px_rgba(0,0,0,0.04)] rounded-b-[40px] max-w-5xl w-full mx-auto mb-4">
          <Composer />
        </div>

        <footer className="px-8 pb-4 flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-widest">
          <div>v2.5.0-PROD</div>
          <div>SABAN BUILDING MATERIALS AI</div>
        </footer>
      </section>
    </main>
  );
}
