"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Terminal, Database, Play, Save, 
  Search, ShieldAlert, Activity, Cpu 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SabanAIStudio() {
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);
  const [dbData, setDbData] = useState<any[]>([]);
  const [tableName, setTableName] = useState("customers"); // ברירת מחדל
  const [simulationMsg, setSimulationMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 1. "המלשינון" - פונקציית לוגים פנימית
  const addLog = (msg: string, type: "info" | "success" | "error" = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 5));
  };

  // 2. משיכת נתונים מ-Supabase (טבלה מתחת להנחיות)
  const fetchTableData = useCallback(async () => {
    addLog(`מושך נתונים מטבלת ${tableName}...`);
    try {
      const { data, error } = await supabase.from(tableName).select("*").limit(5);
      if (error) throw error;
      setDbData(data || []);
      addLog("נתוני DB עודכנו בהצלחה", "success");
    } catch (err: any) {
      addLog(`שגיאת DB: ${err.message}`, "error");
    }
  }, [tableName]);

  useEffect(() => { fetchTableData(); }, [fetchTableData]);

  // 3. שמירת הגדרות ועדכון סימולטור
  const handleSave = async () => {
    setIsSaving(true);
    addLog("שומר הגדרות מוח חדשות...", "info");
    
    // כאן תבוא הלוגיקה של השמירה ל-DB שלך
    setTimeout(() => {
      addLog("הגדרות המוח עודכנו ב-Production", "success");
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
            <Cpu className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Saban AI Studio</h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !prompt}
          className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-8 h-12 font-black shadow-lg"
        >
          <Save size={18} className="ml-2" />
          {isSaving ? "שומר..." : "שמור הגדרות מוח"}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* צד ימין: הגדרות ומלשינון */}
        <div className="col-span-8 space-y-6">
          
          {/* עורך הנחיות */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <ShieldAlert size={20} className="text-blue-500" />
              הנחיות מערכת (System Prompt)
            </h2>
            <textarea 
              className="w-full h-48 p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="הכנס את המוח של ה-AI כאן..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* הטבלה מתחת להנחיות (Live Data) */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Database size={20} className="text-blue-500" />
                נתונים חיים מ-Supabase
              </h2>
              <select 
                className="bg-slate-50 border-none rounded-lg text-xs font-bold p-2"
                onChange={(e) => setTableName(e.target.value)}
              >
                <option value="customers">לקוחות</option>
                <option value="inventory">מלאי</option>
                <option value="orders">הזמנות</option>
              </select>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-50">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase">
                  <tr>
                    {dbData[0] && Object.keys(dbData[0]).map(k => <th key={k} className="p-3">{k}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dbData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {Object.values(row).map((v: any, j) => <td key={j} className="p-3 font-bold">{v?.toString()}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* צד שמאל: סימולטור ומלשינון */}
        <div className="col-span-4 space-y-6">
          
          {/* סימולטור אונליין */}
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl min-h-[300px] flex flex-col">
            <h2 className="text-blue-400 font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Play size={14} /> Real-time Simulator
            </h2>
            <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[200px] p-2 bg-slate-800/50 rounded-xl">
              <div className="text-xs italic text-slate-400 tracking-tighter">
                [מערכת]: טוען מוח מסוג {prompt ? "מותאם אישית" : "ברירת מחדל"}...
              </div>
              {simulationMsg && (
                <div className="bg-blue-600/20 p-3 rounded-lg border-r-2 border-blue-500 text-sm">
                  <span className="text-blue-400 font-black block mb-1">AI Assistant:</span>
                  {simulationMsg}
                </div>
              )}
            </div>
            <input 
              type="text"
              placeholder="שלח הודעה לבדיקה..."
              className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSimulationMsg("אני מעבד את הבקשה לפי ה'מוח' החדש שלך...");
                  addLog(`סימולציה: הודעה נשלחה`, "info");
                }
              }}
            />
          </div>

          {/* המלשינון (Logger) */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <Terminal size={20} className="text-orange-500" />
              מלשינון (Logs)
            </h2>
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="text-[10px] font-mono p-2 rounded-lg bg-slate-50 border-r-2 border-slate-200">
                  <span className="text-slate-400">[{log.time}]</span>{" "}
                  <span className={log.type === "error" ? "text-red-500" : log.type === "success" ? "text-green-600" : "text-blue-600"}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
