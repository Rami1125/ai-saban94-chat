"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { askSabanAI } from "@/lib/ai-engine";

export default function ChatOverlay({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ repeat: Infinity, duration: 3 }}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer relative"
      >
        <div className="absolute -inset-2 bg-blue-600/30 rounded-full blur-xl animate-pulse" />
        <img src="/ai-avatar.png" className="w-20 h-20 rounded-full border-4 border-white shadow-2xl" />
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-2 py-1 rounded-full font-black animate-bounce">
          AI ONLINE
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ scale: 0, opacity: 0, x: -50, y: 50 }}
            animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute bottom-24 left-0 w-[350px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
               <span className="font-black">היועץ של סבן</span>
               <button onClick={() => setIsOpen(false)} className="opacity-50">✕</button>
            </div>
            <div className="p-6 h-80 bg-slate-50 overflow-y-auto text-right text-sm">
               {/* הודעת פתיחה חכמה */}
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 italic">
                 "שלום רמי, אני רואה שחסר לנו מלט בסניף החרש. תרצה שאבדוק אם הנהג בדרך לספק?"
               </div>
            </div>
            <div className="p-4 bg-white border-t flex gap-2">
               <input 
                 value={msg} 
                 onChange={(e) => setMsg(e.target.value)}
                 className="flex-1 bg-slate-100 rounded-xl px-4 text-xs font-bold text-right outline-none" 
                 placeholder="שאל אותי על מלאי, איטום או משלוח..."
               />
               <button className="bg-blue-600 p-3 rounded-xl text-white">➤</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
