"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Sparkles } from "lucide-react";

export default function AIAvatar() {
  const [showPopup, setShowPopup] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // קפיצת ה-Popup אחרי 3 שניות של גלישה
    const timer = setTimeout(() => setShowPopup(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {showPopup && !isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white p-5 rounded-[2rem] shadow-2xl border border-blue-100 max-w-[280px] relative mb-2"
          >
            <button onClick={() => setShowPopup(false)} className="absolute top-2 left-2 text-slate-300 hover:text-slate-500">
              <X size={16} />
            </button>
            <p className="text-right font-bold text-slate-800 text-sm leading-relaxed">
              {`הלוו! ברוך הבא 👋`} <br/>
              {`אני AI-היועץ שלך, צריך עזרה בבחירת חומרי איטום או דבק?`}
            </p>
            <button 
              onClick={() => setIsOpen(true)}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-100"
            >
              {`יאללה, בוא נתייעץ`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="w-20 h-20 rounded-full bg-slate-900 border-4 border-white shadow-2xl cursor-pointer overflow-hidden relative"
      >
        <motion.img 
          src="/ai-character.png" // התמונה של הדמות שלך
          className="w-full h-full object-cover"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
      </motion.div>
    </div>
  );
}
