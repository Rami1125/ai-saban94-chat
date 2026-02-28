"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Save } from "lucide-react"

// המפתח שלך (וודא שהוא מוגדר ב-Vercel כדי למנוע שגיאת 401)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TableStudio() {
  const { table } = useParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: res, error } = await supabase.from(table as string).select('*')
      if (res) setData(res)
      setLoading(false)
    }
    fetchData()
  }, [table])

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" size={40} /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0B2C63]">ניהול טבלת: {table}</h1>
        <Button className="bg-green-600 gap-2"><Plus size={16} /> הוסף שורה</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {data.length > 0 && Object.keys(data[0]).map(key => (
                <TableHead key={key} className="text-right font-bold">{key}</TableHead>
              ))}
              <TableHead className="text-center">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                {Object.values(row).map((val: any, i) => (
                  <TableCell key={i} className="text-right max-w-[200px] truncate text-sm">
                    {typeof val === 'object' ? JSON.stringify(val).substring(0, 30) + '...' : String(val)}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" className="text-blue-600">ערוך</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
