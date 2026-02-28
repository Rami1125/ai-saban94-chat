"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, RefreshCw, Trash2, Edit3 } from "lucide-react"

export default function TableManager() {
  const { table } = useParams()
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const { data: result, error } = await supabase
      .from(table as string)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (result && result.length > 0) {
      setData(result)
      setColumns(Object.keys(result[0]))
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [table])

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C63]">ניהול טבלת {table}</h1>
          <p className="text-xs text-stone-400">מוצגות 100 שורות אחרונות</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button className="bg-[#0B2C63] hover:bg-blue-800 gap-2">
            <Plus size={16} /> הוסף {table === 'customers' ? 'לקוח' : 'שורה'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-stone-50">
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col} className="text-right font-bold text-[#0B2C63]">{col}</TableHead>
                  ))}
                  <TableHead className="text-center font-bold">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-blue-50/30 transition-colors">
                    {columns.map(col => (
                      <TableCell key={col} className="text-right text-sm py-3 border-b border-stone-100">
                        {typeof item[col] === 'object' ? '📦 JSON' : String(item[col] || '-')}
                      </TableCell>
                    ))}
                    <TableCell className="text-center flex justify-center gap-2 py-3 border-b border-stone-100">
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100"><Edit3 size={14} /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100"><Trash2 size={14} /></Button>
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
