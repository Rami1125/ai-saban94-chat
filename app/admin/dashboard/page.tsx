"use client";

import { useEffect, useState } from "react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, limitToLast, query } from "firebase/database";
import { 
  Activity, 
  Key, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Database,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuotaLog {
  key_index: number;
  model: string;
  status: string;
  timestamp: number;
}

export default function AdminDashboard() {
  const [logs, setLogs] = useState<QuotaLog[]>([]);
  const [stats, setStats] = useState({
    success: 0,
    errors: 0,
    activeKey: 1,
    lastModel: ""
  });

  useEffect(() => {
    // האזנה ל-20 הלוגים האחרונים בזמן אמת
    const logsRef = query(ref(rtdb, 'saban94/dashboard/quota_logs'), limitToLast(20));
    
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sortedLogs = Object.values(data) as QuotaLog[];
        sortedLogs.sort((a, b) => b.timestamp - a.timestamp);
        
        setLogs(sortedLogs);

        // חישוב סטטיסטיקה מהירה
        const successCount = sortedLogs.filter(l => l.status === "SUCCESS").length;
        const errorCount = sortedLogs.filter(l => l.status === "QUOTA_EXCEEDED").length;
        
        setStats({
          success: successCount,
          errors: errorCount,
          activeKey: sortedLogs[0]?.key_index || 1,
          lastModel: sortedLogs[0]?.model || "N/A"
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen font-sans" dir="rtl">
      
      {/* Header */}
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Activity className="text-blue-600" size={32} />
            SABAN OS - מרכז בקרה
          </h1>
          <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">
            מערכת ניטור רוטציה וביצועי AI בזמן אמת
          </p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-700 text-xs font-black uppercase">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="מפתח פעיל" 
          value={`KEY #${stats.activeKey}`} 
          icon={<Key className="text-amber-500" />}
          desc="מתוך בריכת המפתחות"
        />
        <StatCard 
          title="מודל אחרון" 
          value={stats.lastModel.replace('gemini-', '')} 
          icon={<Cpu className="text-blue-500" />}
          desc="ניצול משאבים אופטימלי"
        />
        <StatCard 
          title="בקשות מוצלחות" 
          value={stats.success} 
          icon={<CheckCircle2 className="text-green-500" />}
          desc="ב-20 פעולות אחרונות"
        />
        <StatCard 
          title="שגיאות מכסה" 
          value={stats.errors} 
          icon={<AlertTriangle className="text-red-500" />}
          desc="מפתחות ברוטציה"
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Logs Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              לוג פעולות אחרון
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-6">זמן</th>
                  <th className="p-6">מפתח</th>
                  <th className="p-6">מודל</th>
                  <th className="p-6">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 text-slate-500 text-xs font-bold italic">
                      {new Date(log.timestamp).toLocaleTimeString('he-IL')}
                    </td>
                    <td className="p-6 font-black text-slate-700">KEY {log.key_index}</td>
                    <td className="p-6 font-bold text-blue-600">{log.model}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        log.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-400">Security & DNA</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">סטטוס RLS:</span>
                  <span className="text-xs font-black text-green-400">פעיל</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">סנכרון Supabase:</span>
                  <span className="text-xs font-black text-blue-400">Live</span>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    המערכת מבצעת רוטציה אוטומטית בין המפתחות כדי להבטיח זמינות של 99.9% עבור לקוחות ח.סבן.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Database size={28} />
            </div>
            <h4 className="font-black text-slate-900">גיבוי נתונים</h4>
            <p className="text-xs font-bold text-slate-500 mt-2 mb-6">כל השיחות והפעולות מגובות ב-Firebase Realtime Database</p>
            <button className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition-all">
              הורד דוח שבועי
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// רכיב עזר לכרטיסי סטטיסטיקה
function StatCard({ title, value, icon, desc }: { title: string, value: string | number, icon: any, desc: string }) {
  return (
    <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-white overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
        </div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-[10px] font-bold text-slate-500 mt-2 italic">{desc}</p>
      </CardContent>
    </Card>
  );
}
