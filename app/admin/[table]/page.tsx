"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Edit2, Trash2 } from "lucide-react"

export default function TableManager() {
  const { table } = useParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    // שליפה נקייה בלי סינונים שעלולים להכשיל (כמו Order By)
    const { data: res, error } = await supabase.from(table as string).select('*')
    if (res) setData(res)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [table])

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C63]">ניהול טבלת {table}</h1>
          <p className="text-sm text-stone-400">נמצאו {data.length} שורות במאגר</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          רענן נתונים
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin" size={40} /></div>
        ) : data.length === 0 ? (
          <div className="p-20 text-center text-stone-400 font-medium">אין נתונים להצגה בטבלה זו.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col} className="text-right font-bold py-4 text-[#0B2C63]">{col}</TableHead>
                  ))}
                  <TableHead className="text-center font-bold">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-blue-50/50 transition-colors">
                    {columns.map(col => (
                      <TableCell key={col} className="text-right text-sm py-4 border-b">
                        {typeof item[col] === 'object' ? '📦 JSON Data' : String(item[col] || '-')}
                      </TableCell>
                    ))}
                    <TableCell className="text-center flex justify-center gap-2 py-4 border-b">
                      <Button variant="ghost" size="icon" className="text-blue-500"><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500"><Trash2 size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
