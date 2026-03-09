"use client";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";

export default function ProductSelector({ onAddProduct }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const searchInventory = useCallback(
    debounce(async (val: string) => {
      if (val.length < 2) { setResults([]); return; }
      
      const { data, error } = await supabase
        .from('inventory') // שימוש בטבלה הקיימת שלך
        .select('sku, name, category')
        .or(`name.ilike.%${val}%,sku.ilike.%${val}%`)
        .limit(8);
      
      if (!error) setResults(data || []);
    }, 300),
    []
  );

  return (
    <div className="relative w-full space-y-2">
      <div className="relative">
         <Input 
          placeholder="חפש מוצר או מקט..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchInventory(e.target.value);
          }}
          className="bg-white border-2 focus:border-blue-500 transition-all"
        />
      </div>
      
      {results.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-2xl mt-1 max-h-64 overflow-y-auto">
          {results.map((item) => (
            <div 
              key={item.sku}
              onClick={() => {
                onAddProduct(item);
                setQuery("");
                setResults([]);
              }}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex flex-col gap-1 transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-800 text-sm leading-tight">{item.name}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500">{item.sku}</span>
              </div>
              <span className="text-[10px] text-blue-600 font-medium">{item.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
