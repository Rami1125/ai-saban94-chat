"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "./ProductCard"; // וודא שזה בדיוק שם הקובץ

export function MessageList({ messages, onConsult }: { messages: any[], onConsult: any }) {
  return (
    <div className="space-y-4">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`p-4 rounded-2xl ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            <div dangerouslySetInnerHTML={{ __html: m.content }} />
            {/* אם יש מוצר בהודעה, נציג כרטיס */}
            {m.product && <ProductCard product={m.product} onConsult={onConsult} />}
          </div>
        </div>
      ))}
    </div>
  );
}
