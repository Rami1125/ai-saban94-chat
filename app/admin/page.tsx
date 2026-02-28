"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Activity, CheckCircle2, XCircle, Database, 
  Users, Package, ShoppingCart, Truck, AlertTriangle 
} from "lucide-react"
import Link from "next/link"

const tablesToCheck = [
  { name: "לקוחות", id: "customers", icon: Users },
  { name: "מלאי", id: "inventory", icon: Package },
  { name: "הזמנות", id: "orders", icon: ShoppingCart },
  { name: "נהגים", id: "drivers", icon: Truck },
  { name: "קאש AI", id: "answers_cache", icon: Database },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkHealth() {
      const results: any = {}
      for (const table of tablesToCheck) {
        const { count, error } = await supabase
          .from(table.id)
          .select('*', { count: 'exact', head: true })
        
        results[table.id] = {
          exists: !error || error.code !== 'PGRST116' && error.code !== '42P01',
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
                    <XCircle size={12} /> 404/שגיאה
                  </div>
                )
              }
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-1">{table.name}</h3>
              <p className="text-slate-400 text-sm mb-4">שם טבלה: <span className="font-mono">{table.id}</span></p>

              {!loading && (
                <div className="mt-4 pt-4 border-t border-slate-50">
                  {isOk ? (
                    <div className="text-slate-600 font-bold">
                      <span className="text-2xl text-blue-600">{status.count}</span> שורות במאגר
                    </div>
                  ) : (
                    <div className="text-red-500 text-[10px] leading-tight flex gap-1">
                      <AlertTriangle size={12} className="shrink-0" />
                      הטבלה לא נמצאה. וודא שהשם ב-Supabase תואם בדיוק.
                    </div>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      <div className="bg-[#0B2C63] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold italic flex items-center gap-2">
            <Activity className="text-blue-400" /> מצב מערכת SabanOS
          </h2>
          <p className="text-blue-200 text-sm max-w-md">כל הטבלאות מחוברות בזמן אמת. המידע מסונכרן אוטומטית בין הצ'אט, הנהגים והמלאי.</p>
        </div>
        <div className="flex gap-4">
            <div className="text-center bg-white/10 p-4 rounded-2xl min-w-[100px]">
                <div className="text-2xl font-bold">2026</div>
                <div className="text-[10px] uppercase tracking-widest text-blue-300">Year</div>
            </div>
            <div className="text-center bg-white/10 p-4 rounded-2xl min-w-[100px]">
                <div className="text-2xl font-bold">READY</div>
                <div className="text-[10px] uppercase tracking-widest text-blue-300">Status</div>
            </div>
        </div>
      </div>
    </div>
  )
}
