"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Scanner from "@/components/logistics/Scanner";
import { Package, MapPin, Database, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MobileScannerPage() {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (sku: string) => {
    setLoading(true);
    try {
      // שליפת המוצר מהטבלה שיצרנו ב-SQL
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("sku", sku)
        .single();

      if (error || !data) {
        toast.error(`מוצר ${sku} לא נמצא בטבלה`);
        setProduct(null);
      } else {
        setProduct(data);
        toast.success("מוצר זוהה");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
      {/* Header */}
      <div className="p-6 bg-white border-b flex justify-between items-center">
        <h1 className="text-xl font-black italic text-slate-900">מסופון סבן<span className="text-blue-600">94</span></h1>
        <Database size={20} className="text-slate-300" />
      </div>

      {/* אזור הסריקה */}
      <div className="p-4">
        <Scanner onScan={handleScan} />
      </div>

      {/* הצגת פרטי המוצר שנסרק */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : product ? (
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">
                  {product.category}
                </span>
                <h2 className="text-2xl font-black mt-2 text-slate-900">{product.name}</h2>
                <p className="text-slate-400 font-mono text-xs font-bold">{product.sku}</p>
              </div>
              <div className="bg-slate-900 text-white p-3 rounded-2xl text-center min-w-[70px]">
                <p className="text-[9px] font-bold opacity-70 uppercase leading-none mb-1">מלאי</p>
                <p className="text-xl font-black leading-none">{product.stock}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                <MapPin className="text-blue-500" size={18} />
                <p className="text-sm font-bold text-slate-700">מיקום: <span className="text-slate-900">{product.location}</span></p>
              </div>

              {/* כפתור פעולה - עדכון מלאי מהיר */}
              <button className="w-full bg-blue-600 text-white h-14 rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                עדכון מלאי מהיר <ChevronLeft size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-10 text-slate-300 italic text-sm font-medium">
            ממתין לסריקה ראשונה...
          </div>
        )}
      </div>
    </div>
  );
}
