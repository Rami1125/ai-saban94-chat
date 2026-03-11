"use client";

import { useEffect, useState } from "react";
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
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DynamicTablePage() {
  const params = useParams();
  const tableName = params.table as string;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. פונקציית טעינת נתונים
  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setData(result);
    setLoading(false);
  };

  // 2. חיבור ל-Realtime וטעינה ראשונית
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`realtime-${tableName}`)
      .on('postgres_changes', { event: '*', table: tableName, schema: 'public' }, () => {
        fetchData(); // רענון אוטומטי בכל שינוי ב-DB
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  // 3. סינון נתונים לפי חיפוש
  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (val) => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // חילוץ כותרות העמודות מהנתונים
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            ניהול מאגר: <span className="text-blue-600">{tableName.replace('_', ' ')}</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            צפייה, עריכה וניהול נתונים בזמן אמת מסונכרן ל-Supabase.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 gap-2 font-bold" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> רענון
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 font-bold shadow-lg shadow-blue-200">
            <Plus size={18} /> הוסף רשומה
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="חפש בכל השדות..."
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
            <Filter size={18} />
          </button>
          <button className="p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {columns.map((col) => (
                  <th key={col} className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {col.replace('_', ' ')}
                  </th>
                ))}
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-20 text-center text-slate-400 font-bold">
                    טוען נתונים מהמאגר...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-20 text-center text-slate-400 font-bold">
                    לא נמצאו רשומות תואמות.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                    {columns.map((col) => (
                      <td key={col} className="p-5 font-bold text-slate-700">
                        {/* טיפול ויזואלי בסטטוסים או מחירים */}
                        {col.includes('price') || col.includes('amount') ? (
                          <span className="text-blue-600 font-black italic">₪{row[col]}</span>
                        ) : col === 'status' ? (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                            row[col] === 'active' || row[col] === 'completed' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-amber-100 text-amber-600'
                          }`}>
                            {row[col]}
                          </span>
                        ) : (
                          <span className="truncate max-w-[200px] block">{row[col]?.toString()}</span>
                        )}
                      </td>
                    ))}
                    <td className="p-5">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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

      {/* Footer Info */}
      <div className="mt-6 flex justify-between items-center px-4">
        <p className="text-xs font-bold text-slate-400 italic">
          מציג {filteredData.length} רשומות מתוך {data.length} סה"כ
        </p>
        <div className="flex gap-2 items-center text-green-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase">Database Connected</span>
        </div>
      </div>
    </div>
  );
}
