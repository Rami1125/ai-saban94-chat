"use client";

import { motion, AnimatePresence } from "framer-motion";
// תיקון קריטי: שינוי הנתיב ל-ProductCard (אותיות גדולות) בדיוק כמו שם הקובץ
import { ProductCard } from "./ProductCard"; 
import { AnimatedOrb } from "./animated-orb";

interface Message {
  role: string;
  content: string;
  product?: any;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onConsult?: (product: any, type: string) => void;
}

export function MessageList({ messages, isLoading, onConsult }: MessageListProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-[25px] shadow-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 rounded-tl-none"
              }`}
            >
              {/* תוכן הטקסט */}
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: message.content }} 
              />
              
              {/* אם ההודעה מכילה כרטיס מוצר (למשל מחיפוש או המלצה) */}
              {message.product && (
                <div className="mt-4">
                  <ProductCard 
                    product={message.product} 
                    onConsult={onConsult} 
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[25px] rounded-tl-none border border-slate-100 dark:border-slate-800">
              <AnimatedOrb />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
