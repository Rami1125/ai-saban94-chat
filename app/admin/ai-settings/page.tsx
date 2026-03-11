"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ייבוא מפורט וברור למנוע שגיאות Prerender
import { 
  Database, 
  Search, 
  Zap, 
  Save, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Play, 
  Terminal, 
  ShieldAlert, 
  MessageSquare, 
  ChevronDown, 
  Check,
  Plus,
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function SabanAIStudioAdmin() {

export default function SabanAIStudioAdmin() {
  const [rules, setRules] = useState<any[]>([]);
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
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRules(data || []);
      addLog("סנכרון נתונים הושלם", "success");
    } catch (err: any) {
      addLog(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleQuickSave = async (id: string) => {
    addLog("מעדכן חוק...", "info");
    const { error } = await supabase
      .from("saban_unified_knowledge")
      .update({ ai_response: editValue })
      .eq("id", id);
    
    if (!error) {
      addLog("החוק עודכן בהצלחה", "success");
      setEditingId(null);
      fetchRules();
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20 font-sans antialiased" dir="rtl">
      
      {/* Mobile Top Bar - Fixed */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Zap className="text-white" size={20} fill="currentColor" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Studio</h1>
        </div>
        <button onClick={fetchRules} className="p-2 text-slate-500 active:scale-95 transition-transform">
          <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <main className="p-4 space-y-4">
        
        {/* Quick Simulator - Floating Card style */}
        <div className="bg-slate-900 rounded-[2rem] p-5 text-white shadow-xl overflow-hidden relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Simulator</span>
          </div>
          <div className="h-20 overflow-y-auto text-sm font-bold text-blue-100 mb-4 px-2">
            מעבד נתונים מ-Note 25... ה-AI מוכן למענה לפי חוקי סבן.
          </div>
          <div className="relative">
            <input 
              placeholder="שאל את המוח..."
              className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 pr-12 text-sm focus:bg-white/20 outline-none transition-all placeholder:text-white/30"
            />
            <Play className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} fill="currentColor" />
          </div>
        </div>

        {/* Knowledge Base Table - Card Layout for Mobile */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Database size={14} /> חוקי מערכת ({rules.length})
            </h2>
            <Button variant="ghost" className="text-blue-600 font-bold text-xs">+ הוסף</Button>
          </div>

          {rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm active:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md">TRIGGER</span>
                <MoreVertical size={16} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-3 leading-snug">
                {rule.question_trigger || rule.input}
              </p>
              
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase">AI Logic</span>
                  {editingId !== rule.id && (
                    <button onClick={() => { setEditingId(rule.id); setEditValue(rule.ai_response || rule.output); }} className="text-blue-500">
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
                
                {editingId === rule.id ? (
                  <div className="space-y-2">
                    <textarea 
                      className="w-full bg-white border border-blue-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => handleQuickSave(rule.id)} className="flex-1 bg-green-600 h-8 rounded-lg text-[10px] font-black text-white">שמור</Button>
                      <Button onClick={() => setEditingId(null)} variant="ghost" className="flex-1 h-8 rounded-lg text-[10px] font-black text-slate-400">ביטול</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {rule.ai_response || rule.output}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Logger - Bottom Floating */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Terminal size={12} className="text-orange-500" /> Device Logs
          </h3>
          <div className="space-y-2">
            {logs.map((l, i) => (
              <div key={i} className="flex items-center gap-3 text-[10px] font-bold">
                <span className="text-slate-300">[{l.t}]</span>
                <span className={l.s === 'error' ? 'text-red-500' : l.s === 'success' ? 'text-green-600' : 'text-blue-600'}>{l.m}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Navigation Dock */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 p-3 px-8 flex justify-between items-center z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <Zap size={20} fill="currentColor" />
          <span className="text-[9px] font-black uppercase">Studio</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-300">
          <Database size={20} />
          <span className="text-[9px] font-black uppercase">Data</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-300">
          <Search size={20} />
          <span className="text-[9px] font-black uppercase">Search</span>
        </button>
      </div>
    </div>
  );
}
