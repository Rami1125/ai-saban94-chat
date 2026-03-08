"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Paintbrush } from "lucide-react";

const SIZES = [
  { label: "1 ליטר", value: "1L" },
  { label: "5 ליטר", value: "5L" },
  { label: "10 ליטר", value: "10L" },
  { label: "פח (18 ליטר)", value: "18L" }
];

export default function ColorSelector({ onSelect }) {
  const [query, setQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState("5L");
  const [preview, setPreview] = useState({ hex: "#ffffff", code: "" });

  const handleSearch = (val: string) => {
    setQuery(val.toUpperCase());
    // כאן אפשר להוסיף Fetch בזמן אמת מ-color_library
    // לצורך הדוגמה נבצע עדכון ויזואלי פשוט
    if (val.length > 2) {
      const mockHex = val.includes("NWC") ? "#fcfcfc" : "#e3ded1";
      setPreview({ hex: mockHex, code: val.toUpperCase() });
      onSelect({ code: val.toUpperCase(), size: selectedSize, hex: mockHex });
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-slate-50 border-dashed border-2">
      <div className="flex items-center gap-2 mb-2 text-blue-700">
        <Paintbrush size={18} />
        <span className="font-bold">בחירת גוון וגודל אריזה</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="קוד גוון (למשל NWC040W)" 
            className="pr-10 bg-white"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div 
          className="w-12 h-10 rounded border shadow-sm transition-colors duration-300"
          style={{ backgroundColor: preview.hex }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {SIZES.map((s) => (
          <Button
            key={s.value}
            type="button"
            variant={selectedSize === s.value ? "default" : "outline"}
            className={`text-xs h-9 ${selectedSize === s.value ? 'bg-blue-600' : 'bg-white'}`}
            onClick={() => {
              setSelectedSize(s.value);
              onSelect({ code: query, size: s.value, hex: preview.hex });
            }}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
