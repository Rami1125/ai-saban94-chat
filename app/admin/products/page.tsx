"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Smartphone, Save, Image as ImageIcon, Video, Calculator, Clock, Search, ChevronLeft } from "lucide-react"
import { toast } from "sonner"

export default function SabanCatalogStudio() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => { fetchProducts() }, [])

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
    
    // הצלבה מדויקת לפי שמות העמודות ב-Database שלך
    const { error } = await supabase
      .from('products')
      .update({
        name: selectedProduct.name,
        price: parseFloat(selectedProduct.price) || 0,
        image_url: selectedProduct.image_url,
        video_url: selectedProduct.video_url,
        coverage_per_sqm: parseFloat(selectedProduct.coverage_per_sqm) || 0,
        drying_time: selectedProduct.drying_time,
        application_method: selectedProduct.application_method,
        sku: selectedProduct.sku
      })
      .eq('id', selectedProduct.id)
    
    if (!error) {
      toast.success(`המוצר ${selectedProduct.name} עודכן בהצלחה!`)
      fetchProducts()
    } else {
      toast.error("שגיאה בשמירה: " + error.message)
    }
    setSaving(false)
  }

  const filtered = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>

  return (
    <div className="flex h-screen bg-slate-100 text-right font-sans" dir="rtl">
      
      {/* ניווט קטלוג (צד ימין) */}
      <div className="w-1/4 bg-white border-l flex flex-col shadow-xl">
        <div className="p-6 border-b space-y-4">
          <h2 className="text-2xl font-black text-[#0B2C63]">הקטלוג שלי</h2>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
            <Input 
              placeholder="חפש מוצר..." 
              className="pr-10 rounded-2xl bg-slate-50 border-none h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                selectedProduct?.id === p.id ? 'bg-[#0B2C63] text-white shadow-lg' : 'hover:bg-blue-50 text-slate-600'
              }`}
            >
              <div className="text-right">
                <div className="font-bold text-sm">{p.name}</div>
                <div className={`text-[10px] ${selectedProduct?.id === p.id ? 'text-blue-200' : 'text-slate-400'}`}>
                   ₪{p.price || '---'} | מק"ט: {p.sku || 'אין'}
                </div>
              </div>
              <ChevronLeft size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* אזור עריכה (מרכז) */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-[#0B2C63]">עורך מוצר מקצועי</h1>
            <p className="text-slate-400 mt-1 font-medium italic underline decoration-blue-200">SabanOS v2.0</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-10 rounded-2xl h-14 gap-3 shadow-xl shadow-green-100 text-lg font-black"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={22} />}
            שמור שינויים
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-4xl">
          {/* נתונים בסיסיים */}
          <div className="bg-white p-8 rounded-[35px] shadow-sm border space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 pr-2 uppercase">שם המוצר</label>
                <Input value={selectedProduct?.name || ''} onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})} className="rounded-xl h-12 border-slate-100 focus:ring-2 ring-blue-50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 pr-2 uppercase tracking-widest">מחיר (₪)</label>
                <Input type="number" value={selectedProduct?.price || ''} onChange={(e) => setSelectedProduct({...selectedProduct, price: e.target.value})} className="rounded-xl h-12 border-slate-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 flex items-center gap-2 pr-2"><ImageIcon size={14}/> לינק לתמונה</label>
                <Input value={selectedProduct?.image_url || ''} onChange={(e) => setSelectedProduct({...selectedProduct, image_url: e.target.value})} className="rounded-xl h-12 border-slate-100" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 flex items-center gap-2 pr-2"><Video size={14}/> לינק לסרטון (YouTube)</label>
                <Input value={selectedProduct?.video_url || ''} onChange={(e) => setSelectedProduct({...selectedProduct, video_url: e.target.value})} className="rounded-xl h-12 border-slate-100" />
              </div>
            </div>
          </div>

          {/* נתונים טכניים */}
          <div className="bg-white p-8 rounded-[35px] shadow-sm border space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-blue-600 flex items-center gap-2 pr-2"><Calculator size={14}/> צריכה למ"ר (ק"ג)</label>
                  <Input type="number" step="0.1" value={selectedProduct?.coverage_per_sqm || ''} onChange={(e) => setSelectedProduct({...selectedProduct, coverage_per_sqm: e.target.value})} className="rounded-xl h-12 bg-blue-50/50 border-blue-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-orange-600 flex items-center gap-2 pr-2"><Clock size={14}/> זמן ייבוש</label>
                  <Input value={selectedProduct?.drying_time || ''} onChange={(e) => setSelectedProduct({...selectedProduct, drying_time: e.target.value})} className="rounded-xl h-12 bg-orange-50/50 border-orange-100" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 pr-2 italic">שיטת יישום מפורטת</label>
                <textarea 
                  className="w-full h-32 p-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 ring-blue-50 outline-none"
                  value={selectedProduct?.application_method || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, application_method: e.target.value})}
                />
             </div>
          </div>
        </div>
      </div>

      {/* iPhone Live Preview (שמאל) */}
      <div className="w-1/3 flex items-center justify-center bg-white border-r shadow-2xl relative">
        <div className="relative w-[320px] h-[650px] bg-slate-950 rounded-[60px] border-[10px] border-slate-900 shadow-2xl overflow-hidden pointer-events-none">
          <div className="bg-white h-full w-full flex flex-col pt-12 px-5">
            <div className="bg-[#0B2C63] text-white p-3 rounded-2xl rounded-tr-none self-end max-w-[85%] text-[11px] mb-5 font-bold shadow-lg">
               סבן, תן לי פרטים על {selectedProduct?.name}
            </div>
            
            <div className="bg-white rounded-[30px] border border-slate-100 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
               {selectedProduct?.image_url ? (
                 <img src={selectedProduct.image_url} className="w-full h-44 object-cover" />
               ) : (
                 <div className="w-full h-44 bg-slate-100 flex items-center justify-center text-slate-300"><ImageIcon size={40} /></div>
               )}
               <div className="p-5 space-y-3 text-right">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-[#0B2C63] text-lg leading-none">{selectedProduct?.name}</h4>
                    <span className="text-blue-600 font-black text-xl leading-none">₪{selectedProduct?.price || '0'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-3 font-medium">
                    {selectedProduct?.application_method || 'ממתין לעדכון שיטת יישום...'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                     <div className="bg-blue-50 p-2.5 rounded-2xl border border-blue-100 text-center">
                        <Calculator size={14} className="mx-auto text-blue-600 mb-1" />
                        <div className="text-[10px] font-black text-blue-900">{selectedProduct?.coverage_per_sqm || '0'} ק"ג/מ"ר</div>
                     </div>
                     <div className="bg-orange-50 p-2.5 rounded-2xl border border-orange-100 text-center">
                        <Clock size={14} className="mx-auto text-orange-600 mb-1" />
                        <div className="text-[10px] font-black text-orange-900">{selectedProduct?.drying_time || '---'}</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-3xl"></div>
        </div>
        <div className="absolute top-6 right-6 text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[4px] rotate-90 origin-right">
            <Smartphone size={14} /> iPhone 15 Pro Live
        </div>
      </div>
    </div>
  )
}
