"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Package, Settings, BarChart3, Database } from "lucide-react";

const menuItems = [
  { name: "לקוחות", path: "customers", icon: Users },
  { name: "מלאי", path: "inventory", icon: Package },
  { name: "הזמנות", path: "orders", icon: BarChart3 },
  { name: "הגדרות מוח", path: "ai_settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white h-screen border-l border-slate-100 p-6 flex flex-col" dir="rtl">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <Database className="text-white" size={20} />
        </div>
        <span className="font-black text-slate-900 tracking-tighter text-xl">Saban OS</span>
      </div>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname.includes(item.path);
          return (
            <Link
              key={item.path}
              href={`/admin/${item.path}`}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-bold ${
                isActive 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-50">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Version 2.0.4</p>
      </div>
    </div>
  );
}
