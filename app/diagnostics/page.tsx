"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Terminal, AlertTriangle, CheckCircle } from "lucide-react";

export default function DiagnosticsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    fetchLogs();
    const channel = supabase.channel('realtime_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saban_debug_logs' }, 
      (payload) => setLogs(prev => [payload.new, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase.from('saban_debug_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setLogs(data || []);
  };

  return (
    <div className="min-h-screen bg-black text-emerald-400 p-8 font-mono" dir="rtl">
      <div className="flex items-center gap-4 mb-8 border-b border-emerald-900 pb-4">
        <Activity className="animate-pulse text-emerald-500" size={32} />
        <h1 className="text-3xl font-bold tracking-tighter">SABAN OS // NERVE CENTER</h1>
        <Badge className="bg-emerald-900 text-emerald-400 border-emerald-500">LIVE STREAMING</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {logs.map((log) => (
          <Card key={log.id} className="bg-slate-900/50 border-emerald-900/50 p-4 hover:border-emerald-500 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <span className="text-[10px] text-emerald-700">{new Date(log.created_at).toLocaleTimeString()}</span>
                <Badge variant={log.step.includes('ERROR') || log.step.includes('CRASH') ? 'destructive' : 'outline'} 
                       className="font-bold border-emerald-800">
                  {log.step}
                </Badge>
                <span className="text-xs text-slate-400 italic">+{log.duration}ms</span>
              </div>
            </div>
            <pre className="mt-3 text-[12px] bg-black/50 p-3 rounded border border-emerald-900/30 overflow-x-auto">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
