"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Truck, MapPin, Phone, UserCheck, Clock, XCircle } from "lucide-react"

// פונקציית עזר לתרגום ועיצוב סטטוס הנהג
const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return (
        <span className="flex items-center gap-1 w-fit bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black border border-green-200">
          <UserCheck size={12} /> פעיל / זמין
        </span>
      )
    case 'busy':
      return (
        <span className="flex items-center gap-1 w-fit bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black border border-orange-200">
          <Truck size={12} /> בנסיעה / עמוס
        </span>
      )
    case 'away':
      return (
        <span className="flex items-center gap-1 w-fit bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black border border-slate-200">
          <Clock size={12} /> בהפסקה
        </span>
      )
    default:
      return (
        <span className="flex items-center gap-1 w-fit bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-black">
          <XCircle size={12} /> {status || 'לא ידוע'}
        </span>
      )
  }
}

export default function DriversManager() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDrivers = async () => {
    setLoading(true)
    // שליפה מסודרת לפי שם הנהג
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('full_name', { ascending: true })
    
    if (data) setDrivers(data)
    if (error) console.error("Error fetching drivers:", error)
    setLoading(false)
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* כותרת ופעולות */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-200">
            <Truck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#0B2C63]">ניהול נהגי סבן</h1>
            <p className="text-sm text-slate-400 font-medium">מעקב וניהול צוות ההפצה בזמן אמת</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDrivers} 
          disabled={loading}
          className="gap-2 border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          רענן נתונים
        </Button>
      </div>

      {/* טבלת הנהגים */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 space-y-4 text-slate-400">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <p className="font-bold animate-pulse">טוען נתונים מהמסד...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-32 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">אין נהגים רשומים</h3>
            <p className="text-slate-400 mb-6 max-w-xs mx-auto">לא נמצאו נהגים בטבלה. וודא שהכנסת נתונים עם סטטוס "active".</p>
            <Button className="bg-[#0B2C63]">הוסף נהג ראשון</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="text-right font-black py-5 text-[#0B2C63] pr-8 text-sm uppercase tracking-wider">שם הנהג</TableHead>
                  <TableHead className="text-right font-black py-5 text-[#0B2C63] text-sm uppercase tracking-wider">סוג רכב / משאית</TableHead>
                  <TableHead className="text-right font-black py-5 text-[#0B2C63] text-sm uppercase tracking-wider">מיקום נוכחי</TableHead>
                  <TableHead className="text-right font-black py-5 text-[#0B2C63] text-sm uppercase tracking-wider">סטטוס עבודה</TableHead>
                  <TableHead className="text-center font-black py-5 text-[#0B2C63] text-sm uppercase tracking-wider">ניהול</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id} className="hover:bg-orange-50/30 transition-all border-b border-slate-50 group">
                    {/* שם וטלפון */}
                    <TableCell className="py-5 pr-8">
                      <div className="font-black text-slate-800 text-lg">{driver.full_name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono">
                        <Phone size={12} className="text-orange-400" /> {driver.phone || '---'}
                      </div>
                    </TableCell>
                    
                    {/* סוג רכב */}
                    <TableCell className="py-5 font-bold text-slate-600 text-sm italic">
                      {driver.vehicle_type || 'לא הוגדר רכב'}
                    </TableCell>
                    
                    {/* מיקום */}
                    <TableCell className="py-5">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
                        <MapPin size={16} className="text-red-500" />
                        {driver.location || 'ממתין לעדכון'}
                      </div>
                    </TableCell>
                    
                    {/* סטטוס (Badge) */}
                    <TableCell className="py-5">
                      {getStatusBadge(driver.status)}
                    </TableCell>
                    
                    {/* כפתורי פעולה */}
                    <TableCell className="py-5 text-center">
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-4"
                        >
                          ניהול נסיעה
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* הודעת סינכרון */}
      <div className="bg-[#0B2C63] text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
          <span className="text-sm font-bold tracking-wide italic uppercase">SabanOS - Sync Active</span>
        </div>
        <div className="text-xs text-blue-300 font-mono">
          Last Sync: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
