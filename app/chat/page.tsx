"use client";

import React, { useState, useEffect } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { useConfig } from "@/context/BusinessConfigContext";
import { useChatActions } from "@/context/ChatActionsContext";
import { LayoutDashboard, ShoppingBag, MessageSquare, Database } from "lucide-react";

export default function IntegratedChatPage() {
  const config = useConfig();
  const { messages } = useChatActions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden" dir="rtl">
      <aside className="hidden md:flex flex-col w-64 bg-white border-l border-slate-200 p-4 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-blue-600 rounded-xl">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="font-black text-xl">{config.businessName}</span>
        </div>
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-600 rounded-xl font-bold">
            <MessageSquare size={20} /> צ'אט AI
          </button>
        </nav>
      </aside>

      <section className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
          <h1 className="text-lg font-black">{config.businessName} AI</h1>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {messages.length} הודעות
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative px-4 py-6 max-w-5xl w-full mx-auto">
          <ChatWindow />
        </div>
      </section>
    </main>
  );
}
