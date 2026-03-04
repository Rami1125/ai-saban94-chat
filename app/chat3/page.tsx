"use client";

import React, { useState } from "react";
import { 
  Menu, X, Send, Paperclip, Mic, 
  MoreVertical, ChevronRight, MessageSquare, 
  Settings, Info, History 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SafeIcon } from "@/components/SafeIcon";
import { Button } from "@/components/ui/button";

export default function MobilePremiumChat() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#020617] p-0 sm:p-4">
      {/* Frame של המכשיר הסלולרי */}
      <div className="relative w-full max-w-[420px] h-[100dvh] sm:h-[840px] bg-slate-900 shadow-2xl overflow-hidden sm:rounded-[3rem] border-[8px] border-slate-800 flex flex-col shadow-blue-500/10">
        
        {/* תפריט המבורגר (Side Menu Overlay) */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-[80%] bg-[#0B2C63] z-50 p-6 flex flex-col text-right"
                dir="rtl"
              >
                <div className="flex justify-between items-center mb-10">
                  <span className="text-xl font-black text-white italic">SABAN MENU</span>
                  <button onClick={() => setIsMenuOpen(false)} className="text-white/70 hover:text-white">
                    <SafeIcon icon={X} size={24} />
                  </button>
                </div>
                
                <nav className="space-y-4">
                  <MenuLink icon={MessageSquare} label="צ'אט חדש" active />
                  <MenuLink icon={History} label="היסטוריית הזמנות" />
                  <MenuLink icon={Info} label="מידע על ח. סבן" />
                  <MenuLink icon={Settings} label="הגדרות חשבון" />
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10">
                  <p className="text-[10px] text-white/30 text-center font-mono">v1.2.0 PREMIUM AI</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Header - אפליקציית פרימיום */}
        <header className="h-20 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-30" dir="rtl">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <SafeIcon icon={Menu} size={24} className="text-blue-400" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-white tracking-widest uppercase italic">ח. סבן</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-bold uppercase">Online AI</span>
            </div>
          </div>

          <button className="p-2 hover:bg-white/5 rounded-full">
            <SafeIcon icon={MoreVertical} size={20} className="text-slate-400" />
          </button>
        </header>

        {/* אזור ההודעות */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          <ChatBubble sender="bot" text="שלום! אני העוזר של ח. סבן. במה אפשר לעזור לך היום?" time="11:40" />
          <ChatBubble sender="user" text="אני צריך הצעת מחיר למלט לכתובת בתייבה" time="11:41" />
          <ChatBubble sender="bot" text="בוודאי. יש לנו מלט איכותי במלאי. כמה שקים אתה צריך?" time="11:41" />
        </main>

        {/* Input Bar - פרימיום */}
        <footer className="p-4 bg-slate-900/90 backdrop-blur-lg border-t border-white/5">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-3xl p-2 pr-4 shadow-inner" dir="rtl">
            <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors">
              <SafeIcon icon={Paperclip} size={20} />
            </button>
            <input 
              type="text" 
              placeholder="כתוב הודעה לח. סבן..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white text-right"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className={`p-3 rounded-2xl transition-all ${message ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'}`}>
              <SafeIcon icon={message ? Send : Mic} size={20} />
            </button>
          </div>
          <div className="h-1.5 w-32 bg-white/10 mx-auto mt-4 rounded-full" /> {/* Home Indicator */}
        </footer>
      </div>
    </div>
  );
}

// --- קומפוננטות עזר ---

function MenuLink({ icon: Icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer ${active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
      <SafeIcon icon={Icon} size={20} />
      <span className="font-bold text-sm">{label}</span>
      {active && <div className="mr-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />}
    </div>
  );
}

function ChatBubble({ sender, text, time }: { sender: 'bot' | 'user', text: string, time: string }) {
  const isBot = sender === 'bot';
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
    >
      <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-lg ${
        isBot 
        ? 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/5' 
        : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-none'
      }`}>
        {text}
      </div>
      <span className="text-[9px] text-slate-500 mt-1 px-2 font-mono">{time}</span>
    </motion.div>
  );
}
