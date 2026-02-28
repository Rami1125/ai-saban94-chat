"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"

export default function SafeTableManager() {
  const { table } = useParams()
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    // שליפה פשוטה בלי Order כדי למנוע שגיאה 400 אם אין עמודת תאריך
    const { data: result, error: fetchError } = await supabase
      .from(table as string)
      .select('*')
      .limit(50)

    if (fetchError) {
      console.error("Supabase Error:", fetchError)
      setError(`שגיאה 404/400: וודא שקיימת טבלה בשם "${table}" ב-Supabase`)
    } else if (result && result.length > 0) {
      setData(result)
      setColumns(Object.keys(result[0]))
    } else {
      setError("הטבלה ריקה או שלא נמצאו נתונים")
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [table])

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-[#0B2C63]">ניהול טבלת: {table}</h1>
          <p className="text-sm text-slate-400">מוצגות 50 שורות ראשונות מהמסד</p>
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          רענן נתונים
        </Button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-red-800 font-bold text-lg mb-2">אופס! משהו השתבש</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-xs text-red-400">טיפ: בדוק אם שם הטבלה ב-Supabase הוא בדיוק "{table}" (שים לב לאותיות גדולות/קטנות)</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#0B2C63]" size={48} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col} className="text-right font-bold text-[#0B2C63] py-4">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                    {columns.map(col => (
                      <TableCell key={col} className="text-right text-sm py-4 border-b border-slate-100 max-w-[250px] truncate">
                        {typeof item[col] === 'object' ? '📦 JSON Data' : String(item[col] || '-')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
