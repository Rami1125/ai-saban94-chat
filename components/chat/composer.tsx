"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2, Package } from "lucide-react";
import { ProductCard } from "./ProductCard";

interface ComposerProps {
  onSendMessage: (message: string) => void;
  onSelectProduct: (product: any) => void;
}

export function Composer({ onSendMessage, onSelectProduct }: ComposerProps) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // חיפוש מוצרים בזמן אמת מה-Inventory
  useEffect(() => {
    const searchProducts = async () => {
      if (input.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/inventory/search?q=${encodeURIComponent(input)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setShowResults(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-4" dir="rtl" ref={searchRef}>
      
      {/* רשימת תוצאות החיפוש הציפה */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-4 w-full left-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[30px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[450px] overflow-y-auto p-4 z-50"
          >
            <div className="flex items-center gap-2 mb-3 px-2 text-[#0B2C63] dark:text-blue-400 font-black text-[10px] uppercase tracking-widest">
              <Package size={14} />
              נמצאו {results.length} מוצרים במחסן
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {results.map((product) => (
                <div 
                  key={product.id || product.sku} 
                  className="cursor-pointer transition-transform active:scale-95"
                  onClick={() => {
                    // לחיצה על הכרטיס עצמו (לא על הכפתורים) בוחרת אותו
                    onSelectProduct(product);
                    setInput("");
                    setShowResults(false);
                  }}
                >
                  <ProductCard 
                    product={product} 
                    // התיקון הקריטי: חיבור הצינור שמונע את ה-TypeError: r is not a function
                    onConsult={(p, t) => onSelectProduct(p)} 
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* תיבת הקלט והחיפוש */}
      <div className="relative flex items-center bg-white dark:bg-slate-950 rounded-full border-2 border-slate-100 dark:border-slate-800 p-2 shadow-2xl transition-all focus-within:border-blue-500/50">
        <div className="flex-1 flex items-center px-4 gap-3">
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-blue-500" />
          ) : (
            <Search size={20} className="text-slate-400" />
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="חפש מוצר (למשל: סיקה, גבס...)"
            className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-white font-medium py-3"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          className="bg-[#0B2C63] text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition-colors"
        >
          <Send size={20} className="rotate-180" />
        </motion.button>
      </div>
    </div>
  );
}
