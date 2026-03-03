"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2, Package } from "lucide-react";
import { ProductCard } from "./ProductCard";

interface Product {
  id?: string | number;
  sku?: string;
  product_name?: string;
  image_url?: string;
  video_url?: string;
  drying_time?: string;
  coverage?: string;
  price?: number;
  [key: string]: any;
}

interface ComposerProps {
  onSendMessage: (message: string) => void;
  onSelectProduct: (product: Product) => void;
}

export function Composer({ onSendMessage, onSelectProduct }: ComposerProps) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>("");

  /**
   * חיפוש מוצרים עם דיבאונס + ביטול בקשות קודמות
   */
  useEffect(() => {
    // אם הקלט קצר מדי—ננקה תוצאות ולא נקרא לשרת
    if (input.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      // לבטל בקשה קודמת אם יש
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const q = input.trim();
        lastQueryRef.current = q;

        const res = await fetch(
          `/api/inventory/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );

        // ייתכן שקיבלנו 404/500—נמנע מקריסה
        if (!res.ok) {
          console.warn("Search API returned:", res.status);
          setResults([]);
          setShowResults(false);
          return;
        }

        const data = await res.json();
        const arr = Array.isArray(data) ? (data as Product[]) : [];
        // הצג רק אם עדיין אותו query כדי למנוע מרוצים
        if (lastQueryRef.current === q) {
          setResults(arr);
          setShowResults(arr.length > 0);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // בקשה בוטלה — לא שגיאה אמיתית
        } else {
          console.error("Search error:", err);
          setResults([]);
          setShowResults(false);
        }
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
          abortRef.current = null;
        }
      }
    }, 300); // דיבאונס 300ms

    return () => {
      clearTimeout(timer);
      // במקרה של שינוי מהיר—נבטל בקשה קודמת
      controller.abort();
    };
  }, [input]);

  /**
   * סגירה בלחיצה מחוץ לחלון התוצאות
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * שליחת הודעה חופשית
   */
  const handleSend = useCallback(() => {
    const msg = input.trim();
    if (!msg) return;
    onSendMessage(msg);
    setInput("");
    setShowResults(false);
  }, [input, onSendMessage]);

  /**
   * בחירת מוצר מתוך רשימת התוצאות (לחיצה על הרקע של הכרטיס)
   * הערה: כפתורי הייעוץ בתוך ProductCard צריכים לעשות stopPropagation
   */
  const pickProduct = useCallback(
    (product: Product) => {
      if (!product) return;
      onSelectProduct(product);
      setInput("");
      setShowResults(false);
    },
    [onSelectProduct]
  );

  return (
    <div
      className="relative w-full max-w-2xl mx-auto p-4"
      dir="rtl"
      ref={searchRef}
      aria-label="מחפש מוצרים או טקסט לסבן AI"
    >
      {/* רשימת תוצאות מצטמצמת */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-4 w-full left-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[30px] shadow-2xl border border-blue-500/10 overflow-hidden max-h-[450px] overflow-y-auto p-4 z-50"
            role="dialog"
            aria-label="תוצאות חיפוש מוצרים"
          >
            <div className="flex items-center gap-2 mb-3 px-2 text-blue-600 font-black italic text-xs uppercase tracking-widest">
              <Package size={14} aria-hidden="true" />
              תוצאות מהמחסן של סבן
            </div>

            <div className="grid grid-cols-1 gap-3">
              {results.map((product) => (
                <div
                  key={String(product.id ?? product.sku ?? Math.random())}
                  className="cursor-pointer transition-transform hover:scale-[0.98]"
                  onClick={() => pickProduct(product)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pickProduct(product);
                    }
                  }}
                >
                  <ProductCard
                    product={product}
                    /**
                     * חשוב: חתימה תואמת (p, t) כדי למנוע אנומליות.
                     * כאן אנחנו משתמשים ב-onConsult כדי "לבחור מוצר" מתוך תוצאות,
                     * והייעוץ בפועל יקרה בזרימה של ChatManager.
                     * ודא שב-ProductCard הכפתורים קוראים stopPropagation (ראו הערות).
                     */
                    onConsult={(p, _t) => pickProduct(p)}
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
              <Loader2 size={20} className="animate-spin text-blue-500" aria-label="טוען תוצאות" />
            ) : (
              <Search size={20} className="text-slate-400" aria-hidden="true" />
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="חפש מוצר או שאל את סבן AI..."
              className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-white font-medium placeholder:text-slate-400 py-3"
              aria-label="שדה קלט לסבן AI"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            className="bg-[#0B2C63] text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition-colors"
            type="button"
            aria-label="שלח הודעה"
          >
            <Send size={20} className="rotate-180" aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
