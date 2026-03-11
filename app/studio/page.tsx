"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, Save, Edit3, Trash2, RefreshCw, 
  Play, Terminal, ShieldAlert, Database, // וידאתי שזה כאן
  MessageSquare, ChevronDown, Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SabanAIStudioAdmin() {
  const [rules, setRules] = useState<any[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<{t: string, m: string, s: string}[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const addLog = (m: string, s: "info" | "success" | "error" = "info") => {
    setLogs(prev => [{ t: new Date().toLocaleTimeString().slice(0, 5), m, s }, ...prev].slice(0, 3));
  };

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saban_unified_knowledge")
        .select("*");
      
      if (error) throw error;
      setRules(data || []);
      addLog("סנכרון נתונים הצליח", "success");
    } catch (err: any) {
      addLog(`שגיאת DB: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchRules(); 
  }, [fetchRules]);

  return (
    <div className="min-h-screen bg-white p-4 space-y-6 text-right" dir="rtl">
      {/* כותרת */}
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-2">
           <Database className="text-blue-600" size={24} />
           <h1 className="text-xl font-black">ניהול חוקי AI</h1>
        </div>
        <Button onClick={fetchRules} variant="ghost" size="sm">
          <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
        </Button>
      </div>

      {/* אזור ה-Prompt המרכזי */}
      <div className="bg-slate-50 p-4 border-2 border-black shadow-[4px_4px_0px_#000]">
        <h2 className="text-sm font-black mb-2 flex items-center gap-2">
          <ShieldAlert size={16} /> הנחיית מערכת (System)
        </h2>
        <textarea 
          className="w-full h-32 p-3 border-2 border-slate-200 font-bold text-sm outline-none focus:border-blue-600"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
        <Button className="w-full mt-3 bg-black text-white font-black rounded-none h-12">
          שמור הגדרות מוח
        </Button>
      </div>

      {/* רשימת חוקים */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest">חוקים פעילים ({rules.length})</h3>
        {rules.map((rule) => (
          <div key={rule.id} className="border-2 border-slate-100 p-4 relative bg-white">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5">RULE_ID: {rule.id.slice(0,5)}</span>
              <div className="flex gap-2 text-slate-300">
                <Edit3 size={16} />
                <Trash2 size={16} />
              </div>
            </div>
            <p className="text-sm font-bold mb-2 tracking-tight italic">"{rule.question_trigger || rule.input}"</p>
            <div className="bg-slate-50 p-2 text-xs text-slate-600 border-r-4 border-blue-600">
              {rule.ai_response || rule.output}
            </div>
          </div>
        ))}
      </div>

      {/* לוג מערכת */}
      <div className="bg-black p-3 font-mono text-[10px] text-green-400">
        <div className="flex items-center gap-2 mb-2 border-b border-green-900 pb-1">
          <Terminal size={12} /> <span>SYSTEM_READY</span>
        </div>
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="opacity-50">[{log.t}]</span>
            <span>{log.m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
