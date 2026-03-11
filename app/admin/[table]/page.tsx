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
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // בדיקת תקינות שם הטבלה
  const tableName = useMemo(() => {
    const t = Array.isArray(params?.table) ? params.table[0] : params?.table;
    return (t && t !== "[table]" && !t.includes("[")) ? t : null;
  }, [params?.table]);

  const fetchData = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setData(result || []);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    if (tableName) {
      fetchData();
      const channel = supabase
        .channel(`sync-${tableName}`)
        .on('postgres_changes', { event: '*', table: tableName, schema: 'public' }, fetchData)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [tableName, fetchData]);

  if (!tableName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <RefreshCw size={24} className="animate-spin text-blue-500/20" />
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">מזהה טבלה...</p>
      </div>
    );
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const filteredData = data.filter(item => 
    Object.values(item).some(v => v?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black mb-2 uppercase tracking-widest">
            <Database size={12} />
            <span>Saban Studio</span>
            <ChevronRight size={10} />
            <span className="text-blue-600 italic uppercase">{tableName}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">ניהול {tableName.replace(/_/g, ' ')}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl h-12 bg-white" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-8 font-black text-white shadow-lg">
            <Plus size={18} /> הוסף רשומה
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
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
                <th className="p-6 text-center text-[10px] font-black text-slate-400">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && data.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="p-24 text-center text-slate-300 italic">טוען נתונים...</td></tr>
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
