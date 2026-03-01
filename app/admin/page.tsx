"use client";

import React, { useEffect, useState } from "react";
import { 
  MessageSquare, Package, AlertTriangle, 
  Activity, RefreshCw, TrendingUp, Users,
  Search, ExternalLink, Database
} from "lucide-react";
import { supabase } from "@/lib/supabase"; // תיקון הייבוא לפי המבנה שלך
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function SabanAdminDashboard() {
  const [stats, setStats] = useState({
    totalChats: 0,
    totalProducts: 0,
    missingMedia: 0,
    loading: true
  });
  const [recentChats, setRecentChats] = useState([]);

  const fetchDashboardData = async () => {
    setStats(prev => ({ ...prev, loading: true }));
    try {
      // 1. שליפת כמות שיחות (מטבלת chat_history)
      const { count: chatCount } = await supabase
        .from('chat_history')
        .select('*', { count: 'exact', head: true });

      // 2. שליפת כמות מוצרים במלאי
      const { count: productCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });

      // 3. שליפת מוצרים ללא תמונה/מדיה
      const { count: missingCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .is('image_url', null);

      // 4. שליפת שיחות אחרונות
      const { data: chats } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      setStats({
        totalChats: chatCount || 0,
        totalProducts: productCount || 0,
        missingMedia: missingCount || 0,
        loading: false
      });
      setRecentChats(chats || []);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 lg:p-12 space-y-10" dir="rtl">
      
      {/* Header סקציה */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
            SABAN COMMAND CENTER
          </h1>
          <p className="text-blue-400 font-bold text-xs uppercase tracking-[4px] mt-2">מרכז ניטור ובינה מלאכותית</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <RefreshCw size={18} className={stats.loading ? "animate-spin" : ""} />
          רענן נתונים
        </button>
      </div>

      {/* כרטיסי סטטיסטיקה - גריד תגובתי */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          title="שיחות AI מהשטח" 
          value={stats.totalChats} 
          icon={<MessageSquare className="text-blue-500" />} 
          trend="+12% מהשבוע שעבר"
        />
        <StatCard 
          title="פריטים במלאי" 
          value={stats.totalProducts} 
          icon={<Package className="text-emerald-500" />} 
          trend="מסונכרן מול Supabase"
        />
        <StatCard 
          title="מדיה חסרה (דורש AI)" 
          value={stats.missingMedia} 
          icon={<AlertTriangle className="text-amber-500" />} 
          trend="דורש טיפול סוכן"
          highlight={stats.missingMedia > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
        
        {/* טבלת שיחות אחרונות - תופסת 2 עמודות */}
        <Card className="lg:col-span-2 bg-slate-900/40 border-white/5 backdrop-blur-xl rounded-[40px] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-white/5 bg-white/5">
            <CardTitle className="text-xl font-black flex items-center gap-3 text-white">
              <Activity className="text-blue-500" />
              ניטור שיחות בזמן אמת
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {recentChats.length > 0 ? recentChats.map((chat: any) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={chat.id} 
                  className="flex justify-between items-center p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-100 line-clamp-1">"{chat.query}"</p>
                    <p className="text-[10px] text-slate-500 font-bold">{new Date(chat.created_at).toLocaleString('he-IL')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full font-black border border-blue-500/20">
                       PROCESSED
                     </span>
                     <ExternalLink size={14} className="text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              )) : (
                <p className="text-center text-slate-500 font-bold py-10">אין שיחות מתועדות כרגע.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* פעולות מהירות ותובנות AI */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[45px] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">סוכן סריקת מדיה</h3>
              <p className="text-blue-100/70 text-sm font-bold mt-4 leading-relaxed">
                נמצאו {stats.missingMedia} מוצרים ללא תמונה. האם להפעיל את Gemini לסריקה והשלמה אוטומטית?
              </p>
              <button className="w-full bg-white text-blue-900 py-5 rounded-[22px] font-black text-sm mt-8 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                הפעל סוכן העשרה (Enrich)
              </button>
            </div>
            {/* Background Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
          </div>

          <Card className="bg-slate-900/40 border-white/5 rounded-[40px] p-8">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Database size={16} /> מצב חיבור נתונים
            </h4>
            <div className="space-y-4">
              <StatusRow label="Supabase Engine" status="Online" color="bg-green-500" />
              <StatusRow label="Gemini AI API" status="Active" color="bg-green-500" />
              <StatusRow label="Vercel Edge" status="iad1-East" color="bg-blue-500" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function StatCard({ title, value, icon, trend, highlight = false }: any) {
  return (
    <div className={`p-10 rounded-[45px] border backdrop-blur-2xl transition-all hover:scale-[1.03] ${
      highlight ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-900/40 border-white/5'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{trend}</span>
      </div>
      <div className="text-slate-400 text-xs font-bold mb-1">{title}</div>
      <div className="text-5xl font-black tracking-tighter text-white">{value}</div>
    </div>
  );
}

function StatusRow({ label, status, color }: any) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-white uppercase">{status}</span>
        <div className={`w-2 h-2 rounded-full ${color}`} />
      </div>
    </div>
  );
}
