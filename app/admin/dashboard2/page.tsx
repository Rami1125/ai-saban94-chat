"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Users, 
  Bell, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  Printer,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, pendingOrders: 0 });

  useEffect(() => {
    // כאן נמשוך הזמנות מ-Supabase בזמן אמת
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setOrders(data);
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex" dir="rtl">
      {/* Sidebar - ניווט מנהל */}
      <aside className="w-64 bg-slate-900/50 border-l border-white/5 p-6 space-y-8 hidden md:block">
        <div className="text-xl font-black italic">
          SABAN <span className="text-blue-500">OS</span>
        </div>
        <nav className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="לוח בקרה" active />
          <NavItem icon={<Package size={20} />} label="ניהול מלאי" />
          <NavItem icon={<CreditCard size={20} />} label="עסקאות אשראי" />
          <NavItem icon={<Users size={20} />} label="לקוחות" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">שלום, רמי</h1>
            <p className="text-slate-400 text-sm font-bold">מערכת ניהול הזמנות ח.סבן 1994</p>
          </div>
          <div className="flex gap-4">
            <button className="relative bg-slate-800 p-3 rounded-xl border border-white/5">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0F172A]"></span>
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="מכירות היום" value="₪12,450" trend="+15%" />
          <StatCard title="הזמנות פתוחות" value="8" trend="דחוף" color="text-amber-400" />
          <StatCard title="לקוחות חדשים" value="24" trend="+4" />
        </div>

        {/* Orders Table */}
        <div className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-black text-xl">הזמנות אחרונות לטיפול</h3>
            <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5">ייצא דוח PDF</Button>
          </div>
          
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="p-6">לקוח / פרויקט</th>
                <th className="p-6">סטטוס</th>
                <th className="p-6">סכום</th>
                <th className="p-6">אמצעי תשלום</th>
                <th className="p-6">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((order, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6 font-bold">
                    <div className="text-sm">{order.customer_name}</div>
                    <div className="text-[10px] opacity-40 italic">{order.phone}</div>
                  </td>
                  <td className="p-6">
                    <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">ממתין לחיוב</span>
                  </td>
                  <td className="p-6 font-black text-blue-400">₪{order.total_price}</td>
                  <td className="p-6 font-mono text-xs opacity-80">
                    {order.payment_method === 'card' ? (
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} /> 
                        <span>{order.card_info_masked}</span>
                        {/* כאן תהיה אפשרות למנהל לראות פרטים מלאים בהרשאה מיוחדת */}
                        <button className="text-[8px] underline ml-2 text-slate-500 hover:text-white">הצג הכל</button>
                      </div>
                    ) : 'WhatsApp Pay'}
                  </td>
                  <td className="p-6 flex gap-2">
                    <button className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500"><Printer size={16} /></button>
                    <button className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700 text-green-400"><CheckCircle size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// רכיבי עזר
function NavItem({ icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}

function StatCard({ title, value, trend, color = "text-white" }: any) {
  return (
    <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <ArrowUpRight size={80} />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{title}</p>
      <div className="flex items-baseline gap-3">
        <span className={`text-3xl font-black ${color}`}>{value}</span>
        <span className="text-[10px] font-bold text-green-500">{trend}</span>
      </div>
    </div>
  );
}
