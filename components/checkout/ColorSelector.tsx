"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash"; // מומלץ להתקין: npm i lodash @types/lodash

export default function ColorSelector({ onSelect }) {
  const [query, setQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState("5L");
  const [preview, setPreview] = useState({ hex: "#ffffff", name: "בחר גוון" });
  const [loading, setLoading] = useState(false);

  // הפונקציה המרכזית: שליפת הגוון מהדאטה-בייס האמיתי
  const fetchColorData = useCallback(
    debounce(async (code: string) => {
      if (code.length < 2) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('colors')
        .select('hex, name, code')
        .or(`code.ilike.${code},name.ilike.%${code}%`) // חיפוש גמיש לפי קוד או שם
        .limit(1)
        .single();

      if (data && !error) {
        const colorInfo = {
          code: data.code,
          hex: data.hex,
          name: data.name,
          size: selectedSize
        };
        setPreview({ hex: data.hex, name: data.name });
        onSelect(colorInfo); // מעדכן את דף הקופה הראשי
      }
      setLoading(false);
    }, 400), // ממתין 400 מילי-שניות מסיום ההקלדה
    [selectedSize]
  );

  useEffect(() => {
    if (query) fetchColorData(query);
  }, [query, fetchColorData]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="חפש קוד גוון (למשל IS0001 או 7035)"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          className="pl-12 font-bold tracking-widest"
        />
        {/* תצוגה מקדימה של הגוון בתוך האינפוט */}
        <div 
          className="absolute left-2 top-2 w-8 h-6 rounded border shadow-sm transition-all duration-500"
          style={{ backgroundColor: preview.hex }}
        />
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-slate-500 font-medium">
          {loading ? "מחפש במניפה..." : preview.name}
        </span>
        <span className="text-xs font-mono text-blue-600 font-bold">{preview.hex}</span>
      </div>
      
      {/* כפתורי בחירת גודל (נשארים כפי שהיו) */}
      <div className="grid grid-cols-4 gap-2">
        {["1L", "5L", "10L", "18L"].map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setSelectedSize(size)}
            className={`py-2 text-xs rounded-md border font-bold transition-all ${
              selectedSize === size 
                ? "bg-slate-800 text-white border-slate-800 shadow-md scale-105" 
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
            }`}
          >
            {size === "18L" ? 'פח' : size}
          </button>
        ))}
      </div>
    </div>
  );
}
