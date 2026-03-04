"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2, Package, X } from "lucide-react";
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-4 w-full bg-white dark:bg-slate-900 rounded-[35px] shadow-2xl border border-slate-100 z-[100] max-h-[350px] overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              {results.map((product) => (
                <div key={product.id} onClick={() => { handleConsult(product, "התייעצות כללית"); setInput(""); setShowResults(false); }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center bg-white dark:bg-slate-950 rounded-full border p-2 shadow-xl">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="חפש מוצר או שאל..."
          className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-medium"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSend}
          disabled={isLoading}
          style={{ backgroundColor: config.primaryColor }}
          className="text-white p-4 rounded-full"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} className="rotate-180" />}
        </motion.button>
      </div>
    </div>
  );
}
