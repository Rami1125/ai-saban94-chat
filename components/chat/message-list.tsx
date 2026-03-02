"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "./product-card";
import { AnimatedOrb } from "./animated-orb";

const containerVariants = {
  show: { transition: { staggerChildren: 0.1 } }
};

const messageVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export function MessageList({ messages, isStreaming }: any) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex-1 overflow-y-auto px-6 space-y-8 pb-32 no-scrollbar pt-20"
    >
      <AnimatePresence>
        {messages.map((m: any) => (
          <motion.div
            key={m.id}
            variants={messageVariants}
            layout
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] flex flex-col space-y-3 ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div 
                className={`p-5 rounded-[28px] text-[16px] font-bold shadow-xl border ${
                  m.role === "user" 
                    ? "bg-[#0B2C63] text-white rounded-tr-none border-blue-400/20" 
                    : "bg-white text-slate-800 border-slate-100 rounded-tl-none shadow-slate-200/50"
                }`}
                dangerouslySetInnerHTML={{ __html: m.content }}
              />

              {m.products?.map((p: any) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isStreaming && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
          <AnimatedOrb size={40} />
          <span className="text-[10px] font-black text-blue-600/40 tracking-[3px] uppercase italic">Processing...</span>
        </motion.div>
      )}
    </motion.div>
  );
}
