"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2, Package, X, ArrowLeft } from "lucide-react";
import { ProductCard } from "./ProductCard"; 
import { useChatActions } from "@/context/ChatActionsContext"; 
import { useConfig } from "@/context/BusinessConfigContext"; 
import { Product } from "@/types"; 

export function Composer() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const { sendMessage, handleConsult, isLoading } = useChatActions();
  const config = useConfig();
  const containerRef = useRef<HTMLDivElement>(null);

  // סגירת התוצאות בלחיצה מחוץ לרכיב
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // לוגיקת החיפוש בזמן אמת (Live Search)
  useEffect(() => {
    const searchProducts = async () => {
      if (input.trim().length >= 2) {
        setIsSearching(true);
        try {
          // פנייה ל-API שמחזיר מוצרים מה-Inventory לפי טקסט
          const res = await fetch(`/api/inventory/search?q=${encodeURIComponent(input)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
            setShowResults(true);
          }
        } catch (err) {
          console.error("Search failed:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    };

    // Debounce: מחכה 300 מילישניות מסוף ההקלדה לפני השליחה
    const delayDebounceFn = setTimeout(searchProducts, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [input]);

  const onSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    setShowResults(false);
  };

  const handleProductSelect = (product: Product) => {
    // שליחת המוצר לצ'אט לצורך התייעצות
    handleConsult(product, "פרטים נוספים");
    setInput("");
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={containerRef} dir="rtl">
      
      {/* חלונית תוצאות צפה - מצטמצמת תוך כדי הקלדה */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-4 w-full bg-white dark:bg-slate-900 rounded-[30px] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800 p-2 max-h-[450px] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-50 dark:border-slate-800 mb-2">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-tighter flex items-center gap-2">
                <Package size={14} /> נמצאו {results.length} מוצרים תואמים
              </span>
              <button onClick={() => setShowResults(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 p-1">
              {results.map((product) => (
                <motion.div 
                  layout
                  key={product.id || product.sku} 
                  className="cursor-pointer hover:ring-2 ring-blue-500/20 rounded-[22px] transition-all"
                  onClick={() => handleProductSelect(product)}
                >
                  {/* שימוש בכרטיס המוצר הקיים שלך */}
                  <div className="scale-[0.98] origin-right">
                    <ProductCard product={product} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* תיבת הקלט העיקרית */}
      <div className="relative group p-1.5 bg-white dark:bg-slate-950 rounded-full shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center transition-all focus-within:ring-4 ring-blue-500/10">
        <div className="flex-1 flex items-center px-4 gap-3">
          {isSearching ? (
            <Loader2 size={20} className="animate-spin text-blue-500" />
          ) : (
            <Search size={20} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="הקלד שם מוצר (למשל: סיקה, גבס...)"
            className="w-full bg-transparent border-none outline-none py-4 text-base font-bold placeholder:text-slate-400 text-slate-800 dark:text-white"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSend}
          disabled={isLoading || !input.trim()}
          style={{ backgroundColor: config.primaryColor }}
          className="text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg disabled:opacity-30 disabled:grayscale transition-all"
        >
          <ArrowLeft size={20} />
        </motion.button>
      </div>
    </div>
  );
}
