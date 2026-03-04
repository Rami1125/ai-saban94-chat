"use client";

import React, { useState, useEffect } from "react";
// שימוש בשמות קבצים עם אותיות גדולות בדיוק כמו בתיקייה
import { ChatWindow } from "@/components/ChatWindow";
import { Composer } from "@/components/chat/Composer"; 
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
        <p className="font-black text-blue-600 animate-pulse uppercase tracking-tighter">SABAN AI LOADING...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row h-screen overflow-hidden font-sans" dir="rtl">
      
      {/* סרגל צד - Sidebar */}
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
          <button className="w-full flex items-center gap-3 p-3 text-white/60 hover:text-white rounded-2xl transition-all">
            <SafeIcon name="Database" size={20} />
            <span>מלאי</span>
          </button>
        </nav>
      </aside>

      {/* אזור העבודה המרכזי */}
      <section className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 shadow-sm">
          <h1 className="text-lg font-black text-slate-900 leading-none">ממשק חכם</h1>
          <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 border border-slate-200">
            {messages.length} הודעות
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto relative px-4 pt-6 pb-2">
          <div className="flex-1 relative z-10 flex flex-col bg-white rounded-t-[40px] shadow-2xl border border-slate-100 overflow-hidden">
            <ChatWindow />
          </div>
        </div>

        {/* שדה הכתיבה - ממוקם בנפרד למניעת בעיות תצוגה */}
        <div className="bg-white border-t border-slate-100 px-6 py-8 z-20 shadow-lg rounded-b-[40px] max-w-5xl w-full mx-auto mb-4">
          <Composer />
        </div>
      </section>
    </main>
  );
}
