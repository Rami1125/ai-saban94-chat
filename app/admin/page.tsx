"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Save, Search, Play, Image as ImageIcon, Plus, Loader2, CheckCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner" // וודא שמותקן או שתחליף ב-alert

// התחברות ל-Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  // 1. שליפת כל המוצרים מהקאש
  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('answers_cache')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // 2. הוספת מוצר חדש מאפס
  const addNewProduct = async () => {
    const name = prompt("הכנס שם מוצר (למשל: דבק 116):")
    if (!name) return

    const newPayload = {
      text: `מידע טכני ומחיר עבור ${name}:`,
      source: "Saban AI - Verified",
      components: [
        {
          type: "productCard",
          props: {
            name: name,
            sku: "SKU-NEW",
            price: "0",
            image: "",
            videoUrl: ""
          }
        }
      ]
    }

    const { error } = await supabase.from('answers_cache').insert([
      { 
        key: `chat:v1:${name.toLowerCase().trim()}`, 
        payload: newPayload 
      }
    ])

    if (!error) {
      toast.success("המוצר נוסף בהצלחה!")
      fetchProducts()
    } else {
      toast.error("שגיאה בהוספת המוצר")
    }
  }

  // 3. עדכון מוצר קיים
  const handleUpdate = async (id: string, payload: any) => {
    setIsSaving(id)
    const { error } = await supabase
      .from('answers_cache')
      .update({ payload, updated_at: new Date() })
      .eq('id', id)

    if (!error) {
      toast.success("הנתונים נשמרו בבסיס הנתונים")
    } else {
      toast.error("שגיאה בשמירה")
    }
    setIsSaving(null)
  }

  const filtered = products.filter(p => p.key.includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B2C63]">ניהול קטלוג סבן AI</h1>
            <p className="text-slate-500">ערוך מחירים, תמונות וסרטוני הדרכה שיופיעו בצ'אט</p>
          </div>
          <Button onClick={addNewProduct} className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Plus size={18} /> הוסף מוצר חדש
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input 
            className="pr-10 h-12 bg-white shadow-sm border-slate-200 text-lg" 
            placeholder="חפש מוצר לפי שם או מפתח..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Products List */}
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#0B2C63]" size={48} /></div>
        ) : (
          <div className="grid gap-6">
            {filtered.map((product) => {
              const blueprint = product.payload
              const card = blueprint.components?.find((c: any) => c.type === "productCard")
              
              if (!card) return null

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:border-[#0B2C63] transition-colors">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-[#0B2C63] font-bold tracking-tighter">
                          {card.props.sku}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{card.props.name}</h2>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle size={12} /> Verified
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* עמודה 1: מחיר */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">מחיר ליחידה (₪)</label>
                        <Input 
                          className="font-mono text-lg"
                          defaultValue={card.props.price} 
                          onChange={(e) => card.props.price = e.target.value}
                        />
                      </div>

                      {/* עמודה 2: תמונה */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-1">
                          <ImageIcon size={14} /> לינק לתמונת מוצר
                        </label>
                        <Input 
                          placeholder="https://..."
                          defaultValue={card.props.image} 
                          onChange={(e) => card.props.image = e.target.value}
                        />
                        {card.props.image && (
                          <a href={card.props.image} target="_blank" className="text-[10px] text-blue-500 flex items-center gap-1 hover:underline">
                            <ExternalLink size={10} /> צפה בתמונה הנוכחית
                          </a>
                        )}
                      </div>

                      {/* עמודה 3: וידאו */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-1">
                          <Play size={14} /> לינק ליוטיוב
                        </label>
                        <Input 
                          placeholder="https://youtube.com/..."
                          defaultValue={card.props.videoUrl} 
                          onChange={(e) => card.props.videoUrl = e.target.value}
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Key: {product.key} | מזהה: {product.id.split('-')[0]}
                      </div>
                      <Button 
                        disabled={isSaving === product.id}
                        onClick={() => handleUpdate(product.id, blueprint)}
                        className="bg-[#0B2C63] hover:bg-[#08234d] text-white w-full md:w-auto px-8"
                      >
                        {isSaving === product.id ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="ml-2" />}
                        {isSaving === product.id ? "שומר..." : "שמור שינויים"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center p-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 mt-8">
            <p className="text-slate-400">לא נמצאו מוצרים התואמים לחיפוש שלך.</p>
          </div>
        )}
      </div>
    </div>
  )
}
