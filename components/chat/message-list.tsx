"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Calculator, Package, Ruler } from "lucide-react";
import { ProductCard } from "./ProductCard";

export function MessageList() {
  const scrollRef = useRef<HTMLDivElement>(null);
  // כאן צריכה להיות הלוגיקה של שליפת ההודעות מה-Context/Firebase שלך
  const messages = []; 

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const onQuickReplyClick = (actionType: string, productData?: any) => {
    // שליחת האירוע עם אובייקט המוצר המלא שנמצא בהודעה
    window.dispatchEvent(new CustomEvent('open-action-overlay', { 
      detail: { 
        type: actionType, 
        product: productData 
      } 
    }));
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-8 custom-scrollbar">
      <AnimatePresence initial={false}>
        {messages.map((message: any, index: number) => (
          <motion.div key={message.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* בועת ההודעה */}
              <div className="flex flex-col gap-2">
                <div className={`p-4 rounded-2xl ${message.role === "user" ? "bg-zinc-800 text-white" : "bg-white border"}`}>
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                </div>

                {/* כפתורי פעולה - כאן עובר הקשר המוצר */}
                {message.role === 'assistant' && message.product && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button 
                      onClick={() => onQuickReplyClick("calculator", message.product)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100"
                    >
                      <Ruler size={14} /> מחשבון מ'ר
                    </button>
                    {/* כפתורים נוספים להצעת מחיר ומלאי... */}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
