"use client";

import React, { useState, useEffect } from "react";
// ייבוא רכיבים עם שמות מדויקים
import { ChatWindow } from "@/components/ChatWindow";
import { Composer } from "@/components/chat/Composer"; 
import { SafeIcon } from "@/components/SafeIcon";
import { SafeChatIcon } from "@/components/SafeChatIcon";
import { useConfig } from "@/context/BusinessConfigContext";
import { useChatActions } from "@/context/ChatActionsContext";
import { LayoutDashboard, ShoppingBag, Database, Info } from "lucide-react";

export default function ChatPage() {
  const config = useConfig();
  const { messages } = useChatActions();
  const [mounted, setMounted] = useState(false);

  // מניעת שגיאת Hydration - טעינה רק בדפדפן
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-blue-600">
        טוען מערכת...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row h-screen overflow-hidden font-sans" dir="rtl">
      
      {/* סרגל צד דסקטופ */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B2C63] text-white p-6 space-y-8 shadow-2xl z-30">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <div className="p-2 bg-white rounded-xl shadow-lg">
            <SafeIcon name="Zap" className="text-[#0B2C63]" size={24} fill="currentColor" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-xl tracking-tighter">{config.businessName}</span>
            <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mt-1">AI Assistant</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-white/10 text-white rounded-2xl font-bold border border-white/5 transition-all">
            <SafeChatIcon size={20} />
            <span>צ'אט ייעוץ</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-2xl font-medium transition-all group">
            <SafeIcon name="LayoutGrid" size={20} />
            <span>מוצרים</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-2xl font-medium transition-all group">
            <SafeIcon name="Database" size={20} />
            <span>מלאי</span>
          </button>
        </nav>
      </aside>

      {/* אזור העבודה המרכזי */}
      <section className="flex-1 flex flex-col relative overflow-hidden h-full">
        
        {/* Navbar עליון */}
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="md:hidden p-2 bg-[#0B2C63] rounded-lg text-white">
               <SafeChatIcon size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">מרכז שירות AI</h1>
              <p className="text-[10px] text-green-500 font-bold uppercase mt-1">Live Connection</p>
            </div>
          </div>
          <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 border border-slate-200">
            {messages.length} הודעות
          </div>
        </header>

        {/* חלון הצ'אט (היסטוריה) */}
        <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto relative px-4 pt-6 pb-2">
          <div className="flex-1 relative z-10 flex flex-col bg-white rounded-t-[40px] shadow-xl border border-slate-100 overflow-hidden">
            <ChatWindow />
          </div>
        </div>

        {/* --- כאן מופיע שדה הכתיבה והחיפוש --- */}
        <div className="bg-white border-t border-slate-100 px-6 py-8 z-20 shadow-lg rounded-b-[40px] max-w-5xl w-full mx-auto mb-4">
          <Composer />
        </div>

        <footer className="px-8 pb-4 text-center text-[9px] text-slate-400 font-black uppercase tracking-widest bg-transparent">
          SABAN BUILDING MATERIALS AI • PROD V2.5
        </footer>
      </section>
    </main>
  );
}
