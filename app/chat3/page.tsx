"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Edit, Trash2, Package } from "lucide-react"

export default function TableManager() {
  const { table } = useParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: res } = await supabase.from(table as string).select('*')
      if (res) setData(res)
      setLoading(false)
    }
    fetchData()
  }, [table])

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0B2C63]">ניהול {table}</h1>
            <p className="text-sm text-slate-400">נמצאו {data.length} רשומות</p>
          </div>
        </div>
        <div className="relative w-72">
          <Search className="absolute right-3 top-3 text-slate-400" size={18} />
          <Input 
            placeholder="חיפוש מהיר..." 
            className="pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col} className="text-right font-bold text-[#0B2C63]">{col}</TableHead>
                  ))}
                  <TableHead className="text-center font-bold">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-blue-50/30 transition-colors">
                    {columns.map(col => (
                      <TableCell key={col} className="text-right py-4 text-sm">
                        {typeof item[col] === 'object' ? '📦 JSON' : String(item[col])}
                      </TableCell>
                    ))}
                    <TableCell className="text-center flex justify-center gap-2 py-4">
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100">
                        <Trash2 size={16} />
                      </Button>
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
