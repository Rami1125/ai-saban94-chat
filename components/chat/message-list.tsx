"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Calculator, Package, Ruler, Info } from "lucide-react";
import { ProductCard } from "./ProductCard"; // וודא שהקובץ קיים בתיקייה
import { useChatActions } from "@/context/ChatActionsContext";

export function MessageList() {
  const chatActions = useChatActions();
  const messages = chatActions?.messages || [];
  const isLoading = chatActions?.isLoading || false;
  const handleSendMessage = chatActions?.handleSendMessage;

  const scrollRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית להודעה האחרונה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  /**
   * פונקציה לפתיחת ה-Overlay עם נתוני מוצר ספציפיים
   * @param actionType - סוג הפעולה (quote, inventory, calculator)
   * @param productData - אובייקט המוצר שצמוד להודעה
   */
  const onQuickReplyClick = (actionType: string, productData?: any) => {
    // דיבאג לקונסול כדי לוודא שהמוצר עובר
    console.log(`פתיחת ${actionType} עבור מוצר:`, productData);

    const mapping: Record<string, string> = {
      quote: "quote",
      inventory: "inventory",
      calculator: "calculator",
    };

    if (mapping[actionType]) {
      // שיגור אירוע גלובלי שה-ActionOverlays מאזין לו
      window.dispatchEvent(
        new CustomEvent("open-action-overlay", {
          detail: {
            type: mapping[actionType],
            product: productData || null,
          },
        })
      );
    }
  };

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto p-4 space-y-8 custom-scrollbar scroll-smooth"
    >
      <AnimatePresence initial={false}>
        {messages.map((message: any, index: number) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex gap-3 max-w-[85%] ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* אייקון משתמש/בוט */}
              <div
                className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border
                ${
                  message.role === "user"
                    ? "bg-zinc-800 border-zinc-700 text-white"
                    : "bg-white border-slate-100 text-blue-600 shadow-blue-100/50"
                }`}
              >
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className="flex flex-col gap-3">
                {/* בועת טקסט */}
                <div
                  className={`p-5 rounded-[24px] shadow-sm text-[15px] leading-relaxed
                  ${
                    message.role === "user"
                      ? "bg-[#0b141a] text-white rounded-tr-none shadow-zinc-900/10"
                      : "bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-tl-none text-slate-800 dark:text-slate-100"
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: message.content }} />
                </div>

                {/* הצגת כרטיס מוצר אם קיים ב-Metadata של ההודעה */}
                {message.product && (
                  <ProductCard product={message.product} />
                )}

                {/* כפתורי פעולה מהירים - מופיעים רק בהודעה האחרונה של הבוט */}
                {message.role === "assistant" &&
                  index === messages.length - 1 &&
                  !isLoading && (
                    <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                      <ActionButton
                        icon={<Calculator size={14} />}
                        label="הצעת מחיר"
                        onClick={() => onQuickReplyClick("quote", message.product)}
                        variant="blue"
                      />
                      <ActionButton
                        icon={<Ruler size={14} />}
                        label="מחשבון מ'ר"
                        onClick={() => onQuickReplyClick("calculator", message.product)}
                        variant="indigo"
                      />
                      <ActionButton
                        icon={<Package size={14} />}
                        label="זמינות מלאי"
                        onClick={() => onQuickReplyClick("inventory", message.product)}
                        variant="emerald"
                      />
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* אנימציית טעינה כשהבוט חושב */}
      {isLoading && (
        <div className="flex justify-start items-center gap-2 text-slate-400 text-xs font-bold animate-pulse p-4">
          <Bot size={14} className="animate-bounce" />
          <span>ח. סבן מעבד נתונים...</span>
        </div>
      )}
    </div>
  );
}

/**
 * רכיב כפתור מעוצב עבור הצעות מחיר ומחשבונים
 */
function ActionButton({ icon, label, onClick, variant }: any) {
  const themes: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-600 hover:text-white shadow-blue-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white shadow-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white shadow-emerald-100",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-black border transition-all active:scale-95 shadow-sm ${themes[variant]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
