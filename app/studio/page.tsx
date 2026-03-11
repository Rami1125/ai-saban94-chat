"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Save, RefreshCw, Database, Terminal, Edit2, Play, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SabanStudioPWA() {
  const [rules, setRules] = useState<any[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<{t: string, m: string, s: string}[]>([]);

  const addLog = (m: string, s: "info" | "success" | "error" = "info") => {
    setLogs(prev => [{ t: new Date().toLocaleTimeString().slice(0, 5), m, s }, ...prev].slice(0, 3));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("saban_unified_knowledge").select("*");
      if (error) throw error;
      setRules(data || []);
      addLog("סנכרון מלא הושלם", "success");
    } catch (err: any) {
      addLog(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="fixed inset-0 bg-[#FBFBFE] flex flex-col overflow-hidden select-none" dir="rtl">
      
      {/* Header - Minimalist PWA Style */}
      <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-lg">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <span className="font-black text-slate-900 text-lg tracking-tight">Studio AI</span>
        </div>
        <button onClick={fetchData} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-slate-100 transition-all">
          <RefreshCw size={18} className={`${loading ? "animate-spin" : "text-slate-400"}`} />
        </button>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-5 space-y-6 pb-24 custom-scrollbar">
        
        {/* Core Brain Section */}
        <section className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            <Database size={12} /> הגדרות מוח מרכזיות
          </label>
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
            <textarea 
              className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500/20 resize-none transition-all"
              placeholder="כתוב את ההנחיות כאן..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <Button className="w-full mt-4 bg-blue-600 h-12 rounded-xl font-black text-white shadow-lg shadow-blue-100">
              <Save size={16} className="ml-2" /> שמור הגדרות
            </Button>
          </div>
        </section>

        {/* Live Knowledge Cards */}
        <section className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
             חוקי בסיס ידע ({rules.length})
          </label>
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-[1.8rem] p-5 border border-slate-100 shadow-sm active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">Logic Case</span>
                <Edit2 size={14} className="text-slate-300" />
              </div>
              <h3 className="text-sm font-black text-slate-800 mb-2 leading-tight italic">
                "{rule.question_trigger || rule.input}"
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-50">
                {rule.ai_response || rule.output}
              </p>
            </div>
          ))}
        </section>

        {/* Floating Mini Console */}
        <div className="bg-slate-900 rounded-[1.8rem] p-4 text-white shadow-xl">
           <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
             <Terminal size={10} /> Live Device Logs
           </div>
           {logs.map((l, i) => (
             <div key={i} className="text-[9px] font-mono flex gap-2">
               <span className="text-slate-600">[{l.t}]</span>
               <span className={l.s === 'error' ? 'text-red-400' : 'text-blue-400'}>{l.m}</span>
             </div>
           ))}
        </div>
      </main>

      {/* Modern Bottom Dock - Fixed */}
      <nav className="h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 shrink-0 flex items-center justify-around px-10 pb-2 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <Zap size={22} fill="currentColor" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Studio</span>
        </button>
        <button className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center -mt-10 shadow-xl shadow-blue-200 border-4 border-[#FBFBFE]">
          <Play size={20} className="text-white ml-1" fill="currentColor" />
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-300">
          <Database size={22} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Memory</span>
        </button>
      </nav>
    </div>
  );
}
