"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, Save, Box, Users, MessageSquare, 
  Menu, X, RefreshCw, Terminal, Play, Database
} from "lucide-react";

export default function SabanOSPro() {
  const [activeTab, setActiveTab] = useState("studio");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [logs, setLogs] = useState<{t: string, m: string}[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  // --- מחולל צליל אישור (ללא קבצים חיצוניים) ---
  const playConfirmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "square"; // צליל תעשייתי מרובע
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) { console.error("Audio error", e); }
  };

  const addLog = (m: string) => {
    setLogs(prev => [{ t: new Date().toLocaleTimeString().slice(0, 5), m }, ...prev].slice(0, 3));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("saban_unified_knowledge").select("*").limit(10);
      if (error) throw error;
      setRules(data || []);
      addLog("נתונים סונכרנו בהצלחה");
    } catch (err: any) {
      addLog(`שגיאה: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = () => {
    playConfirmSound();
    addLog("הגדרות נשמרו ב-Production");
    // כאן תבוא לוגיקת ה-Update ל-Supabase
  };

  return (
    <div className="fixed inset-0 bg-[#E5E7EB] flex flex-col overflow-hidden font-sans text-right" dir="rtl">
      
      {/* 1. Header - Industrial Style */}
      <header className="h-14 bg-black text-white flex items-center justify-between px-4 shrink-0 shadow-lg">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 active:bg-white/20 transition-all">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 px-2 py-0.5 font-black text-xs">SABAN OS</span>
          <span className="text-[10px] font-bold tracking-widest text-slate-400">V4.0 PRO</span>
        </div>
        <button onClick={fetchData} className="p-2">
          <RefreshCw size={18} className={loading ? "animate-spin text-blue-500" : "text-white"} />
        </button>
      </header>

      {/* 2. Side Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[85%] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="font-black text-xl">ניהול מערכת</span>
              <button onClick={() => setIsMenuOpen(false)}><X size={28} /></button>
            </div>
            <div className="flex-1 p-2 space-y-1">
              {[
                { n: 'Studio AI', i: <Zap size={20}/>, t: 'studio' },
                { n: 'ניהול מלאי', i: <Box size={20}/>, t: 'inventory' },
                { n: 'לקוחות רשומים', i: <Users size={20}/>, t: 'customers' },
                { n: 'צאט יועץ חי', i: <MessageSquare size={20}/>, t: 'chat' }
              ].map((item) => (
                <button 
                  key={item.t}
                  onClick={() => { setActiveTab(item.t); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 p-5 font-black border-2 ${activeTab === item.t ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-transparent text-slate-600'}`}
                >
                  {item.i} {item.n}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 text-center">
              LOGGED IN AS: RAMI MSARWA
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <main className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        
        {activeTab === 'studio' && (
          <>
            {/* System Prompt Card */}
            <div className="bg-white border-2 border-slate-300 p-4 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center gap-2 mb-3 text-slate-500">
                <Database size={14} />
                <span className="text-[10px] font-black uppercase tracking-tighter">AI Core Instructions</span>
              </div>
              <textarea 
                className="w-full h-40 bg-slate-50 border border-slate-200 p-3 text-sm font-bold outline-none focus:border-blue-600 transition-all resize-none"
                placeholder="הכנס כאן את חוקי ה-AI..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <button 
                onClick={handleSave}
                className="w-full mt-3 bg-blue-600 text-white h-14 font-black text-lg shadow-[4px_4px_0px_#1e40af] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                שמור הגדרות (SAVE)
              </button>
            </div>

            {/* Knowledge Table */}
            <div className="bg-white border-2 border-slate-300 shadow-[4px_4px_0px_#000]">
              <div className="p-3 bg-slate-900 text-white text-[10px] font-black flex justify-between">
                <span>DATABASE: KNOWLEDGE_BASE</span>
                <span className="text-blue-400">{rules.length} ITEMS</span>
              </div>
              <div className="divide-y divide-slate-200">
                {rules.map((r, i) => (
                  <div key={i} className="p-3 hover:bg-blue-50">
                    <div className="text-[10px] font-black text-blue-600 mb-1">RULE #{i+1}</div>
                    <div className="text-xs font-bold text-slate-900 leading-tight mb-2 italic">"{r.question_trigger || r.input}"</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2 border border-slate-100 uppercase">
                      {r.ai_response || r.output}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'studio' && (
          <div className="bg-white border-2 border-slate-300 p-10 text-center shadow-[4px_4px_0px_#000]">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <Database size={48} className="text-slate-200" />
              <span className="font-black text-slate-400 uppercase">מערכת {activeTab} בטעינה...</span>
            </div>
          </div>
        )}

        {/* Industrial Logger */}
        <div className="bg-slate-900 p-4 shadow-[4px_4px_0px_#334155]">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">
            <Terminal size={12} /> System_Logs
          </div>
          <div className="space-y-1">
            {logs.map((l, i) => (
              <div key={i} className="text-[10px] font-mono flex gap-2">
                <span className="text-blue-500">[{l.t}]</span>
                <span className="text-slate-300">{l.m}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 4. Bottom Dock - Square Buttons */}
      <nav className="h-16 bg-white border-t-4 border-black grid grid-cols-4 shrink-0">
        {[
          { t: 'studio', i: <Zap size={20} fill={activeTab === 'studio' ? 'currentColor' : 'none'}/>, l: 'STUDIO' },
          { t: 'inventory', i: <Box size={20}/>, l: 'מלאי' },
          { t: 'customers', i: <Users size={20}/>, l: 'לקוחות' },
          { t: 'chat', i: <MessageSquare size={20}/>, l: 'צאט' }
        ].map((item) => (
          <button 
            key={item.t}
            onClick={() => setActiveTab(item.t)}
            className={`flex flex-col items-center justify-center border-l border-slate-200 transition-all ${activeTab === item.t ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            {item.i}
            <span className="text-[8px] font-black mt-1">{item.l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
