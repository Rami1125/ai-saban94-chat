import Link from "next/link"
import { LayoutDashboard, Database, ShoppingCart, Users, Package, ListChecks } from "lucide-react"

const menuItems = [
  { name: "קאש תשובות", table: "answers_cache", icon: Database },
  { name: "מלאי מוצרים", table: "inventory", icon: Package },
  { name: "הזמנות לקוחות", table: "orders", icon: ShoppingCart },
  { name: "נהגים", table: "drivers", icon: Users },
  { name: "משימות", table: "tasks", icon: ListChecks },
  { name: "ידע מאוחד", table: "saban_unified_knowledge", icon: LayoutDashboard },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-[#0B2C63] text-white p-6 space-y-8 shadow-xl">
      <div className="text-xl font-bold border-b border-blue-400/30 pb-4">Saban Studio V2</div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.table} 
            href={`/admin/${item.table}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
          >
            <item.icon size={18} className="text-blue-300" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
