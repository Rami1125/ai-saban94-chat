"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Package, Tag, Factory } from "lucide-react"

export default function InventoryManager() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInventory = async () => {
    setLoading(true)
    const { data } = await supabase.from('inventory').select('*')
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchInventory() }, [])

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-[#0B2C63] p-3 rounded-xl text-white">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0B2C63]">מלאי מחסן סבן</h1>
            <p className="text-sm text-slate-400">ניהול קטלוג וספקים בזמן אמת</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchInventory} className="gap-2 border-slate-200">
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          רענן מלאי
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right font-bold py-4 text-[#0B2C63]">מוצר</TableHead>
                <TableHead className="text-right font-bold py-4 text-[#0B2C63]">מק"ט (SKU)</TableHead>
                <TableHead className="text-right font-bold py-4 text-[#0B2C63]">קטגוריה</TableHead>
                <TableHead className="text-right font-bold py-4 text-[#0B2C63]">ספק</TableHead>
                <TableHead className="text-center font-bold">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="text-right py-4 font-bold text-slate-700">
                    {item.product_name}
                  </TableCell>
                  <TableCell className="text-right py-4 font-mono text-xs text-blue-600">
                    {item.sku || '-'}
                  </TableCell>
                  <TableCell className="text-right py-4 text-sm">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md flex items-center gap-1 w-fit">
                      <Tag size={12} /> {item.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4 text-sm">
                    <span className="flex items-center gap-1 text-slate-500 font-medium">
                      <Factory size={12} /> {item.supplier_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-center flex justify-center gap-2 py-4">
                    <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">ערוך</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
