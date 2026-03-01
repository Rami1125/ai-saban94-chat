"use client";

import { useEffect, useState } from "react";
import { 
  Users, MessageSquare, Package, AlertTriangle, 
  TrendingUp, Activity, Search, RefreshCw 
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalChats: 0, totalProducts: 0, missingMedia: 0 });
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      
      // שליחת נתונים מהירה
      const { count: chatCount } = await supabase.from('chat_history').select('*', { count: 'exact', head: true });
      const { count: productCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true });
      const { count: missingCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true }).is('image_url', null);
      
      const { data: chats } = await supabase.from('chat_history').select('*').order('created_at', { ascending: false }).limit(5);

      setStats({
        totalChats: chatCount || 0,
        totalProducts: productCount || 0,
        missingMedia: missingCount || 0
      });
      setRecentChats(chats || []);
    }
    fetchStats();
  }, []);

  return (
    <div className="p-8 bg-[#020617] min-h-screen text-white space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">SABAN ADMIN CENTER</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[3px]">ניהול בינה מלאכותית ומלאי</p>
        </div>
        <button className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition-all">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="שיחות AI" value={stats.totalChats} icon={<MessageSquare />} color="text-blue-500" />
        <StatCard title="סה''כ מוצרים" value={stats.totalProducts} icon={<Package />} color="text-emerald-500" />
        <StatCard title="מוצרים ללא מדיה" value={stats.missingMedia} icon={<AlertTriangle />} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Recent Conversations */}
        <Card className="bg-slate-900/50 border-white/5 text-white rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Activity className="text-blue-500" /> שיחות אחרונות מהשטח
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentChats.map((chat: any) => (
              <div key={chat.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-500">{new Date(chat.created_at).toLocaleString('he-IL')}</span>
                  <span className="bg-blue-600/20 text-blue-400 text-[9px] px-2 py-0.5 rounded-full font-black">AI ANALYZED</span>
                </div>
                <p className="text-sm font-bold line-clamp-1">"{chat.query}"</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[40px] shadow-2xl">
            <h3 className="text-xl font-black mb-2 text-white italic tracking-tighter">Saban Agent Active</h3>
            <p className="text-blue-100 text-sm font-bold mb-6">הסוכן סורק כרגע את הרשת להשלמת תמונות חסרות.</p>
            <button className="w-full bg-white text-blue-900 py-4 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all shadow-xl">
              הפעל סריקת מלאי מלאה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[35px] backdrop-blur-xl">
      <div className={`mb-4 ${color}`}>{icon}</div>
      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</div>
      <div className="text-4xl font-black tracking-tighter">{value}</div>
    </div>
  );
}
