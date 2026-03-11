"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Truck, Package, ClipboardList, BrainCircuit } from "lucide-react";

export default function SabanControlCenter() {
  const [data, setData] = useState({ inventory: [], drivers: [], tasks: [], orders: [] });

  useEffect(() => {
    // פונקציית סנכרון בזמן אמת לכל הטבלאות
    const subscribeToTable = (table: string) => {
      return supabase.channel(`live-${table}`)
        .on('postgres_changes', { event: '*', table }, (payload) => {
          refreshAllData(); // רענון נתונים בעת שינוי
        }).subscribe();
    };

    const refreshAllData = async () => {
      const [inv, drv, tsk, ord] = await Promise.all([
        supabase.from('inventory').select('*'),
        supabase.from('drivers').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('orders').select('*')
      ]);
      setData({ inventory: inv.data || [], drivers: drv.data || [], tasks: tsk.data || [], orders: ord.data || [] });
    };

    refreshAllData();
    const channels = ['inventory', 'drivers', 'tasks', 'orders'].map(subscribeToTable);
    return () => channels.forEach(ch => supabase.removeChannel(ch));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200 p-8" dir="rtl">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black italic text-blue-500">SABAN OS <span className="text-white text-sm opacity-50 block">Control Center 2026</span></h1>
        <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest italic text-green-500">System Live</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* כרטיס מלאי */}
        <DashboardCard title="מלאי קריטי" icon={<Package className="text-red-400" />} 
          content={data.inventory.filter((i:any) => i.stock < 10).map((i:any) => `${i.name}: ${i.stock}`).join(', ')} />
        
        {/* כרטיס נהגים */}
        <DashboardCard title="נהגים בדרכים" icon={<Truck className="text-blue-400" />} 
          content={data.drivers.filter((d:any) => d.status === 'active').length + " נהגים פעילים"} />

        {/* כרטיס משימות */}
        <DashboardCard title="משימות פתוחות" icon={<ClipboardList className="text-amber-400" />} 
          content={data.tasks.filter((t:any) => t.status === 'pending').length + " משימות לביצוע"} />

        {/* כרטיס AI Cache */}
        <DashboardCard title="פעילות AI" icon={<BrainCircuit className="text-purple-400" />} 
          content="סנכרון מלא עם Unified Knowledge" />
      </div>

      {/* טבלת הזמנות חיה */}
      <div className="mt-12 bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-8">
        <h2 className="text-xl font-black mb-6">הזמנות אחרונות (זמן אמת)</h2>
        <div className="space-y-4">
          {data.orders.slice(0, 5).map((order: any) => (
            <div key={order.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="font-bold">{order.customer_name}</span>
              <span className="text-blue-400 font-black">₪{order.total_amount}</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{order.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, icon, content }: any) {
  return (
    <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
        <h3 className="font-bold text-sm text-slate-400">{title}</h3>
      </div>
      <p className="text-sm font-black text-white truncate">{content || 'אין נתונים חריגים'}</p>
    </div>
  );
}
