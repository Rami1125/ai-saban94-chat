"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatActions } from "@/context/ChatActionsContext";
import { ProductCard } from "@/components/chat/ProductCard"; // תיקון נתיב
"use client";

import React, { useState, useEffect } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { Composer } from "@/components/chat/Composer"; // לוודא שזה מיובא
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

  // פתרון שגיאת Hydration - מבטיח שה-JS ירוץ רק בדפדפן
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black">טוען מערכת סבן...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden" dir="rtl">
      
      {/* סרגל צד - Sidebar */}
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

        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20 lg:block hidden">
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">מחובר למסד נתונים</span>
          </div>
          <p className="text-[11px] opacity-90 leading-tight font-medium">
            הזרקת הנתונים הצליחה. כל שאילתה שולפת כרטיס מוצר מה-Inventory.
          </p>
        </div>
      </aside>

      {/* אזור הקנבס המרכזי */}
      <section className="flex-1 flex flex-col relative overflow-hidden h-full bg-[#F8FAFC]">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-slate-900 leading-none">
              {config.businessName} AI <span className="text-blue-600 text-[10px] font-black uppercase border-r pr-2 mr-2 border-slate-300 tracking-tighter">Production</span>
            </h1>
          </div>
          <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 border border-slate-200 uppercase">
            {messages.length} Messages
          </div>
        </header>

        {/* אזור הצ'אט - גמיש כדי להשאיר מקום לשדה הכתיבה למטה */}
        <div className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto relative px-4 pt-6 pb-2">
          <div className="flex-1 relative z-10 flex flex-col bg-white rounded-t-[40px] shadow-2xl border border-b-0 border-slate-100 overflow-hidden">
            <ChatWindow />
          </div>
        </div>

        {/* --- שדה הכתיבה (Composer) - ממוקם כאן כדי שיהיה תמיד גלוי --- */}
        <div className="bg-white border-t border-slate-100 px-4 py-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-b-[40px] max-w-5xl w-full mx-auto">
          <Composer />
        </div>

        <footer className="p-2 text-center text-[9px] text-slate-400 font-black uppercase tracking-widest bg-white">
          © 2026 ח. סבן חומרי בניין בע"מ • AI Dashboard Engine
        </footer>
      </section>
    </main>
  );
}
export function ChatWindow() {
  const { messages, isLoading } = useChatActions();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-[25px] ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: msg.content }} className="text-sm font-medium leading-relaxed" />
              
              {/* הצגת כרטיס מוצר אם קיים בהודעה */}
              {msg.product && (
                <div className="mt-4">
                  <ProductCard product={msg.product} />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start italic text-xs text-slate-400 animate-pulse">
            סבן AI מעבד נתונים...
          </div>
        )}
      </div>
    </div>
  );
}
