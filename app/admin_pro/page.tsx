"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { MessageSquare, Scale, CheckCircle2, Truck, Ghost, ArrowUpRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [stats, setStats] = useState({ chats: 0, alerts: 0, orders: 0, activeTrucks: 0 });
  const [recentFeed, setRecentFeed] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('realtime-dashboard').on('postgres_changes', { event: '*', table: 'chat_history' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function fetchData() {
    const { count } = await supabase.from('chat_history').select('*', { count: 'exact', head: true });
    const { data: recent } = await supabase.from('chat_history').select('*').order('created_at', { ascending: false }).limit(6);
    const { count: alerts } = await supabase.from('pending_approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    setStats({ chats: count || 0, alerts: alerts || 0, orders: 156, activeTrucks: 14 });
    setRecentFeed(recent || []);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<MessageSquare />} label="שיחות במוח" value={stats.chats} trend="+5%" color="blue" />
        <StatCard icon={<Scale />} label="חריגות בטיפול" value={stats.alerts} trend="דחוף" color="rose" isAlert={stats.alerts > 0} />
        <StatCard icon={<CheckCircle2 />} label="הזמנות מאושרות" value={stats.orders} trend="+12%" color="emerald" />
        <StatCard icon={<Truck />} label="משאיות שטח" value={stats.activeTrucks} trend="Live" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-slate-800 flex items-center gap-3 italic uppercase tracking-tighter"><Activity size={20}/> פיד ביצוע חי</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentFeed.map((item) => (
                <div key={item.id} className="p-6 hover:bg-slate-50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${item.role === 'assistant' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      <MessageSquare size={20}/>
                    </div>
                    <div className="max-w-md overflow-hidden">
                      <h4 className="font-black text-slate-900 text-sm">{item.role === 'user' ? 'לקוח VIP' : 'Ai-ח.סבן'}</h4>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 italic truncate">{item.content}</p>
                    </div>
                  </div>
                  <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-xl flex items-center gap-2 font-black text-[10px] uppercase">
                     <Ghost size={16}/> השתלט
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] shadow-2xl p-8 text-white relative overflow-hidden flex flex-col justify-between border border-white/5">
           <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 blur-[80px] rounded-full" />
           <div>
              <h3 className="font-black text-2xl italic mb-2">עומס יומי</h3>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Truck Payload Analysis</p>
           </div>
           
           <div className="space-y-6 my-10">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold opacity-60 uppercase"><span>ניצול צי 'חכמת'</span><span>92%</span></div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden shadow-inner">
                   <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="bg-emerald-500 h-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold opacity-60 uppercase"><span>חריגות שנחסמו</span><span>8</span></div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden shadow-inner">
                   <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="bg-rose-500 h-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                </div>
              </div>
           </div>
           
           <button className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 active:scale-95 transition-all border-b-4 border-blue-800">
              הפק דוח חמ"ל מלא
           </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, trend, color, isAlert }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100"
  };
  return (
    <div className={`p-6 bg-white rounded-[35px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group ${isAlert ? 'ring-2 ring-rose-500 animate-pulse' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${colors[color]}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${colors[color]}`}>{trend}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-4xl font-black italic text-slate-900 tracking-tighter">{value}</h4>
    </div>
  );
}
