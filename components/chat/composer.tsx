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

  // מנגנון חיפוש בזמן אמת
  useEffect(() => {
    const searchProducts = async () => {
      if (input.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/inventory/search?q=${encodeURIComponent(input)}`);
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

  // סגירה בלחיצה בחוץ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-4" dir="rtl" ref={searchRef}>
      
      {/* רשימת תוצאות מצטמצמת - תיקון מבנה ה-JSX */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-4 w-full left-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[30px] shadow-2xl border border-blue-500/10 overflow-hidden max-h-[450px] overflow-y-auto p-4 z-50"
          >
            <div className="flex items-center gap-2 mb-3 px-2 text-blue-600 font-black italic text-xs uppercase tracking-widest">
              <Package size={14} />
              תוצאות מהמחסן של סבן
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {results.map((product) => (
                <div 
                  key={product.id || product.sku} 
                  className="cursor-pointer transition-transform hover:scale-[0.98]"
                  onClick={() => {
                    onSelectProduct(product);
                    setInput("");
                    setShowResults(false);
                  }}
                >
                  <ProductCard 
                    product={product} 
                    onConsult={(p) => onSelectProduct(p)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* תיבת הקלט */}
      <div className="relative group">
        <div className="absolute inset-0 bg-blue-500/20 blur-2xl group-focus-within:bg-blue-500/40 transition-all rounded-full" />
        <div className="relative flex items-center bg-white dark:bg-slate-950 rounded-full border-2 border-blue-500/10 dark:border-blue-500/20 p-2 shadow-xl">
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
              placeholder="חפש מוצר או שאל את סבן AI..."
              className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-white font-medium placeholder:text-slate-400 py-3"
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
    </div>
  );
}
