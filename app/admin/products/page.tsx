"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Smartphone, Save, Image as ImageIcon, Video, Calculator, Clock, PlayCircle } from "lucide-react"

export default function ProductsWithMedia() {
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>

  return (
    <div className="flex h-screen bg-slate-100" dir="rtl">
      {/* צד ימין: עריכה מתקדמת */}
      <div className="w-2/3 p-10 overflow-y-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black text-[#0B2C63]">עורך מוצרי סבן</h1>
          <div className="text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border">
            עורך כעת: {selectedProduct?.name}
          </div>
        </div>

        {/* חלק 1: נתונים כלליים */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-4">נתונים בסיסיים</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">שם המוצר</label>
              <Input className="rounded-xl" value={selectedProduct?.name} onChange={(e) => handleUpdate('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">מחיר (₪)</label>
              <Input type="number" className="rounded-xl" value={selectedProduct?.price} onChange={(e) => handleUpdate('price', e.target.value)} />
            </div>
          </div>
        </div>

        {/* חלק 2: מרכז מדיה (כאן חסרו השדות!) */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-4 flex items-center gap-2">
            <ImageIcon className="text-blue-500" size={20} /> מרכז מדיה (תמונה וסרטון)
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">קישור לתמונת מוצר (URL)</label>
              <div className="flex gap-4 items-center">
                <Input 
                  className="rounded-xl flex-1" 
                  placeholder="https://example.com/image.jpg"
                  value={selectedProduct?.image_url || ''} 
                  onChange={(e) => handleUpdate('image_url', e.target.value)} 
                />
                {selectedProduct?.image_url && <img src={selectedProduct.image_url} className="w-12 h-12 rounded-lg object-cover border" alt="Preview" />}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">קישור לסרטון הדרכה (YouTube/MP4)</label>
              <div className="flex gap-4 items-center">
                <Input 
                  className="rounded-xl flex-1" 
                  placeholder="https://youtube.com/watch?v=..."
                  value={selectedProduct?.video_url || ''} 
                  onChange={(e) => handleUpdate('video_url', e.target.value)} 
                />
                {selectedProduct?.video_url && <PlayCircle className="text-red-500" size={24} />}
              </div>
            </div>
          </div>
        </div>

        {/* חלק 3: נתונים טכניים ומחשבון */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-4 flex items-center gap-2">
            <Calculator className="text-orange-500" size={20} /> מחשבון וצריכה
          </h3>
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 italic">צריכה למ"ר (ק"ג)</label>
                <Input type="number" step="0.1" className="rounded-xl" value={selectedProduct?.coverage_per_sqm} onChange={(e) => handleUpdate('coverage_per_sqm', e.target.value)} />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500">זמן ייבוש משוער</label>
                <Input className="rounded-xl" placeholder="למשל: 4-6 שעות" value={selectedProduct?.drying_time} onChange={(e) => handleUpdate('drying_time', e.target.value)} />
             </div>
          </div>
          <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">שיטת יישום מומלצת</label>
              <textarea 
                className="w-full h-32 p-4 rounded-2xl border bg-slate-50 text-sm focus:ring-2 ring-blue-100 outline-none transition-all" 
                value={selectedProduct?.application_method} 
                onChange={(e) => handleUpdate('application_method', e.target.value)}
              />
          </div>
        </div>
      </div>

      {/* צד שמאל: iPhone Simulator (LIVE PREVIEW) */}
      <div className="w-1/3 flex items-center justify-center border-r bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] relative z-10">
        <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[60px] border-[10px] border-slate-800 shadow-2xl overflow-hidden pointer-events-none">
          {/* מסך האייפון */}
          <div className="bg-white h-full w-full overflow-y-auto flex flex-col pt-12 px-4 pb-8">
            {/* בועת צ'אט לקוח */}
            <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none self-end max-w-[85%] text-xs shadow-md mb-4 font-bold">
              סבן, אני רוצה פרטים על {selectedProduct?.name}
            </div>
            
            {/* כרטיס המוצר שיוצג ללקוח */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedProduct?.image_url ? (
                <img src={selectedProduct.image_url} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-slate-200 flex items-center justify-center"><ImageIcon className="text-slate-400" /></div>
              )}
              
              <div className="p-4 space-y-3 text-right">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-[#0B2C63] text-lg leading-tight">{selectedProduct?.name}</h4>
                  <span className="text-blue-600 font-black text-xl">₪{selectedProduct?.price}</span>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{selectedProduct?.application_method || 'יש להזין שיטת יישום...'}</p>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                   <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 text-center">
                      <Calculator size={14} className="mx-auto text-blue-600 mb-1" />
                      <div className="text-[10px] font-black text-blue-900">{selectedProduct?.coverage_per_sqm || '0'} ק"ג/מ"ר</div>
                   </div>
                   <div className="bg-orange-50 p-2 rounded-xl border border-orange-100 text-center">
                      <Clock size={14} className="mx-auto text-orange-600 mb-1" />
                      <div className="text-[10px] font-black text-orange-900">{selectedProduct?.drying_time || '---'}</div>
                   </div>
                </div>

                {selectedProduct?.video_url && (
                  <Button variant="outline" className="w-full h-8 text-[10px] font-bold gap-2 mt-2 rounded-xl border-red-100 text-red-600 bg-red-50">
                    <PlayCircle size={14} /> צפה בסרטון הדרכה
                  </Button>
                )}

                <Button className="w-full bg-[#0B2C63] hover:bg-blue-800 text-white rounded-xl h-10 font-bold text-xs mt-2 shadow-lg shadow-blue-100">
                  הוסף לעגלה
                </Button>
              </div>
            </div>
          </div>
          {/* Notch & UI Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl"></div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700 rounded-full opacity-20"></div>
        </div>
        
        {/* תווית סימולטור */}
        <div className="absolute top-6 right-6 text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[3px] rotate-90 origin-right">
            <Smartphone size={12} /> Live iPhone 15 Preview
        </div>
      </div>
    </div>
  )
}
