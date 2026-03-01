"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Edit2, Save, X, Image as ImageIcon, 
  Video, Loader2, Sparkles, Package, AlertCircle,
  ExternalLink, ChevronRight
} from "lucide-react";
import { toast } from "sonner"; // וודא שהתקנת sonner או החלף ב-alert

export default function SabanInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isAutoFetching, setIsAutoFetching] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("product_name", { ascending: true });
    
    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  const startEdit = (product: any) => {
    setEditingSku(product.sku);
    setEditForm({ ...product });
  };

  // פונקציית הקסם לשליפת תמונה מה-AI
  const fetchAiImage = async (productName: string, sku: string) => {
    setIsAutoFetching(true);
    try {
      const res = await fetch('/api/get-image', { // הנתיב שבנינו לשליפת תמונה
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, sku })
      });
      const data = await res.json();
      if (data.success && data.image_url) {
        setEditForm((prev: any) => ({ ...prev, image_url: data.image_url }));
        toast.success("נמצאה תמונה מתאימה!");
      } else {
        toast.error("לא נמצאה תמונה אוטומטית.");
      }
    } catch (e) {
      toast.error("שגיאה בחיבור ל-AI");
    } finally {
      setIsAutoFetching(false);
    }
  };

  const handleSave = async (sku: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("inventory")
      .update({
        image_url: editForm.image_url,
        youtube_url: editForm.youtube_url,
        description: editForm.description,
        coverage: editForm.coverage,
        price: editForm.price
      })
      .eq("sku", sku);

    if (error) {
      toast.error("שגיאה בשמירה: " + error.message);
    } else {
      toast.success("המוצר עודכן!");
      setEditingSku(null);
      fetchProducts();
    }
    setLoading(false);
  };

  const filtered = products.filter(p => 
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 lg:p-12 font-sans" dir="rtl">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Package size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic">SABAN EDITOR</h1>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[4px]">ניהול מלאי והעשרת מדיה</p>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="חפש מק''ט או שם מוצר..."
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-blue-500/50 transition-all font-bold text-sm backdrop-blur-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Table Container */}
      <div className="max-w-7xl mx-auto bg-slate-900/30 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                <th className="p-6">פרטי מוצר</th>
                <th className="p-6">תיאור טכני</th>
                <th className="p-6 text-center">מדיה ומפרט</th>
                <th className="p-6 text-center">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.sku} className={`transition-all ${editingSku === p.sku ? 'bg-blue-600/5' : 'hover:bg-white/5'}`}>
                  {/* Name & SKU */}
                  <td className="p-6 align-top">
                    {editingSku === p.sku ? (
                      <input 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 font-black text-blue-400 outline-none"
                        value={editForm.product_name}
                        disabled // המק"ט והשם בדרך כלל קבועים מהמערכת המרכזית
                      />
                    ) : (
                      <div className="font-black text-lg text-white group flex items-center gap-2">
                        {p.product_name}
                      </div>
                    )}
                    <div className="text-[10px] font-bold text-slate-500 mt-1">מק''ט: {p.sku}</div>
                  </td>

                  {/* Description */}
                  <td className="p-6 align-top max-w-sm">
                    {editingSku === p.sku ? (
                      <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 h-28 leading-relaxed"
                        value={editForm.description}
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                      />
                    ) : (
                      <div className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {p.description || <span className="italic opacity-50 text-amber-500/50 underline decoration-dotted">חסר תיאור מוצר...</span>}
                      </div>
                    )}
                  </td>

                  {/* Media & Specs */}
                  <td className="p-6 align-top min-w-[280px]">
                    {editingSku === p.sku ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 group focus-within:border-blue-500/50">
                            <ImageIcon size={14} className="text-blue-400" />
                            <input 
                              className="w-full bg-transparent py-2 text-[10px] outline-none"
                              placeholder="URL לתמונה"
                              value={editForm.image_url || ''}
                              onChange={e => setEditForm({...editForm, image_url: e.target.value})}
                            />
                          </div>
                          <button 
                            onClick={() => fetchAiImage(p.product_name, p.sku)}
                            disabled={isAutoFetching}
                            className="bg-blue-600 hover:bg-blue-500 p-2 rounded-xl transition-all disabled:opacity-50"
                            title="שלוף תמונה בבינה מלאכותית"
                          >
                            {isAutoFetching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 group focus-within:border-red-500/50">
                          <Video size={14} className="text-red-400" />
                          <input 
                            className="w-full bg-transparent py-2 text-[10px] outline-none"
                            placeholder="קישור ליוטיוב"
                            value={editForm.youtube_url || ''}
                            onChange={e => setEditForm({...editForm, youtube_url: e.target.value})}
                          />
                        </div>
                        <input 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] outline-none"
                          placeholder="כיסוי (למשל: 4 ק''ג למ''ר)"
                          value={editForm.coverage || ''}
                          onChange={e => setEditForm({...editForm, coverage: e.target.value})}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex gap-3">
                           <StatusIcon active={!!p.image_url} icon={<ImageIcon size={16}/>} />
                           <StatusIcon active={!!p.youtube_url} icon={<Video size={16}/>} />
                        </div>
                        {p.image_url && (
                          <div className="relative group/img">
                            <img src={p.image_url} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                            <div className="absolute inset-0 bg-black/40 hidden group-hover/img:flex items-center justify-center rounded-xl cursor-pointer">
                              <ExternalLink size={12} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-6 align-middle">
                    <div className="flex justify-center">
                      {editingSku === p.sku ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSave(p.sku)} className="bg-emerald-600 hover:bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all">
                            <Save size={20} />
                          </button>
                          <button onClick={() => setEditingSku(null)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-2xl transition-all">
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(p)} className="bg-blue-600/10 text-blue-400 p-4 rounded-2xl hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all group">
                          <Edit2 size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-blue-500 animate-spin" size={60} />
            <p className="font-black tracking-[5px] text-xs text-blue-500 animate-pulse">SABAN LOADING...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ active, icon }: { active: boolean, icon: any }) {
  return (
    <div className={`p-3 rounded-xl border transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-800 border-white/5 text-slate-700 opacity-30'}`}>
      {icon}
    </div>
  );
}
