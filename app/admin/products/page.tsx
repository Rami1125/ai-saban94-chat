"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Smartphone, Save, Image as ImageIcon, Video, Calculator, Clock, PlayCircle, Search, ChevronLeft } from "lucide-react"
import { toast } from "sonner"

export default function CatalogManager() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('name')
    if (data) {
      setProducts(data)
      if (!selectedProduct) setSelectedProduct(data[0])
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!selectedProduct) return
    setSaving(true)
    const { error } = await supabase
      .from('products')
      .update(selectedProduct)
      .eq('id', selectedProduct.id)
    
    if (!error) {
      toast.success(`השינויים ב${selectedProduct.name} נשמרו!`)
      fetchProducts() // רענון הרשימה
    } else {
      toast.error("שגיאה בשמירה")
    }
    setSaving(false)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>

  return (
    <div className="flex h-screen bg-slate-50 text-right" dir="rtl">
      
      {/* 1. סרגל בחירת מוצר (הניווט לקטלוג) */}
      <div className="w-1/4 bg-white border-l shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-black text-[#0B2C63] mb-4 text-right">הקטלוג שלי</h2>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
            <Input 
              placeholder="חיפוש מוצר..." 
              className="pr-10 rounded-xl bg-slate-50 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                selectedProduct?.id === p.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'hover:bg-blue-50 text-slate-600'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-right">{p.name}</span>
                <span className={`text-[10px] ${selectedProduct?.id === p.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  ₪{p.price}
                </span>
              </div>
              <ChevronLeft size={16} className={selectedProduct?.id === p.id ? 'opacity-100' : 'opacity-20'} />
            </button>
          ))}
        </div>
      </div>

      {/* 2. עורך המוצר (מרכז המסך) */}
      <div className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-black text-[#0B2C63]">עריכת מוצר</h1>
            <p className="text-slate-400 font-medium">עדכן פרטים ומדיה עבור הלקוחות</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-8 rounded-2xl h-12 gap-2 shadow-lg shadow-green-100"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span className="font-bold">שמור שינויים בקטלוג</span>
          </Button>
        </div>

        <div className="grid gap-6">
          {/* נתונים טכניים ומדיה */}
          <div className="bg-white p-8 rounded-[32px] border shadow-sm space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">שם המוצר</label>
                  <Input 
                    value={selectedProduct?.name || ''} 
                    onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
                    className="rounded-xl border-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">מחיר לצרכן</label>
                  <Input 
                    type="number"
                    value={selectedProduct?.price || ''} 
                    onChange={(e) => setSelectedProduct({...selectedProduct, price: e.target.value})}
                    className="rounded-xl border-slate-100"
                  />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 flex items-center gap-2">
                    <ImageIcon size={14} /> קישור לתמונה
                  </label>
                  <Input 
                    placeholder="הדבק לינק לתמונה"
                    value={selectedProduct?.image_url || ''} 
                    onChange={(e) => setSelectedProduct({...selectedProduct, image_url: e.target.value})}
                    className="rounded-xl border-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 flex items-center gap-2">
                    <Video size={14} /> קישור לסרטון הדרכה
                  </label>
                  <Input 
                    placeholder="לינק ליוטיוב"
                    value={selectedProduct?.video_url || ''} 
                    onChange={(e) => setSelectedProduct({...selectedProduct, video_url: e.target.value})}
                    className="rounded-xl border-slate-100"
                  />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-xs font-black text-blue-500 flex items-center gap-2">
                    <Calculator size={14} /> צריכה למ"ר (ק"ג)
                  </label>
                  <Input 
                    type="number" step="0.1"
                    value={selectedProduct?.coverage_per_sqm || ''} 
                    onChange={(e) => setSelectedProduct({...selectedProduct, coverage_per_sqm: e.target.value})}
                    className="rounded-xl border-blue-50 bg-blue-50/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-orange-500 flex items-center gap-2">
                    <Clock size={14} /> זמן ייבוש
                  </label>
                  <Input 
                    placeholder="למשל: 4 שעות"
                    value={selectedProduct?.drying_time || ''} 
                    onChange={(e) => setSelectedProduct({...selectedProduct, drying_time: e.target.value})}
                    className="rounded-xl border-orange-50 bg-orange-50/30"
                  />
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400">שיטת יישום (יוצג ללקוח בצ'אט)</label>
                <textarea 
                  className="w-full h-32 p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 ring-blue-50 outline-none"
                  value={selectedProduct?.application_method || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, application_method: e.target.value})}
                />
             </div>
          </div>
        </div>
      </div>

      {/* 3. iPhone Preview (התוצאה באון ליין) */}
      <div className="w-1/3 flex items-center justify-center bg-white border-r shadow-2xl relative z-20">
         <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[55px] border-[10px] border-slate-800 shadow-2xl overflow-hidden pointer-events-none">
            <div className="bg-white h-full w-full flex flex-col pt-12 px-4">
               <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none self-end max-w-[85%] text-xs mb-4 font-bold shadow-md">
                 סבן, מה לגבי {selectedProduct?.name}?
               </div>
               
               <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl">
                  {selectedProduct?.image_url ? (
                    <img src={selectedProduct.image_url} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-slate-200 flex items-center justify-center"><ImageIcon className="text-slate-400" /></div>
                  )}
                  <div className="p-4 space-y-2 text-right">
                    <h4 className="font-black text-[#0B2C63] text-lg">₪{selectedProduct?.price}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">{selectedProduct?.application_method || 'ממתין לתיאור יישום...'}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                       <div className="bg-blue-50 p-2 rounded-xl text-center">
                          <Calculator size={14} className="mx-auto text-blue-600" />
                          <div className="text-[10px] font-black">{selectedProduct?.coverage_per_sqm || '0'} ק"ג/מ"ר</div>
                       </div>
                       <div className="bg-orange-50 p-2 rounded-xl text-center">
                          <Clock size={14} className="mx-auto text-orange-600" />
                          <div className="text-[10px] font-black">{selectedProduct?.drying_time || '---'}</div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl"></div>
         </div>
         <div className="absolute top-6 right-6 text-[10px] font-black text-slate-300 uppercase rotate-90 origin-right tracking-widest">
            SabanOS Live Preview
         </div>
      </div>
    </div>
  )
}
