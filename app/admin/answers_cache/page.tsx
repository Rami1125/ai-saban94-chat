"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Database, Edit, Trash2, ExternalLink } from "lucide-react"

export default function AnswersCacheManager() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const { data: res } = await supabase.from('answers_cache').select('*')
    if (res) setData(res)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0B2C63]">ניהול זיכרון AI (Cache)</h1>
            <p className="text-sm text-slate-400">כאן שמורות התשובות והכרטיסים של הצ'אט</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline">רענן נתונים</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right font-bold py-4">מפתח (Key)</TableHead>
                <TableHead className="text-right font-bold py-4">שם המוצר</TableHead>
                <TableHead className="text-right font-bold py-4">מחיר (₪)</TableHead>
                <TableHead className="text-right font-bold py-4">מקור מידע</TableHead>
                <TableHead className="text-center font-bold">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                // חילוץ נתונים מתוך ה-JSON המורכב ששלחת
                const product = item.payload?.components?.find((c: any) => c.type === "productCard")?.props;
                
                return (
                  <TableRow key={item.key} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-right font-mono text-xs text-blue-600">{item.key}</TableCell>
                    <TableCell className="text-right font-bold">{product?.name || "טקסט חופשי"}</TableCell>
                    <TableCell className="text-right text-green-700 font-bold">{product?.price || "-"}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                        {item.payload?.source || "AI Generated"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center flex justify-center gap-2 py-4">
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100">
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
