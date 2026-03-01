"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Edit2, Save, X, Image as ImageIcon, 
  Video, List, Loader2, CheckCircle2 
} from "lucide-react";

export default function InventoryEditor() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("product_name", { ascending: true });
    
    if (data) setProducts(data);
    setLoading(false);
  }

  const startEdit = (product: any) => {
    setEditingId(product.sku);
    setEditForm({ ...product });
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
        metadata: typeof editForm.metadata === 'string' ? JSON.parse(editForm.metadata) : editForm.metadata
      })
      .eq("sku", sku);

    if (!error) {
      setEditingId(null);
      fetchProducts();
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => 
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.includes(searchTerm)
  );

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans" dir="rtl">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-blue-400 italic">SABAN EDITOR</h1>
          <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">ניהול והעשרת מוצרים</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="חפש מק''ט או שם מוצר..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 outline-none focus:border-blue-500 transition-all text-sm font-bold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-slate-900/50 rounded-[35px] border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
              <th className="p-6">מוצר / מק''ט</th>
              <th className="p-6">תיאור ומפרט</th>
              <th className="p-6 text-center">מדיה</th>
              <th className="p-6 text-center">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredProducts.map((p) => (
              <tr key={p.sku} className="hover:bg-white/5 transition-all">
                <td className="p-6">
                  <div className="font-black text-blue-400">{p.product_name}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">מק''ט: {p.sku}</div>
                </td>
                <td className="p-6 max-w-md">
                  {editingId === p.sku ? (
                    <div className="space-y-2">
                      <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-blue-500 h-20"
                        value={editForm.description}
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                      />
                      <input 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs outline-none focus:border-blue-500"
                        placeholder="כיסוי (למשל: 4 ק''ג למ''ר)"
                        value={editForm.coverage}
                        onChange={e => setEditForm({...editForm, coverage: e.target.value})}
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description || "אין תיאור למוצר זה"}
                    </div>
                  )}
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-4">
                    {editingId === p.sku ? (
                      <div className="space-y-2 w-full">
                        <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-2 border border-slate-700">
                          <ImageIcon size={14} className="text-blue-400" />
                          <input 
                            className="bg-transparent outline-none text-[10px] w-full"
                            placeholder="URL לתמונה"
                            value={editForm.image_url}
                            onChange={e => setEditForm({...editForm, image_url: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-2 border border-slate-700">
                          <Video size={14} className="text-red-400" />
                          <input 
                            className="bg-transparent outline-none text-[10px] w-full"
                            placeholder="URL ליוטיוב"
                            value={editForm.youtube_url}
                            onChange={e => setEditForm({...editForm, youtube_url: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <StatusIcon active={!!p.image_url} icon={<ImageIcon size={16}/>} label="תמונה" />
                        <StatusIcon active={!!p.youtube_url} icon={<Video size={16}/>} label="וידאו" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex justify-center">
                    {editingId === p.sku ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(p.sku)} className="bg-emerald-600 p-3 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">
                          <Save size={18} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="bg-slate-700 p-3 rounded-2xl hover:bg-slate-600 transition-all">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(p)} className="bg-blue-600/10 text-blue-400 p-4 rounded-3xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20 group">
                        <Edit2 size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader2 className="text-blue-500 animate-spin" size={48} />
        </div>
      )}
    </div>
  );
}

function StatusIcon({ active, icon, label }: { active: boolean, icon: any, label: string }) {
  return (
    <div className={`p-3 rounded-2xl flex flex-col items-center gap-1 border ${active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-800/50 border-slate-700 text-slate-600'}`}>
      {icon}
      <span className="text-[8px] font-black uppercase">{label}</span>
    </div>
  );
}
