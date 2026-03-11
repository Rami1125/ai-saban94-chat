"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Terminal, Database, Play, Save, Edit3, Trash2, 
  RefreshCw, ShieldCheck, Zap, MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SabanAIStudio() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<{t: string, m: string, s: string}[]>([]);
  const [simInput, setSimInput] = useState("");
  const [simOutput, setSimOutput] = useState("");

  // 1. מלשינון (Logger)
  const addLog = (m: string, s: "info" | "success" | "error" = "info") => {
    setLogs(prev => [{ t: new Date().toLocaleTimeString(), m, s }, ...prev].slice(0, 5));
  };

  // 2. משיכת חוקי מערכת (System Rules / Knowledge)
  const fetchRules = useCallback(async () => {
    setLoading(true);
    addLog("מתחבר ל-saban_unified_knowledge...", "info");
    try {
      const { data, error } = await supabase
        .from("saban_unified_knowledge")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRules(data || []);
      addLog("חוקי ה-AI נטענו בהצלחה", "success");
    } catch (err: any) {
      addLog(`שגיאה: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // 3. מחיקת חוק
  const deleteRule = async (id: string) => {
    if (!confirm("למחוק את החוק הזה מהמוח של ה-AI?")) return;
    try {
      const { error } = await supabase.from("saban_unified_knowledge").delete().eq("id", id);
      if (error) throw error;
      addLog("חוק נמחק מהמערכת", "success");
      fetchRules();
    } catch (err: any) {
      addLog(`שגיאת מחיקה: ${err.message}`, "error");
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
            <Zap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Saban AI Studio</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Knowledge & Logic Manager</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchRules} variant="outline" className="rounded-xl border-slate-200 font-bold h-11">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-11 font-black shadow-lg shadow-blue-200">
            + חוק חדש
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* טבלת חוקים (שאלה/תשובה) */}
        <div className="col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h2 className="font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-blue-500" size={18} />
                טבלת חוקים ומענה (System Logic)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">שאלה / טריגר</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">מענה AI (החוק)</th>
                    <th className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-5 font-bold text-slate-700 text-sm italic">"{rule.question_trigger || rule.input}"</td>
                      <td className="p-5 text-slate-600 text-sm leading-relaxed">{rule.ai_response || rule.output}</td>
                      <td className="p-5">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg shadow-sm transition-all"><Edit3 size={16} /></button>
                          <button onClick={() => deleteRule(rule.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* סימולטור ומלשינון */}
        <div className="col-span-4 space-y-6">
          
          {/* Real-time Simulator */}
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl flex flex-col min-h-[350px]">
            <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6">
              <Play size={12} fill="currentColor" /> Live Simulator
            </div>
            <div className="flex-1 space-y-4 mb-6 overflow-y-auto custom-scrollbar p-2">
              <div className="text-xs text-slate-500 font-mono italic">
                {`> Saban_Engine_v4.2 initialized...`}
              </div>
              {simOutput && (
                <div className="bg-blue-600/10 border-r-4 border-blue-500 p-4 rounded-xl animate-in slide-in-from-right-2">
                  <p className="text-xs font-black text-blue-400 mb-2">AI RESPONSE:</p>
                  <p className="text-sm font-bold leading-relaxed">{simOutput}</p>
                </div>
              )}
            </div>
            <div className="relative">
              <input 
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSimOutput("מעבד תשובה לפי חוקי ה-Unified Knowledge...");
                    addLog(`סימולציה נשלחה: ${simInput}`, "info");
                  }
                }}
                placeholder="בדוק חוק מול ה-AI..."
                className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
              <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            </div>
          </div>

          {/* מלשינון (Logger) */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Terminal size={14} className="text-orange-500" /> מלשינון אירועים
            </h2>
            <div className="space-y-3">
              {logs.map((l, i) => (
                <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${l.s === 'error' ? 'bg-red-500' : l.s === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 leading-tight">{l.m}</p>
                    <span className="text-[8px] font-black text-slate-300 uppercase">{l.t}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
