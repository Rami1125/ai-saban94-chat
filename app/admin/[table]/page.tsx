"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Search, Edit2, Trash2, 
  RefreshCw, Database, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicModal from "@/components/admin/DynamicModal";

export default function DynamicTablePage() {
  const params = useParams();
  
  // 1. חילוץ שם הטבלה ובדיקת תקינות אגרסיבית
  const tableName = useMemo(() => {
    const table = params?.table;
    const name = Array.isArray(table) ? table[0] : table;
    
    // אם השם ריק, הוא "[table]", או שהוא מכיל סוגריים - הוא לא תקין
    if (!name || name === "[table]" || name.includes("[") || name.includes("]")) {
      return null;
    }
    return name;
  }, [params?.table]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 2. פונקציית Fetch מוגנת לחלוטין
  const fetchData = useCallback(async () => {
    // עצירה מוחלטת אם שם הטבלה לא פוענח עדיין
    if (!tableName) return;

    setLoading(true);
    try {
      const { data: result, error: supabaseError } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setData(result || []);
    } catch (err: any) {
      console.error("Supabase Fetch Blocked:", err.message);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  // 3. הפעלת ה-Sync רק כשהטבלה תקינה
  useEffect(() => {
    if (!tableName) return;

    fetchData();

    const channel = supabase
      .channel(`realtime-${tableName}`)
      .on('postgres_changes', { event: '*', table: tableName, schema: 'public' }, () => {
        fetchData(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, fetchData]);

  // 4. סינון נתונים
  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (val) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // 5. המנעול הוויזואלי - אם הנתיב הוא "[table]", ה-JSX הזה בכלל לא מרנדר קריאות ל-DB
  if (!tableName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-50">
        <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">מזהה נתיב נתונים...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest">
            <Database size={12} />
            <span>Saban Studio</span>
            <ChevronRight size={10} />
            <span className="text-blue-600 italic uppercase">{tableName}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase">
             ניהול <span className="text-blue-600">{tableName.replace(/_/g, ' ')}</span>
          </h1>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="rounded-2xl border-slate-200 font-bold h-12 bg-white" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-2xl gap-2 font-black h-12 shadow-lg shadow-blue-200 text-white px-8">
            <Plus size={18} /> הוסף רשומה
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-50">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="חיפוש מהיר..."
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                {columns.map((col) => (
                  <th key={col} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="p-6 text-center text-[10px] font-black text-slate-400">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-24 text-center text-slate-400 font-bold italic">
                    טוען נתונים...
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/20 transition-colors group">
                    {columns.map((col) => (
                      <td key={col} className="p-6 font-bold text-slate-700">
                        {row[col]?.toString()}
                      </td>
                    ))}
                    <td className="p-6">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                        <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <DynamicModal 
          tableName={tableName} 
          columns={columns} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
}
