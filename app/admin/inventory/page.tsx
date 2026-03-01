"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Edit2, Save, X, Image as ImageIcon, 
  Video, Loader2, Sparkles, Package, 
  ShoppingCart, ExternalLink, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

// הגדרת הקומפוננטה כייצוא ברירת מחדל
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
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("product_name", { ascending: true });
      if (!error) setProducts(data || []);
    } finally {
      setLoading(false);
    }
  }

  const startEdit = (product: any) => {
    setEditingSku(product.sku);
    setEditForm({ ...product });
  };

  const handleSave = async (sku: string) => {
    setLoading(true);
    try {
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

      if (error) throw error;
      toast.success("עודכן בהצלחה!");
      setEditingSku(null);
      fetchProducts();
    } catch (e: any) {
      toast.error("שגיאה בשמירה: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => 
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 lg:p-12 font-sans" dir="rtl">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <Package size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">Saban Editor</h1>
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">ניהול מלאי ואוטומציה</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="חפש מוצר או מק''ט..."
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="max-w-7xl mx-auto bg-slate-900/30 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-xl shadow-2xl">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
              <th className="p-6">מוצר</th>
              <th className="p-6">תיאור טכני</th>
              <th className="p-6 text-center">מדיה ומפרט</th>
              <th className="p-6 text-center">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((p) => (
              <tr key={p.sku} className={`transition-all ${editingSku === p.sku ? 'bg-blue-600/5' : 'hover:bg-white/5'}`}>
                <td className="p-6 align-top">
                  <div className="font-black text-lg text-white">{p.product_name}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">מק''ט: {p.sku}</div>
                </td>
                <td className="p-6 align-top max-w-sm">
                  {editingSku === p.sku ? (
                    <textarea 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 h-28 leading-relaxed"
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                    />
                  ) : (
                    <div className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {p.description || "חסר תיאור מוצר..."}
                    </div>
                  )}
                </td>
                <td className="p-6 align-top min-w-[250px]">
                  {editingSku === p.sku ? (
                    <div className="space-y-3">
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] outline-none" placeholder="URL תמונה" value={editForm.image_url || ''} onChange={e => setEditForm({...editForm, image_url: e.target.value})}/>
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] outline-none" placeholder="קישור וידאו" value={editForm.youtube_url || ''} onChange={e => setEditForm({...editForm, youtube_url: e.target.value})}/>
                      <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-[10px] outline-none" placeholder="כיסוי (מ''ר)" value={editForm.coverage || ''} onChange={e => setEditForm({...editForm, coverage: e.target.value})}/>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                       <div className="flex gap-2">
                          <StatusIndicator active={!!p.image_url} icon={<ImageIcon size={14}/>} />
                          <StatusIndicator active={!!p.youtube_url} icon={<Video size={14}/>} />
                       </div>
                       {p.image_url && <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover" />}
                    </div>
                  )}
                </td>
                <td className="p-6 align-middle text-center">
                  {editingSku === p.sku ? (
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleSave(p.sku)} className="bg-emerald-600 p-3 rounded-2xl"><Save size={18}/></button>
                      <button onClick={() => setEditingSku(null)} className="bg-slate-700 p-3 rounded-2xl"><X size={18}/></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(p)} className="bg-blue-600/10 text-blue-400 p-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={18}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><Loader2 className="animate-spin text-blue-500" size={48}/></div>}
    </div>
  );
}

function StatusIndicator({ active, icon }: { active: boolean, icon: any }) {
  return (
    <div className={`p-2 rounded-lg border ${active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-800 border-white/5 text-slate-700'}`}>
      {icon}
    </div>
  );
}
