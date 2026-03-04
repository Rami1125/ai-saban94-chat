"use client";

import React, { useState, useEffect } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { useConfig } from "@/context/BusinessConfigContext";
import { useChatActions } from "@/context/ChatActionsContext";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  Database,
  Info
} from "lucide-react";

export default function ChatCanvasPage() {
  const config = useConfig();
  const { messages } = useChatActions();
  const [mounted, setMounted] = useState(false);

  // מניעת שגיאת Hydration (React error #418)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold">טוען מערכת...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden" dir="rtl">
      
      {/* סרגל צד - Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 space-y-6">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="p-2 bg-blue-600 rounded-xl">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="font-black text-xl text-slate-900 dark:text-white lg:block hidden">
            {config.businessName}
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-600 rounded-xl transition-all">
            <MessageSquare size={20} />
            <span className="font-bold lg:block hidden">צ'אט AI</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
            <ShoppingBag size={20} />
            <span className="font-bold lg:block hidden">חנות מוצרים</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
            <Database size={20} />
            <span className="font-bold lg:block hidden">ניהול מלאי</span>
          </button>
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl lg:block hidden border border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Info size={16} />
            <span className="text-[10px] font-black uppercase">סטטוס מסד נתונים</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            מחובר ל-Unified Knowledge Base ושולף נתונים בזמן אמת.
          </p>
        </div>
      </aside>

      {/* אזור הצ'אט המרכזי */}
      <section className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden p-2 bg-blue-600 rounded-lg">
              <MessageSquare className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">
                {config.businessName} AI
              </h1>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Live Database Connected</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">
              {messages.length} Messages
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto relative px-4 py-6">
          <div className="relative z-10 flex flex-col h-full shadow-2xl rounded-[40px] overflow-hidden border border-slate-100">
            <ChatWindow />
          </div>
        </div>

        <footer className="p-2 text-center text-[9px] text-slate-400 font-black uppercase tracking-widest bg-white border-t border-slate-50">
          © 2026 ח. סבן חומרי בניין בע"מ • Powered by Saban Tech
        </footer>
      </section>
    </main>
  );
}
