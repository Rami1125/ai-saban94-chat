"use client";

import React from "react";
// שימוש ב-Alias @ כדי להבטיח נתיב אבסולוטי תקין
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

/**
 * קומפוננטת דף הצ'אט המשולבת
 * מתוקנת לשימוש בנתיבים אבסולוטיים למניעת שגיאות Build
 */
export default function IntegratedChatPage() {
  const config = useConfig();
  const { messages } = useChatActions();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden" dir="rtl">
      
      {/* סרגל צד - Desktop Sidebar */}
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
          <button className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl transition-all">
            <MessageSquare size={20} />
            <span className="font-bold lg:block hidden">צ'אט AI</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <ShoppingBag size={20} />
            <span className="font-bold lg:block hidden">חנות</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <Database size={20} />
            <span className="font-bold lg:block hidden">מלאי</span>
          </button>
        </nav>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl lg:block hidden border border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Info size={16} />
            <span className="text-xs font-bold uppercase">סטטוס</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight font-medium">
             מערכת מחוברת למסד הנתונים Unified Knowledge Base.
          </p>
        </div>
      </aside>

      {/* אזור הצ'אט המרכזי */}
      <section className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden p-2 bg-blue-600 rounded-lg">
              <MessageSquare className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none">
                {config.businessName} AI
              </h1>
              <p className="text-[10px] text-green-500 font-bold">Online • Database Active</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200">
              {messages.length} הודעות בשיחה
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto relative px-4 py-6">
          <div className="relative z-10 flex flex-col h-full shadow-2xl rounded-[40px] overflow-hidden border border-slate-200">
            <ChatWindow />
          </div>
        </div>

        <footer className="p-2 text-center text-[9px] text-slate-400 font-black uppercase tracking-widest bg-white border-t border-slate-100">
          © 2026 ח. סבן חומרי בניין בע"מ • AI Canvas v2.5
        </footer>
      </section>
    </main>
  );
}
