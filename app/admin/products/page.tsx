"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Loader2, Smartphone, Save, Image as ImageIcon, 
  Video, Calculator, Clock, Search, ChevronLeft, Eye, Edit3
} from "lucide-react"
import { toast } from "sonner"

export default function SabanInventoryStudio() {
  const [items, setItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [previewMode, setPreviewMode] = useState(true)

  useEffect(() => { fetchInventory() }, [])

  const fetchInventory = async () => {
    setLoading(true)
    const { data } = await supabase.from('inventory').select('*').order('product_name')
    if (data) {
      setItems(data)
      if (!selectedItem) setSelectedItem(data[0])
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!selectedItem) return
    setSaving(true)
    
    const { error } = await supabase
      .from('inventory')
      .update({
        price: parseFloat(selectedItem.price) || 0,
        image_url: selectedItem.image_url,
        video_url: selectedItem.video_url,
        coverage_per_sqm: selectedItem.coverage_per_sqm,
        drying_time: selectedItem.drying_time,
        application_method: selectedItem.application_method,
      })
      .eq('sku', selectedItem.sku) // שימוש ב-SKU כמזהה ייחודי מהמלאי
    
    if (!error) {
      toast.success(`המלאי עבור ${selectedItem.product_name} עודכן!`)
      fetchInventory()
    } else {
      toast.error("שגיאה בסנכרון: " + error.message)
    }
    setSaving(false)
  }

  const filtered = items.filter(p => p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>

  return (
    <div className="flex h-screen bg-slate-100 text-right font-sans" dir="rtl">
      
      {/* רשימת מלאי (Sidebar) */}
      <div className="w-1/4 bg-white border-l flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b space-y-4">
          <h2 className="text-2xl font-black text-[#0B2C63]">ניהול מלאי סבן</h2>
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <Input 
              placeholder="חפש מוצר במלאי..." 
              className="pr-10 rounded-2xl bg-slate-50 border-none h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((item) => (
            <button
              key={item.sku}
              onClick={() => setSelectedItem(item)}
              className={`w-full p-4 rounded-[22px] text-right transition-all ${
                selectedItem?.sku === item.sku ? 'bg-[#0B2C63] text-white shadow-lg' : 'hover:bg-blue-50 text-slate-600'
              }`}
            >
              <div className="font-bold text-sm">{item.product_name}</div>
              <div className="text-[10px] opacity-60">SKU: {item.sku} | {item.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* אזור עריכת נתונים טכניים */}
      <div className="flex-1 p-10 overflow-y-auto bg-slate-50/30">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-[#0B2C63]">עריכת מוצר במלאי</h1>
          <div className="flex gap-3">
            <Button onClick={() => setPreviewMode(!previewMode)} variant="outline" className="rounded-2xl h-12 px-6 gap-2 font-bold border-2">
              {previewMode ? <Edit3 size={18} /> : <Eye size={18} />}
              {previewMode ? 'ערוך נתונים' : 'צפה בסימולטור'}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#0B2C63] hover:bg-blue-800 text-white px-8 rounded-2xl h-12 gap-2 shadow-xl">
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              עדכן מלאי
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-3xl">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2">מחיר (₪)</label>
                <Input value={selectedItem?.price || ''} onChange={(e) => setSelectedItem({...selectedItem, price: e.target.value})} className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2">לינק לתמונה</label>
                <Input value={selectedItem?.image_url || ''} onChange={(e) => setSelectedItem({...selectedItem, image_url: e.target.value})} className="rounded-xl h-12" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-blue-600 flex items-center gap-2"><Calculator size={14}/> כיסוי למ"ר</label>
                <Input value={selectedItem?.coverage_per_sqm || ''} onChange={(e) => setSelectedItem({...selectedItem, coverage_per_sqm: e.target.value})} className="rounded-xl h-12 bg-blue-50/30" placeholder="למשל: 1.5 קג/מר" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-orange-600 flex items-center gap-2"><Clock size={14}/> זמן ייבוש</label>
                <Input value={selectedItem?.drying_time || ''} onChange={(e) => setSelectedItem({...selectedItem, drying_time: e.target.value})} className="rounded-xl h-12 bg-orange-50/30" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">שיטת יישום</label>
              <textarea 
                className="w-full h-32 p-4 rounded-2xl border bg-slate-50 text-sm focus:ring-2 ring-blue-50 outline-none"
                value={selectedItem?.application_method || ''}
                onChange={(e) => setSelectedItem({...selectedItem, application_method: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* iPhone Simulator - העיצוב הנושם */}
      <div className="w-[400px] flex items-center justify-center bg-white border-r">
        <div className="relative w-[300px] h-[600px] bg-slate-950 rounded-[50px] border-[8px] border-slate-900 shadow-2xl overflow-hidden">
          <div className={`bg-white h-full w-full flex flex-col pt-10 px-4 transition-all ${previewMode ? 'opacity-100' : 'opacity-30'}`}>
            <div className="bg-[#0B2C63] text-white p-3 rounded-2xl rounded-tr-none self-end max-w-[85%] text-[10px] mb-4 font-bold">
               סבן, מה לגבי {selectedItem?.product_name}?
            </div>
            <div className="bg-white rounded-[35px] overflow-hidden shadow-2xl border border-slate-50">
               <img src={selectedItem?.image_url || 'https://via.placeholder.com/300x200?text=Saban+OS'} className="w-full h-40 object-cover" />
               <div className="p-5 text-right space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-[#0B2C63] text-sm">{selectedItem?.product_name}</h4>
                    <span className="text-blue-600 font-black text-lg">₪{selectedItem?.price || '0'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                     <div className="bg-slate-50 p-2 rounded-2xl text-center border border-slate-100">
                        <Calculator size={12} className="mx-auto text-blue-600 mb-1" />
                        <div className="text-[9px] font-black text-slate-800">{selectedItem?.coverage_per_sqm || 'לפי דרישה'}</div>
                     </div>
                     <div className="bg-slate-50 p-2 rounded-2xl text-center border border-slate-100">
                        <Clock size={12} className="mx-auto text-orange-600 mb-1" />
                        <div className="text-[9px] font-black text-slate-800">{selectedItem?.drying_time || 'בבדיקה'}</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
        </div>
      </div>
    </div>
  )
}
