"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Package, Image as ImageIcon, Video, Calculator, Clock, CheckCircle2, Save } from "lucide-react"
import { toast } from "sonner"

export default function ProductsManager() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('name')
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSave = async (id: string, updatedData: any) => {
    const { error } = await supabase.from('products').update(updatedData).eq('id', id)
    if (!error) {
      toast.success("המוצר עודכן בהצלחה")
      setEditingId(null)
      fetchProducts()
    }
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* כותרת */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0B2C63]">ניהול מוצרי סבן</h1>
            <p className="text-sm text-slate-400">עריכת נתונים טכניים, מדיה ומחשבוני צריכה</p>
          </div>
        </div>
        <Button onClick={fetchProducts} variant="outline" className="gap-2">
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          רענן רשימה
        </Button>
      </div>

      {/* טבלה רחבה */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-right font-bold py-4 w-48">מוצר ומדיה</TableHead>
              <TableHead className="text-right font-bold py-4">נתונים טכניים (מ"ר/ייבוש)</TableHead>
              <TableHead className="text-right font-bold py-4 text-[#0B2C63]">שיטת יישום</TableHead>
              <TableHead className="text-center font-bold">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-blue-50/20 transition-all">
                {/* מוצר ומדיה */}
                <TableCell className="py-4 pr-6">
                  <div className="space-y-2">
                    <div className="font-bold text-[#0B2C63] text-lg">{product.name}</div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="לינק לתמונה" 
                        defaultValue={product.image_url} 
                        className="h-8 text-[10px]"
                        onBlur={(e) => handleSave(product.id, { image_url: e.target.value })}
                      />
                      <Input 
                        placeholder="לינק לוידאו" 
                        defaultValue={product.video_url} 
                        className="h-8 text-[10px]"
                        onBlur={(e) => handleSave(product.id, { video_url: e.target.value })}
                      />
                    </div>
                  </div>
                </TableCell>

                {/* נתונים טכניים */}
                <TableCell className="py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                      <Calculator size={14} className="text-blue-500" />
                      <input 
                        type="number" 
                        step="0.1"
                        className="bg-transparent w-full text-xs font-bold focus:outline-none"
                        placeholder="ק"ג למ\"ר"
                        defaultValue={product.coverage_per_sqm}
                        onBlur={(e) => handleSave(product.id, { coverage_per_sqm: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                      <Clock size={14} className="text-orange-500" />
                      <input 
                        className="bg-transparent w-full text-xs focus:outline-none"
                        placeholder="זמן ייבוש"
                        defaultValue={product.drying_time}
                        onBlur={(e) => handleSave(product.id, { drying_time: e.target.value })}
                      />
                    </div>
                  </div>
                </TableCell>

                {/* שיטת יישום */}
                <TableCell className="py-4 text-right">
                  <textarea 
                    className="w-full h-12 text-xs p-2 bg-slate-50 rounded-lg focus:ring-1 ring-blue-200 focus:outline-none resize-none"
                    placeholder="איך מיישמים?"
                    defaultValue={product.application_method}
                    onBlur={(e) => handleSave(product.id, { application_method: e.target.value })}
                  />
                </TableCell>

                {/* כפתור שמירה סופי */}
                <TableCell className="py-4 text-center">
                   <Button variant="ghost" size="icon" className="text-green-600">
                     <Save size={18} />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
