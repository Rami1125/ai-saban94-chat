"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, PackagePlus, AlertTriangle, Save, RefreshCcw } from "lucide-react"
import { toast } from "sonner"

export default function InventoryManager() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInventory = async () => {
    setLoading(true)
    const { data } = await supabase.from('inventory').select('*').order('item_name')
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchInventory() }, [])

  const updateStock = async (id: string, newQuantity: number) => {
    const { error } = await supabase.from('inventory').update({ stock_quantity: newQuantity }).eq('id', id)
    if (!error) toast.success("המלאי עודכן")
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-[#0B2C63]">ניהול מלאי מחסן - סבן</h1>
          <p className="text-sm text-slate-400">עדכן כמויות זמינות לאספקה בזמן אמת</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" onClick={fetchInventory}><RefreshCcw size={16} /></Button>
            <Button className="bg-green-600 hover:bg-green-700 gap-2">
                <PackagePlus size={18} /> הוסף מוצר למחסן
            </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : items.length === 0 ? (
          <div className="bg-white p-20 text-center rounded-2xl border-2 border-dashed">
            <p className="text-slate-400 mb-4">המלאי ריק. בוא נכניס את המוצר הראשון!</p>
            <Button onClick={() => {/* פונקציית הוספה */}} className="bg-[#0B2C63]">הוסף סיקה 107 למלאי</Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-right font-bold py-4">שם המוצר</TableHead>
                  <TableHead className="text-right font-bold py-4">כמות במלאי</TableHead>
                  <TableHead className="text-right font-bold py-4">סטטוס</TableHead>
                  <TableHead className="text-center font-bold">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-slate-700">{item.item_name}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        className="w-24 text-center font-mono" 
                        defaultValue={item.stock_quantity}
                        onBlur={(e) => updateStock(item.id, Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      {item.stock_quantity < 10 ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full w-fit">
                          <AlertTriangle size={12} /> מלאי נמוך
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full w-fit">במלאי</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                        <Button variant="ghost" className="text-blue-600"><Save size={16} /></Button>
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
