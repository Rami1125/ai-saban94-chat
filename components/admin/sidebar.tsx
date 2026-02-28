import Link from "next/link"
import { LayoutDashboard, Users, Package, ShoppingCart, Truck, Database, Settings } from "lucide-react"

const studioMenu = [
  { name: "דשבורד ראשי", icon: LayoutDashboard, path: "/admin" },
  { name: "זיכרון לקוחות", icon: Users, table: "customer_memory" }, // תיקון מ-customers
  { name: "מלאי (Inventory)", icon: Package, table: "inventory" },
  { name: "הזמנות", icon: ShoppingCart, table: "orders" },
  { name: "נהגים", icon: Truck, table: "drivers" },
  { name: "ניהול משימות", icon: ListChecks, table: "tasks" }, // טבלה חדשה מהרשימה
  { name: "מוצרים (Raw)", icon: Tag, table: "products" },      // טבלה חדשה מהרשימה
  { name: "קאש תשובות AI", icon: Database, table: "answers_cache" },
  { name: "ידע מאוחד", icon: Brain, table: "saban_unified_knowledge" },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-[#0B2C63] text-white h-screen sticky top-0 flex flex-col p-4 shadow-2xl">
      <div className="text-2xl font-black text-center py-6 border-b border-blue-400/20 mb-6">
        SABAN STUDIO
      </div>
      <nav className="flex-1 space-y-1">
        {studioMenu.map((item) => (
          <Link 
            key={item.name} 
            href={item.table ? `/admin/${item.table}` : item.path!}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all text-sm group"
          >
            <item.icon size={18} className="text-blue-300 group-hover:text-white" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="pt-4 border-t border-blue-400/20">
        <button className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-500/20 text-red-300 text-sm">
          <Settings size={18} />
          הגדרות מערכת
        </button>
      </div>
    </aside>
  )
}
