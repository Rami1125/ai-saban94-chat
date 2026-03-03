"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { Composer } from "./composer";
import { MessageList } from "./message-list";
import { ProductCard } from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Sparkles } from "lucide-react";

export function ChatManager() {
  // סטייט לניהול המוצר הנבחר להתייעצות
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // חיבור ל-Vercel AI SDK
  const { messages, input, setInput, append, isLoading, reload } = useChat({
    api: "/api/chat",
    // שליחת המוצר הנבחר בתוך ה-Body של הבקשה ל-route.ts
    body: {
      selectedProduct: selectedProduct,
    },
    onFinish: () => {
      // ניקוי המוצר הנבחר לאחר שה-AI ענה (אופציונלי)
      // setSelectedProduct(null);
    }
  });

  // גלילה אוטומטית לסוף הצ'אט בכל הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // פונקציה מרכזית: טיפול בלחיצה על "התייעצות" מתוך כרטיס מוצר
  const handleConsult = (product: any, type: string) => {
    console.log(`[מלשינון] מתחיל התייעצות: ${product.product_name} | סוג: ${type}`);
    
    // 1. נעימת המוצר בסטייט כדי שה-API יקבל את המידע הטכני שלו
    setSelectedProduct(product);
    
    // 2. יצירת הודעת משתמש אוטומטית שמפעילה את ג'ימיני
    const consultPrompt = `אני רוצה להתייעץ על ${type} במוצר: ${product.product_name}`;
    
    // 3. שליחה ישירה לצ'אט
    append({
      role: "user",
      content: consultPrompt,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans shadow-2xl overflow-hidden" dir="rtl">
      
      {/* Header יוקרתי */}
      <header className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-500/30">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0B2C63] dark:text-white leading-none">סבן AI</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">מחובר למלאי בזמן אמת</p>
          </div>
        </div>
        
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800"
          >
            <Sparkles size={14} className="text-blue-600" />
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">מתייעץ על: {selectedProduct.product_name}</span>
            <button onClick={() => setSelectedProduct(null)} className="text-blue-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </header>

      {/* אזור ההודעות */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <MessageList messages={messages} isLoading={isLoading} />
      </main>

      {/* אזור ה-Composer והחיפוש הציף */}
      <footer className="p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 pt-10">
        <div className="max-w-4xl mx-auto">
          {/* ה-Composer מקבל פונקציות לטיפול במוצרים שנמצאו בחיפוש */}
          <Composer 
            onSendMessage={(msg) => append({ role: 'user', content: msg })}
            onSelectProduct={(product) => handleConsult(product, "התייעצות כללית")}
          />
        </div>
      </footer>

      {/* פונקציית עזר להצגת כרטיס מוצר בתוך רשימת ההודעות (אם הקוד שלך תומך בזה) */}
      {/* כאן ה-ProductCard מקבל את ה-onConsult ומונע את שגיאת ה-TypeError */}
    </div>
  );
}
