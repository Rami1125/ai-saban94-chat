"use client";

import React, { useState, useEffect } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { Composer } from "@/components/chat/Composer"; 
import { useConfig } from "@/context/BusinessConfigContext";
import { useChatActions } from "@/context/ChatActionsContext";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Database,
  Info
} from "lucide-react";

export default function ChatCanvasPage() {
  const config = useConfig();
  const { messages } = useChatActions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black">טוען מערכת סבן...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-l border-slate-200 p-4 space-y-6">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="font-black text-xl text-slate-900">{config.businessName}</span>
        </div>
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-600 rounded-xl font-bold transition-all">
            <MessageSquare size={20} />
            <span>צ'אט AI חכם</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-all">
            <Database size={20} />
            <span>ניהול מלאי</span>
          </button>
        </nav>
      </aside>

      {/* Main Canvas */}
      <section className="flex-1 flex flex-col relative overflow-hidden h-full bg-[#F8FAFC]">
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 shadow-sm">
          <h1 className="text-lg font-black text-slate-900 leading-none">{config.businessName} AI</h1>
          <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 border border-slate-200 uppercase">
            {messages.length} Messages
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto relative px-4 pt-6 pb-2">
          <div className="flex-1 relative z-10 flex flex-col bg-white rounded-t-[40px] shadow-2xl border border-b-0 border-slate-100 overflow-hidden">
            <ChatWindow />
          </div>
        </div>

        {/* Composer - Input Field */}
        <div className="bg-white border-t border-slate-100 px-4 py-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-b-[40px] max-w-5xl w-full mx-auto">
          <Composer />
        </div>
      </section>
    </main>
  );
}
