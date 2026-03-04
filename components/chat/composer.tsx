"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2, Package, X } from "lucide-react";
import { ProductCard } from "./ProductCard"; 
import { useChatActions } from "../../context/ChatActionsContext"; 
import { useConfig } from "../../context/BusinessConfigContext"; 
import { Product } from "../../types"; 

export function Composer() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const { sendMessage, handleConsult, isLoading } = useChatActions();
  const config = useConfig();
  const containerRef = useRef<HTMLDivElement>(null);

  // סגירת תוצאות בלחיצה מחוץ לרכיב
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // לוגיקת חיפוש עם Debounce (מניעת קריאות מרובות לשרת)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (input.trim().length >= 2) {
        setIsSearching(true);
        try {
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
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [input]);

  const onSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={containerRef} dir="rtl">
      {/* רשימת תוצאות חיפוש צפה (Dropdown) */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-4 w-full bg-white dark:bg-slate-900 rounded-[35px] shadow-2xl border border-slate-100 dark:border-slate-800 p-4 z-50 max-h-[500px] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 flex items-center gap-1">
                <Package size={12} /> נמצאו {results.length} מוצרים
              </span>
              <button 
                onClick={() => setShowResults(false)}
                className="hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full transition-colors"
              >
                <X size={14} className="text-slate-300" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {results.map((product) => (
                <div 
                  key={product.id} 
                  className="cursor-pointer"
                  onClick={() => { 
                    handleConsult(product, "התייעצות כללית"); 
                    setInput(""); 
                    setShowResults(false); 
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* תיבת הקלט העיקרית */}
      <div className="relative group p-1 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-full shadow-lg transition-all focus-within:shadow-blue-500/10">
        <div className="flex items-center bg-white dark:bg-slate-950 rounded-full p-2">
          <div className="flex-1 flex items-center px-4 gap-3">
            {isSearching ? (
              <Loader2 size={18} className="animate-spin text-blue-500" />
            ) : (
              <Search size={18} className="text-slate-400" />
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              placeholder="חפש מוצר או שאל שאלה..."
              className="w-full bg-transparent border-none outline-none py-3 text-sm font-medium placeholder:text-slate-400 text-slate-800 dark:text-white"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            style={{ backgroundColor: config.primaryColor }}
            className="text-white p-4 rounded-full shadow-lg disabled:opacity-50 disabled:grayscale transition-all"
            aria-label="שלח הודעה"
          >
            <Send size={18} className="rotate-180" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
