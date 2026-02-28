"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Activity, CheckCircle2, XCircle, Database, 
  Users, Package, ShoppingCart, Truck, AlertTriangle, Brain, ListChecks, Tag
} from "lucide-react"
import Link from "next/link" // ייבוא יחיד ותקין

// רשימת הטבלאות המדויקת לפי ה-Database של סבן
const tablesToCheck = [
  { name: "זיכרון לקוחות", id: "customer_memory", icon: Users }, // תוקן מ-customers
  { name: "מלאי", id: "inventory", icon: Package },
  { name: "הזמנות", id: "orders", icon: ShoppingCart },
  { name: "נהגים", id: "drivers", icon: Truck },
  { name: "משימות", id: "tasks", icon: ListChecks },
  { name: "מוצרים", id: "products", icon: Tag },
  { name: "קאש AI", id: "answers_cache", icon: Database },
  { name: "ידע מאוחד", id: "saban_unified_knowledge", icon: Brain },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkHealth() {
      const results: any = {}
      for (const table of tablesToCheck) {
        // בדיקה אם הטבלה קיימת וכמה שורות יש בה
        const { count, error } = await supabase
          .from(table.id)
          .select('*', { count: 'exact', head: true })
        
        results[table.id] = {
          exists: !error || (error.code !== 'PGRST116' && error.code !== '42P01'),
          count: count || 0,
          error: error?.message
        }
      }
      setStats(results)
      setLoading(false)
    }
    checkHealth()
  }, [])

  return (
    <div className="space-y-8 p-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-[#0B2C63] mb-2">Saban Studio - דוח מצב</h1>
        <p className="text-slate-500 font-medium">סריקת קישוריות לטבלאות ב-Supabase</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tablesToCheck.map((table) => {
          const status = stats[table.id]
          const isOk = status?.exists

          return (
            <Link 
              href={isOk ? `/admin/${table.id}` : "#"} 
              key={table.id}
              className={`p-6 rounded-2xl border-2 transition-all ${
                isOk ? "bg-white border-slate-100 hover:border-blue-500 shadow-sm" : "bg-red-50 border-red-100 opacity-80 cursor-not-allowed"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${isOk ? "bg-blue-50 text-blue-600" : "bg-red-100 text-red-600"}`}>
                  <table.icon size={24} />
                </div>
                {loading ? (
                  <div className="animate-pulse bg-slate-200 h-6 w-12 rounded-full" />
                ) : isOk ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 size={12} /> תקין
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">
                    <XCircle size={12} /> 404
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-1">{table.name}</h3>
              <p className="text-slate-400 text-sm mb-4">נתיב: <span className="font-mono text-[10px]">{table.id}</span></p>

              {!loading && isOk && (
                <div className="mt-4 pt-4 border-t border-slate-50 text-slate-600 font-bold">
                  <span className="text-2xl text-blue-600">{status.count}</span> שורות במאגר
                </div>
              )}
              {!loading && !isOk && (
                <div className="mt-4 pt-4 border-t border-red-100 text-red-500 text-[10px] flex gap-1">
                  <AlertTriangle size={12} className="shrink-0" />
                  טבלה לא נמצאה. וודא שם ב-Supabase.
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
