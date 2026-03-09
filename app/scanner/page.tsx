"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Scanner from "@/components/logistics/Scanner";
import { Package, Search, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ScannerPage() {
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (code: string) => {
    if (loading) return;
    setLoading(true);
    
    try {
      // חיפוש המוצר לפי הברקוד (SKU) שנסרק
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', code)
        .single();

      if (error || !data) {
        toast.error(`ברקוד ${code} לא נמצא במערכת`);
        setScannedItem(null);
      } else {
        setScannedItem(data);
        toast.success("מוצר זוהה בהצלחה");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20" dir="rtl">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black">מסופון סריקה<span className="text-blue-600">.</span></h1>
        <div className="bg-white p-2 rounded-xl shadow-sm border">
          <Package className="text-slate-400" size={20} />
        </div>
      </header>

      {/* אזור המצלמה */}
      <div className="mb-8">
        <Scanner onScan={handleScan} />
        <p className="text-center text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
          מצלמה פעילה - כוון לברקוד
        </p>
      </div>

      {/* תוצאת סריקה - כרטיס פרימיום */}
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : scannedItem ? (
        <div className="bg-white rounded-[2rem] p-6 border shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase">
                {scannedItem.category || "מוצר"}
              </span>
              <h2 className="text-xl font-black mt-2 leading-tight">{scannedItem.name}</h2>
              <p className="text-slate-400 font-mono text-xs">{scannedItem.sku}</p>
            </div>
            {scannedItem.hex && (
              <div className="w-12 h-12 rounded-2xl shadow-inner border-2 border-white" style={{ backgroundColor: scannedItem.hex }} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">מלאי זמין</p>
              <p className="text-lg font-black">{scannedItem.stock || 0}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">מיקום</p>
              <p className="text-lg font-black">{scannedItem.location || "א' - 1"}</p>
            </div>
          </div>
          
          <button className="w-full mt-4 bg-slate-900 text-white h-12 rounded-2xl font-black hover:bg-blue-600 transition-colors">
            עדכון מלאי / ליקוט
          </button>
        </div>
      ) : (
        <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300">
          <Search className="mx-auto mb-2 opacity-20" size={40} />
          <p className="text-sm font-bold italic">ממתין לסריקת ברקוד...</p>
        </div>
      )}
    </div>
  );
}
