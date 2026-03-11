"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Search, Edit2, Trash2, Download, Filter,
  RefreshCw, Database, ChevronRight, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicModal from "@/components/admin/DynamicModal";

export default function DynamicTablePage() {
  const params = useParams();
  
  // חילוץ שם הטבלה - המרת ה-Params לטקסט נקי
  const rawTable = params?.table;
  const tableName = Array.isArray(rawTable) ? rawTable[0] : rawTable;
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. פונקציית טעינת נתונים עם חסימת 404
  const fetchData = useCallback(async () => {
    // בדיקה קריטית: אם השם הוא "[table]" או ריק - עוצרים מיד!
    if (!tableName || tableName === "[table]" || tableName.includes("[") ) {
      console.log("סנכרון נעצר: שם טבלה לא תקין עדיין");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: supabaseError } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setData(result || []);
    } catch (err: any) {
      console.error("Supabase Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  // 2. אפקט טעינה
  useEffect(() => {
    // רק אם יש שם טבלה אמיתי (למשל 'inventory' ולא '[table]')
    if (tableName && tableName !== "[table]" && !tableName.includes("[")) {
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
    }
  }, [tableName, fetchData]);

  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (val) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // מצב טעינה ראשוני כשעוד אין tableName
  if (!tableName || tableName === "[table]") {
    return (
      <div className="p-24 text-center flex flex-col items-center justify-center min-h-screen">
         <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">מזהה נתיב דאטה...</p>
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
            <span className="text-blue-600 italic">Database Management</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
             ניהול <span className="text-blue-600">{tableName.replace(/_/g, ' ')}</span>
          </h1>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none rounded-2xl border-slate-200 font-bold h-12 bg-white" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 rounded-2xl gap-2 font-black h-12 shadow-lg shadow-blue-200 text-white px-8">
            <Plus size={18} /> הוסף רשומה
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="חיפוש מהיר..."
            className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {columns.map((col) => (
                  <th key={col} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="p-6 text-center text-[10px] font-black text-slate-400">ניהול</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-24 text-center text-slate-400 italic font-bold">
                    טוען נתונים מהשרת...
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-colors group">
                    {columns.map((col) => (
                      <td key={col} className="p-6 font-bold text-slate-700">
                        {row[col]?.toString()}
                      </td>
                    ))}
                    <td className="p-6">
                      <div className="flex justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
