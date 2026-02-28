"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Save, Search, Play, Image as ImageIcon, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AdminPage() {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // שליפת כל המוצרים מהקאש
  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('answers_cache').select('*').order('updated_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  // עדכון מוצר ב-DB
  const handleUpdate = async (id: string, payload: any) => {
    const { error } = await supabase.from('answers_cache').update({ payload }).eq('id', id)
    if (!error) alert("המוצר עודכן בהצלחה!")
  }

  const filtered = products.filter(p => p.key.includes(search.toLowerCase()))

  return (
    <div className="p-8 bg-stone-50 min-h-screen dir-rtl" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0B2C63] mb-8">ניהול קטלוג סבן AI</h1>
        
        <div className="relative mb-6">
          <Search className="absolute right-3 top-3 text-stone-400" size={20} />
          <Input 
            className="pr-10 bg-white" 
            placeholder="חפש מוצר (למשל: סיקה 107)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filtered.map((product) => {
            const blueprint = product.payload
            const card = blueprint.components?.find((c: any) => c.type === "productCard")
            if (!card) return null

            return (
              <div key={product.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-500">שם המוצר ומק"ט</label>
                    <div className="text-lg font-bold mb-2">{card.props.name} ({card.props.sku})</div>
                    
                    <label className="text-xs font-bold text-stone-500">מחיר (₪)</label>
                    <Input 
                      className="mb-2" 
                      defaultValue={card.props.price} 
                      onChange={(e) => card.props.price = e.target.value}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 flex items-center gap-1">
                      <ImageIcon size={14} /> לינק לתמונה (PNG/JPG)
                    </label>
                    <Input 
                      defaultValue={card.props.image} 
                      onChange={(e) => card.props.image = e.target.value}
                    />

                    <label className="text-xs font-bold text-stone-500 flex items-center gap-1">
                      <Play size={14} /> לינק לסרטון YouTube
                    </label>
                    <Input 
                      defaultValue={card.props.videoUrl} 
                      onChange={(e) => card.props.videoUrl = e.target.value}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center border-t pt-4">
                  <div className="text-[10px] text-stone-400">עודכן לאחרונה: {new Date(product.updated_at).toLocaleString('he-IL')}</div>
                  <Button 
                    onClick={() => handleUpdate(product.id, blueprint)}
                    className="bg-[#0B2C63] hover:bg-[#08234d] text-white gap-2"
                  >
                    <Save size={16} /> שמור שינויים
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
