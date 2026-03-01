"use client";

import React, { useEffect, useState } from "react";
import { 
  MessageSquare, Package, AlertTriangle, Activity, 
  RefreshCw, Sparkles, Database, ExternalLink, Loader2 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function SabanAdminDashboard() {
  const [stats, setStats] = useState({ totalChats: 0, totalProducts: 0, missingMedia: 0, loading: true });
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);

  const fetchData = async () => {
    setStats(prev => ({ ...prev, loading: true }));
    const { count: cCount } = await supabase.from('chat_history').select('*', { count: 'exact', head: true });
    const { count: pCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true });
    const { count: mCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true }).or('image_url.is.null,image_url.eq.""');
    const { data: chats } = await supabase.from('chat_history').select('*').order('created_at', { ascending: false }).limit(5);

    setStats({ totalChats: cCount || 0, totalProducts: pCount || 0, missingMedia: mCount || 0, loading: false });
    setRecentChats(chats || []);
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const res = await fetch('/api/enrich-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`עודכנו ${data.updated?.length || 0} מוצרים בהצלחה!`);
        fetchData();
      } else {
        alert("שגיאת סוכן: " + data.error);
      }
    } catch (e) {
      alert("תקשורת נכשלה");
    } finally {
      setIsEnriching(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 space-y-10 text-right" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-blue-500">Saban Admin</h1>
        <button onClick={fetchData} className="bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-all">
          <RefreshCw size={20} className={stats.loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="שיחות AI" value={stats.totalChats} color="text-blue-400" />
        <StatCard title="מוצרים במלאי" value={stats.totalProducts} color="text-emerald-400" />
        <StatCard title="מדיה חסרה" value={stats.missingMedia} color="text-amber-400" highlight={stats.missingMedia > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-slate-900/50 border-white/5 rounded-[30px]">
          <CardHeader className="border-b border-white/5 text-white">
            <CardTitle className="text-lg font-black flex items-center gap-2 justify-end">
               ניטור פעילות <Activity className="text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {recentChats.map(chat => (
              <div key={chat.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-slate-500">{new Date(chat.created_at).toLocaleDateString()}</span>
                <p className="text-sm font-bold truncate ml-4">{chat.query}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[40px] shadow-2xl flex flex-col justify-between">
          <div>
            <Sparkles className="mb-4" />
            <h3 className="text-xl font-black mb-2">סוכן העשרה פעיל</h3>
            <p className="text-sm text-blue-100">נמצאו {stats.missingMedia} פריטים ללא תמונה. Gemini מוכן לסריקה.</p>
          </div>
          <button 
            onClick={handleEnrich} 
            disabled={isEnriching}
            className="w-full bg-white text-blue-900 py-4 rounded-2xl font-black text-sm mt-8 transition-all active:scale-95 disabled:opacity-50"
          >
            {isEnriching ? <Loader2 className="animate-spin mx-auto" size={20} /> : "הפעל סוכן העשרה"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, highlight }: any) {
  return (
    <div className={`p-8 rounded-[35px] border ${highlight ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-900/50 border-white/5'}`}>
      <p className="text-xs font-bold text-slate-500 mb-1">{title}</p>
      <p className={`text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}
