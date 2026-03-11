"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Search, Edit2, Trash2, 
  RefreshCw, Database, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicModal from "@/components/admin/DynamicModal";

// --- רכיב התוכן: רץ רק כשיש tableName אמיתי ---
function TableContent({ tableName }: { tableName: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(result || []);
    } catch (err: any) {
      // כאן זה לא אמור להגיע ל-404 כיtableName כבר מאומת
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`sync-${tableName}`)
      .on('postgres_changes', { event: '*', table: tableName, schema: 'public' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableName, fetchData]);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const filteredData = data.filter(item => 
    Object.values(item).some(v => v?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <Button variant="outline" className="rounded-2xl border-slate-200 h-12 bg-white" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 rounded-2xl h-12 px-8 font-black text-white shadow-lg shadow-blue-200">
            <Plus size={18} /> הוסף רשומה
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-50">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="חיפוש מהיר..."
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50">
                {columns.map(col => (
                  <th key={col} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{col}</th>
                ))}
                <th className="p-6 text-center text-[10px] font-black text-slate-400">ניהול</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="p-24 text-center text-slate-300 italic">טוען...</td></tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/20 group transition-colors">
                    {columns.map(col => <td key={col} className="p-6 font-bold text-slate-700">{row[col]?.toString()}</td>)}
                    <td className="p-6 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <DynamicModal tableName={tableName} columns={columns} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />}
    </div>
  );
}

// --- רכיב הדף הראשי: משמש כפילטר "ברזל" ---
export default function DynamicTablePage() {
  const params = useParams();
  
  const tableName = useMemo(() => {
    const table = params?.table;
    const name = Array.isArray(table) ? table[0] : table;
    
    // בדיקה מחמירה: רק אם זה שם טבלה אמיתי (בלי סוגריים)
    if (!name || name === "[table]" || name.includes("[") || name.includes("]")) {
      return null;
    }
    return name;
  }, [params?.table]);

  // אם הנתיב הוא "[table]", אנחנו לא מרנדרים את TableContent 
  // וככה Supabase SDK בכלל לא יודע שהוא צריך לבצע קריאה.
  if (!tableName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <RefreshCw size={24} className="animate-spin text-slate-200" />
      </div>
    );
  }

  return <TableContent tableName={tableName} />;
}
