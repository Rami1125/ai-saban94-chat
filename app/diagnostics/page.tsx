"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Terminal, 
  AlertOctagon, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Wifi, 
  RefreshCcw 
} from "lucide-react";

export default function ProfessionalDiagnostics() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);
  const supabase = getSupabase();

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('saban_debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    setLogs(data || []);
  };

  const clearLogs = async () => {
    if (confirm("לנקות את כל היסטוריית המלשינון?")) {
      await supabase.from('saban_debug_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      fetchLogs();
    }
  };

  useEffect(() => {
    fetchLogs();
    if (!isLive) return;

    const channel = supabase.channel('pro_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saban_debug_logs' }, 
      (payload) => {
        setLogs(prev => [payload.new, ...prev].slice(0, 30));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLive]);

  const getStepIcon = (step: string) => {
    if (step.includes('ERROR') || step.includes('FATAL')) return <AlertOctagon className="text-red-500" size={18} />;
    if (step.includes('SUCCESS') || step.includes('OK')) return <CheckCircle2 className="text-emerald-500" size={18} />;
    if (step.includes('AI')) return <Cpu className="text-blue-400" size={18} />;
    if (step.includes('DB') || step.includes('DISPATCH')) return <Database className="text-amber-400" size={18} />;
    return <Terminal className="text-slate-400" size={18} />;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 p-4 md:p-10 font-mono selection:bg-emerald-500/30" dir="rtl">
      {/* Header המערכת */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Activity className="text-emerald-500 animate-[pulse_2s_infinite]" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">SABAN OS // חוקר מלשינון</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">מערכת אבחון צנורות AI ו-Database</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
              isLive ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`} />
            {isLive ? 'ניטור חי' : 'ניטור מושהה'}
          </button>
          <button onClick={fetchLogs} className="p-2 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors">
            <RefreshCcw size={18} />
          </button>
          <button onClick={clearLogs} className="px-4 py-2 rounded-lg text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
            ניקוי מכ"ם
          </button>
        </div>
      </div>

      {/* רשת הלוגים */}
      <div className="max-w-6xl mx-auto space-y-3">
        {logs.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-900 rounded-3xl">
            <Wifi className="mx-auto mb-4 text-slate-700" size={48} />
            <p className="text-slate-500">ממתין לתקשורת בצינורות...</p>
          </div>
        )}

        {logs.map((log) => (
          <Card key={log.id} className="bg-[#0a0a0a] border-slate-800/60 overflow-hidden hover:border-slate-700 transition-all group">
            <div className="flex items-stretch">
              {/* צד צבעוני לפי סטטוס */}
              <div className={`w-1 ${
                log.step.includes('ERROR') ? 'bg-red-600' : 
                log.step.includes('SUCCESS') ? 'bg-emerald-600' : 'bg-blue-600'
              }`} />
              
              <div className="flex-1 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 bg-white/5 rounded">
                      {getStepIcon(log.step)}
                    </span>
                    <h3 className="font-bold text-sm text-slate-200 tracking-wide uppercase">{log.step}</h3>
                    <Badge variant="outline" className="text-[10px] border-slate-800 text-slate-500 font-mono">
                      {log.log_id?.substring(0, 8)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      ⏱️ {log.duration}ms
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {new Date(log.created_at).toLocaleTimeString('he-IL')}
                    </span>
                  </div>
                </div>

                {/* תצוגת הנתונים (Payload) */}
                <div className="relative group/code">
                  <div className="absolute top-2 left-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px]">DATA RAW</Badge>
                  </div>
                  <pre className="bg-[#020202] p-4 rounded-xl text-xs leading-relaxed overflow-x-auto border border-white/5 text-slate-400 scrollbar-hide">
                    {typeof log.payload === 'object' 
                      ? JSON.stringify(log.payload, null, 2) 
                      : log.payload}
                  </pre>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
