"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Download, 
  Filter,
  RefreshCw,
  Database,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicModal from "@/components/admin/DynamicModal";

export default function DynamicTablePage() {
  const params = useParams();
  const tableName = params.table as string;
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. פונקציית טעינת נתונים - עטופה ב-useCallback למניעת רינדור מיותר
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setData(result);
    setLoading(false);
  }, [tableName]);

  // 2. חיבור ל-Realtime וטעינה ראשונית
  useEffect(() => {
    fetchData();

    // האזנה לשינויים בזמן אמת בטבלה הספציפית
    const channel = supabase
      .channel(`realtime-sync-${tableName}`)
      .on('postgres_changes', { event: '*', table: tableName, schema: 'public' }, () => {
        fetchData(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, fetchData]);

  // 3. לוגיקת חיפוש
  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (val) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // חילוץ כותרות עמודות באופן דינמי
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen" dir="rtl">
      
      {/* Breadcrumbs / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">
            <Database size={12} />
            <span>Saban Studio</span>
            <ChevronRight size={12} />
            <span className="text-blue-600">ניהול מאגרים</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
             טבלת <span className="text-blue-600">{tableName.replace(/_/g, ' ')}</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            מציג נתוני אמת ממאגר הנתונים המרכזי של ח.סבן 1994.
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none rounded-2xl border-slate-200 gap-2 font-bold h-12 bg-white" 
            onClick={fetchData}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> רענון
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 rounded-2xl gap-2 font-black h-12 shadow-lg shadow-blue-200 text-white"
          >
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
            placeholder="חפש בכל השדות..."
            className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none p-3.5 text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100 flex justify-center items-center">
            <Filter size={18} />
          </button>
          <button className="flex-1 md:flex-none p-3.5 text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100 flex justify-center items-center">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {columns.map((col) => (
                  <th key={col} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">ניהול</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={32} className="animate-spin text-blue-200" />
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">מושך נתונים מ-Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-24 text-center text-slate-400 font-bold italic">
                    לא נמצאו רשומות תואמות לחיפוש שלך.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-colors group">
                    {columns.map((col) => (
                      <td key={col} className="p-6 font-bold text-slate-700">
                        {/* זיהוי חזותי לסטטוסים, מחירים ותאריכים */}
                        {col.includes('price') || col.includes('total') ? (
                          <span className="text-blue-600 font-black italic">₪{row[col]}</span>
                        ) : col === 'status' || col === 'active' ? (
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                            ['active', 'completed', 'true', 'done'].includes(row[col]?.toString().toLowerCase()) 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-amber-100 text-amber-600'
                          }`}>
                            {row[col]}
                          </span>
                        ) : (
                          <span className="truncate max-w-[180px] block opacity-80 group-hover:opacity-100">
                            {row[col]?.toString()}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="p-6">
                      <div className="flex justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 px-4">
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-black text-slate-400 italic uppercase">
            Total Records: {data.length} | Filtered: {filteredData.length}
          </p>
        </div>
        <div className="flex gap-2 items-center bg-green-500/5 px-4 py-2 rounded-full border border-green-500/10">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase text-green-600">Realtime Sync Active</span>
        </div>
      </div>

      {/* הוספת המודאל הדינמי */}
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
