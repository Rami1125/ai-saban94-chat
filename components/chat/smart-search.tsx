"use client";
import { useState, useEffect } from "react";
import { ProductCard } from "./product-card";
import { Loader2 } from "lucide-react";

export function SmartSearch({ onSelect }: { onSelect: (p: any) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/inventory/search?q=${query}`);
      const data = await res.json();
      setResults(data);
      setLoading(false);
    }, 300); // Debounce של 300ms כדי לא לחנוק את ה-API

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full max-w-md mx-auto" dir="rtl">
      <input
        type="text"
        placeholder="חפש מוצר (למשל: סיקה 107)..."
        className="w-full p-4 rounded-2xl border-2 border-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {loading && <Loader2 className="absolute left-4 top-4 animate-spin text-blue-500" />}

      {results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 max-h-[400px] overflow-y-auto p-2">
          {results.map((product: any) => (
            <div 
              key={product.id} 
              onClick={() => { onSelect(product); setResults([]); }}
              className="cursor-pointer hover:bg-blue-50 transition-colors rounded-2xl mb-2"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
