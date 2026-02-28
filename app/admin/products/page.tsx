"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Loader2, Smartphone, Save, Image as ImageIcon, 
  Video, Calculator, Clock, Search, ChevronLeft, Eye, Edit3, CheckCircle2 
} from "lucide-react"
import { toast } from "sonner"

export default function SabanCatalogStudio() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [previewMode, setPreviewMode] = useState(false) // מצב תצוגה מקדימה

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
    
    const { error } = await supabase
      .from('products')
      .update({
        name: selectedProduct.name,
        price: parseFloat(selectedProduct.price) || 0,
        image_url: selectedProduct.image_url,
        video_url: selectedProduct.video_url,
        coverage_per_sqm: selectedProduct.coverage_per_sqm,
        drying_time: selectedProduct.drying_time,
        application_method: selectedProduct.application_method,
        sku: selectedProduct.sku,
        features: selectedProduct.features || []
      })
      .eq('id', selectedProduct.id)
    
    if (!error) {
      toast.success(`המוצר ${selectedProduct.name} סונכרן בהצלחה!`)
      fetchProducts()
    } else {
      toast.error("שגיאה בסנכרון: " + error.message)
    }
    setSaving(false)
  }

  const filtered = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>

  return (
    <div className="flex h-screen bg-slate-100 text-right font-sans" dir="rtl">
      
      {/* ניווט מוצרים (Sidebar) */}
      <div className="w-1/4 bg-white border-l flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b space-y-4 bg-slate-50/50">
          <h2 className="text-2xl font-black text-[#0B2C63] tracking-tighter">Saban Catalog</h2>
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <Input 
              placeholder="חפש מוצר..." 
              className="pr-10 rounded-2xl bg-white border-slate-200 h-12 shadow-sm focus:ring-2 ring-blue-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className={`w-full p-4 rounded-[22px] flex items-center justify-between transition-all duration-300 ${
                selectedProduct?.id === p.id 
                ? 'bg-[#0B2C63] text-white shadow-[0_10px_20px_rgba(11,44,99,0.2)]' 
                : 'hover:bg-blue-50 text-slate-600 border border-transparent'
              }`}
            >
              <div className="text-right">
                <div className="font-bold text-[14px]">{p.name}</div>
                <div className={`text-[11px] mt-0.5 font-medium ${selectedProduct?.id === p.id ? 'text-blue-200' : 'text-slate-400'}`}>
                   ₪{p.price || '---'} | {p.sku || 'ללא מק"ט'}
                </div>
              </div>
              <ChevronLeft size={16} className={selectedProduct?.id === p.id ? 'opacity-100' : 'opacity-20'} />
            </button>
          ))}
        </div>
      </div>

      {/* אזור העריכה המרכזי */}
      <div className="flex-1 p-10 overflow-y-auto bg-slate-50/30 relative">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase">Admin Mode</span>
               <span className="text-slate-300">|</span>
               <span className="text-slate-400 font-bold text-sm">עריכת מוצר בודד</span>
            </div>
            <h1 className="text-4xl font-black text-[#0B2C63] tracking-tight">{selectedProduct?.name || 'טוען מוצר...'}</h1>
          </div>
          
          <div className="flex gap-3">
             <Button 
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
                className={`rounded-2xl h-14 px-6 gap-2 font-black border-2 transition-all ${previewMode ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-200 text-slate-600'}`}
             >
                {previewMode ? <Edit3 size={20} /> : <Eye size={20} />}
                {previewMode ? 'חזור לעריכה' : 'תצוגה מקדימה'}
             </Button>
             <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-[#0B2C63] hover:bg-blue-800 text-white px-10 rounded-2xl h-14 gap-3 shadow-xl shadow-blue-100 text-lg font-black transition-all active:scale-95"
             >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={22} />}
                שמור קטלוג
             </Button>
          </div>
        </div>

        {/* טופס עריכה נושם */}
        <div className="grid grid-cols-1 gap-8 max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="bg-white p-8 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-tighter">שם המוצר בקטלוג</label>
                <Input 
                   value={selectedProduct?.name || ''} 
                   onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})} 
                   className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-tighter">מחיר לצרכן (₪)</label>
                <Input 
                   type="number" 
                   value={selectedProduct?.price || ''} 
                   onChange={(e) => setSelectedProduct({...selectedProduct, price: e.target.value})} 
                   className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-blue-600" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-50">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 flex items-center gap-2 mr-2"><ImageIcon size={14}/> לינק לתמונת מוצר</label>
                <Input 
                   value={selectedProduct?.image_url || ''} 
                   onChange={(e) => setSelectedProduct({...selectedProduct, image_url: e.target.value})} 
                   className="rounded-2xl h-14 border-slate-100 bg-slate-50/50" 
                   placeholder="https://..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 flex items-center gap-2 mr-2"><Video size={14}/> לינק לסרטון (YouTube)</label>
                <Input 
                   value={selectedProduct?.video_url || ''} 
                   onChange={(e) => setSelectedProduct({...selectedProduct, video_url: e.target.value})} 
                   className="rounded-2xl h-14 border-slate-100 bg-slate-50/50"
                   placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 space-y-8">
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-blue-600 flex items-center gap-2 mr-2"><Calculator size={14}/> צריכה ממוצעת</label>
                  <Input 
                    value={selectedProduct?.coverage_per_sqm || ''} 
                    onChange={(e) => setSelectedProduct({...selectedProduct, coverage_per_sqm: e.target.value})} 
                    className="rounded-2xl h-14 bg-blue-50/30 border-blue-100 font-bold"
                    placeholder="למשל: 1.5 קג למר"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-orange-600 flex items-center gap-2 mr-2"><Clock size={14}/> זמן ייבוש</label>
                  <Input 
                    value={selectedProduct?.drying_time || ''} 
                    onChange={(e) => setSelectedProduct({...selectedProduct, drying_time: e.target.value})} 
                    className="rounded-2xl h-14 bg-orange-50/30 border-orange-100 font-bold"
                    placeholder="למשל: 24 שעות"
                  />
                </div>
             </div>
             <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 mr-2 italic">הוראות יישום מפורטות (יופיעו בצאט)</label>
                <textarea 
                  className="w-full h-40 p-5 rounded-[30px] border border-slate-100 bg-slate-50/50 text-[14px] leading-relaxed focus:bg-white focus:ring-2 ring-blue-50 outline-none transition-all resize-none font-medium"
                  value={selectedProduct?.application_method || ''}
                  onChange={(e) => setSelectedProduct({...selectedProduct, application_method: e.target.value})}
                />
             </div>
          </div>
        </div>
      </div>

      {/* iPhone 15 Pro - הסימולטור הנושם */}
      <div className="w-[450px] flex items-center justify-center bg-white border-r shadow-[-20px_0_50px_rgba(0,0,0,0.02)] z-10">
        <div className="relative w-[320px] h-[660px] bg-slate-950 rounded-[60px] border-[10px] border-[#1e1e1e] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
          
          {/* מסך האייפון */}
          <div className={`bg-[#fbfbfb] h-full w-full flex flex-col pt-12 px-5 transition-all duration-500 ${previewMode ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'}`}>
            
            {/* בועת צאט לקוח */}
            <div className="bg-[#0B2C63] text-white p-4 rounded-[22px] rounded-tr-none self-end max-w-[85%] text-[12px] mb-6 font-bold shadow-xl shadow-blue-100/50 animate-in slide-in-from-right-4">
               שלום סבן, תן לי פרטים טכניים על {selectedProduct?.name || 'המוצר'}
            </div>
            
            {/* כרטיס מוצר סבן המקורי והנושם */}
            <div className="bg-white rounded-[40px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-white animate-in zoom-in-95 duration-500">
               <div className="relative h-48 w-full bg-slate-100">
                  {selectedProduct?.image_url ? (
                    <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                       <ImageIcon size={40} strokeWidth={1} />
                       <span className="text-[10px] font-bold">ממתין לתמונה...</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[17px] font-black text-[#0B2C63] shadow-md border border-white/50">
                    ₪{selectedProduct?.price || '0'}
                  </div>
               </div>

               <div className="p-6 text-right space-y-4">
                  <h4 className="font-black text-[#0B2C63] text-xl leading-none tracking-tight">{selectedProduct?.name}</h4>
                  
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-3 font-medium min-h-[33px]">
                    {selectedProduct?.application_method || 'הוסף שיטת יישום כדי שהלקוח יבין איך לעבוד עם החומר...'}
                  </p>
                  
                  {/* נתונים טכניים בעיצוב נקי */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                     <div className="bg-slate-50/80 p-3.5 rounded-[24px] border border-slate-100 text-center">
                        <Calculator size={16} className="mx-auto text-blue-600 mb-1.5 opacity-80" />
                        <div className="text-[10px] font-black text-slate-800 tracking-tighter">{selectedProduct?.coverage_per_sqm || 'לפי דרישה'}</div>
                     </div>
                     <div className="bg-slate-50/80 p-3.5 rounded-[24px] border border-slate-100 text-center">
                        <Clock size={16} className="mx-auto text-orange-600 mb-1.5 opacity-80" />
                        <div className="text-[10px] font-black text-slate-800 tracking-tighter">{selectedProduct?.drying_time || 'בבדיקה'}</div>
                     </div>
                  </div>

                  <div className="pt-2">
                    <button className="w-full py-4 rounded-[24px] bg-[#0B2C63] text-white text-[12px] font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                       הוספה להזמנה
                    </button>
                  </div>
               </div>
            </div>

            {/* סימון מצב Preview */}
            {!previewMode && (
               <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-200 shadow-xl flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest animate-bounce">
                     <Eye size={16} /> לחץ על תצוגה מקדימה
                  </div>
               </div>
            )}
          </div>

          {/* Notch & UI */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-black rounded-b-[24px]"></div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-200 rounded-full opacity-30"></div>
        </div>
        
        {/* תוויות צד */}
        <div className="absolute top-8 left-8 text-[10px] font-black text-slate-300 flex items-center gap-3 uppercase tracking-[6px] rotate-90 origin-left">
            <Smartphone size={16} /> SabanOS Live Simulator
        </div>
      </div>
    </div>
  )
}
