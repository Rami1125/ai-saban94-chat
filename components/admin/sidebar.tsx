"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Truck, 
  Database, 
  Settings, 
  ListChecks, 
  Tag, 
  Brain,
  Sparkles,
  ChevronLeft,
  Activity
} from "lucide-react";

const studioMenu = [
  { name: "דשבורד בקרה", icon: LayoutDashboard, path: "/admin" },
  { name: "ניהול מוח AI", icon: Sparkles, path: "/admin/ai-brain" },
  { name: "זיכרון לקוחות", icon: Users, table: "customer_memory" },
  { name: "מלאי (Inventory)", icon: Package, table: "inventory" },
  { name: "הזמנות", icon: ShoppingCart, table: "orders" },
  { name: "נהגים", icon: Truck, table: "drivers" },
  { name: "ניהול משימות", icon: ListChecks, table: "tasks" },
  { name: "קטלוג מוצרים", icon: Tag, table: "products" },
  { name: "קאש תשובות AI", icon: Database, table: "answers_cache" },
  { name: "ידע מאוחד (Brain)", icon: Brain, table: "saban_unified_knowledge" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#0B2C63] text-white h-screen sticky top-0 flex flex-col p-5 shadow-2xl border-l border-blue-400/10" dir="rtl">
      {/* Logo Section */}
      <div className="flex flex-col items-center py-8 border-b border-blue-400/20 mb-6">
        <div className="text-3xl font-black italic tracking-tighter">
          SABAN <span className="text-blue-400 text-lg">STUDIO</span>
        </div>
        <div className="flex items-center gap-2 mt-2 bg-blue-500/10 px-3 py-1 rounded-full">
          <Activity size={10} className="text-green-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Live Sync Active</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
        {studioMenu.map((item) => {
          const targetPath = item.table ? `/admin/${item.table}` : item.path!;
          const isActive = pathname === targetPath;

          return (
            <Link 
              key={item.name} 
              href={targetPath}
              className={`
                flex items-center justify-between p-3.5 rounded-2xl transition-all group
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'hover:bg-white/5 text-blue-100/70 hover:text-white'}
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={`${isActive ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'}`} />
                <span className="text-sm font-bold tracking-tight">{item.name}</span>
              </div>
              {isActive && <ChevronLeft size={16} className="text-blue-300" />}
            </Link>
          );
        })}
      </nav>
      
      {/* Bottom Settings Section */}
      <div className="pt-6 border-t border-blue-400/20 mt-4 space-y-2">
        <button className="flex items-center gap-3 p-4 w-full rounded-2xl hover:bg-white/5 text-blue-200 text-sm font-bold transition-all">
          <Settings size={20} className="text-blue-400" />
          <span>הגדרות מערכת</span>
        </button>
        
        <div className="p-4 bg-blue-900/30 rounded-2xl border border-blue-400/10">
          <p className="text-[10px] font-black text-blue-400 uppercase mb-1">מחובר כרגע</p>
          <p className="text-xs font-bold text-white truncate">רמי מסארווה - מנהל מערכת</p>
        </div>
      </div>
    </aside>
  );
}
