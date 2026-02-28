"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Smartphone, Save, PlayCircle, Calculator, Clock, CheckCircle } from "lucide-react"

export default function ProductsWithPreview() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').order('name')
      if (data) {
        setProducts(data)
        setSelectedProduct(data[0])
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const handleUpdate = async (field: string, value: any) => {
    const updated = { ...selectedProduct, [field]: value }
    setSelectedProduct(updated)
    await supabase.from('products').update({ [field]: value }).eq('id', selectedProduct.id)
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="flex h-screen bg-slate-100" dir="rtl">
      {/* צד ימין: עריכת נתונים */}
      <div className="w-2/3 p-8 overflow-y-auto space-y-6">
        <h1 className="text-3xl font-black text-[#0B2C63]">עריכת מוצר מקצועית</h1>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
          <label className="block text-sm font-bold text-slate-500">שם המוצר</label>
          <Input value={selectedProduct?.name} onChange={(e) => handleUpdate('name', e.target.value)} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-500">מחיר (₪)</label>
              <Input type="number" value={selectedProduct?.price} onChange={(e) => handleUpdate('price', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500">צריכה למ"ר (ק"ג)</label>
              <Input type="number" value={selectedProduct?.coverage_per_sqm} onChange={(e) => handleUpdate('coverage_per_sqm', e.target.value)} />
            </div>
          </div>

          <label className="block text-sm font-bold text-slate-500">שיטת יישום</label>
          <textarea 
            className="w-full h-24 p-4 rounded-xl border bg-slate-50 text-sm" 
            value={selectedProduct?.application_method} 
            onChange={(e) => handleUpdate('application_method', e.target.value)}
          />
        </div>
      </div>

      {/* צד שמאל: iPhone Simulator */}
      <div className="w-1/3 flex items-center justify-center border-r bg-white shadow-2xl relative">
        <div className="relative w-[300px] h-[600px] bg-black rounded-[50px] border-[8px] border-slate-800 shadow-2xl overflow-hidden pointer-events-none">
          {/* מסך האייפון */}
          <div className="bg-white h-full w-full overflow-y-auto p-4 pt-10 flex flex-col space-y-3">
            <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none self-end max-w-[80%] text-xs shadow-md">
              סבן, מה הנתונים של {selectedProduct?.name}?
            </div>
            
            {/* כרטיס המוצר בתוך האייפון */}
            <div className="bg-slate-50 rounded-2xl border overflow-hidden shadow-sm">
              <img src={selectedProduct?.image_url || 'https://via.placeholder.com/300'} className="w-full h-32 object-cover" />
              <div className="p-3 space-y-2 text-right">
                <h4 className="font-black text-blue-900 text-sm">{selectedProduct?.name}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{selectedProduct?.application_method}</p>
                
                <div className="grid grid-cols-2 gap-1 mt-2">
                   <div className="bg-white p-2 rounded-lg border text-center">
                      <Calculator size={12} className="mx-auto text-blue-500" />
                      <div className="text-[9px] font-bold mt-1">{selectedProduct?.coverage_per_sqm} ק"ג/מ"ר</div>
                   </div>
                   <div className="bg-white p-2 rounded-lg border text-center">
                      <Clock size={12} className="mx-auto text-orange-500" />
                      <div className="text-[9px] font-bold mt-1">{selectedProduct?.drying_time}</div>
                   </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                   <span className="text-blue-700 font-black text-lg">₪{selectedProduct?.price}</span>
                   <Button size="sm" className="h-6 text-[10px] bg-blue-600 rounded-full">קנה עכשיו</Button>
                </div>
              </div>
            </div>
          </div>
          {/* Notch האייפון */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl"></div>
        </div>
        <div className="absolute top-4 right-4 text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
            <Smartphone size={14} /> iPhone 15 Pro Simulator
        </div>
      </div>
    </div>
  )
}
