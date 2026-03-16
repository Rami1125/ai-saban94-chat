"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { MessageSquare, Scale, CheckCircle2, Truck, ShieldAlert, Ghost, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [stats, setStats] = useState({ activeChats: 0, weightAlerts: 0, confirmed: 0, trucks: 0 });
  const [liveChats, setLiveChats] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    // Subscriptions for real-time updates
    const channel = supabase.channel('dashboard-sync')
      .on('postgres_changes', { event: 'INSERT', table: 'chat_history' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const { count: chatCount } = await supabase.from('chat_history').select('*', { count: 'exact', head: true });
    const { data: recent } = await supabase.from('chat_history').select('*').order('created_at', { ascending: false }).limit(5);
    setStats({ activeChats: chatCount || 0, weightAlerts: 3, confirmed: 142, trucks: 18 });
    setLiveChats(recent || []);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<MessageSquare className="text-blue-600"/>} label="שיחות במערכת" value={stats.activeChats.toString()} trend="+12%" />
        <StatCard icon={<Scale className="text-rose-600"/>} label="חריגות משקל" value="3" trend="דחוף!" color="bg-rose-50 border-rose-100 text-rose-700" />
        <StatCard icon={<CheckCircle2 className="text-emerald-600"/>} label="הזמנות אושרו" value="142" trend="+8%" />
        <StatCard icon={<Truck className="text-amber-600"/>} label="משאיות בביצוע" value="18" trend="Live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-3 italic uppercase text-sm">פיד אירועים בזמן אמת</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {liveChats.map((chat) => (
                <div key={chat.id} className="p-6 hover:bg-slate-50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${chat.role === 'assistant' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      <MessageSquare size={24}/>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 leading-none">{chat.role === 'user' ? 'לקוח' : 'Ai-ח.סבן'}</h4>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase italic line-clamp-1">{chat.content}</p>
                    </div>
                  </div>
                  <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-md flex items-center gap-2 font-black text-[10px] uppercase">
                     <Ghost size={16}/> השתלט
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="bg-slate-900 rounded-[32px] shadow-xl p-8 text-white relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
          <h3 className="font-black text-xl italic mb-6">סיכום עומס יומי</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold opacity-60 uppercase"><span>ניצול משאיות חכמת</span><span>88%</span></div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="bg-emerald-500 h-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold opacity-60 uppercase"><span>חריגות משקל שנחסמו</span><span>12</span></div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="bg-rose-500 h-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
              </div>
            </div>
            <button className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 shadow-lg active:scale-95 transition-all">הפק דוח יומי מלא</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color }: any) {
  return (
    <div className={`p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm group hover:shadow-md transition-all ${color || ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform ${color ? 'bg-white/20 text-white' : ''}`}>{icon}</div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${color ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>{trend}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black italic">{value}</h4>
    </div>
  );
}
