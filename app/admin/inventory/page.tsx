"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Edit2, Save, X, Image as ImageIcon, 
  Video, Loader2, Check, AlertCircle, Trash2
} from "lucide-react";
import { toast } from "sonner"; // או useToast מהפרויקט שלך

export default function SabanInventoryEditor() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>({});

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase.from("inventory").select("*").order("product_name");
    if (error) toast.error("שגיאה בטעינת המלאי");
    else setProducts(data || []);
    setLoading(false);
  }

  const startEdit = (p: any) => {
    setEditingSku(p.sku);
    setTempData({ ...p });
  };

  const handleSave = async (sku: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("inventory")
      .update({
        product_name: tempData.product_name,
        description: tempData.description,
        image_url: tempData.image_url,
        youtube_url: tempData.youtube_url,
        coverage: tempData.coverage,
        price: tempData.price,
        metadata: tempData.metadata
      })
      .eq("sku", sku);

    if (error) {
      toast.error("שגיאה בשמירה: " + error.message);
    } else {
      toast.success("המוצר עודכן בהצלחה!");
      setEditingSku(null);
      loadProducts();
    }
    setLoading(false);
  };

  const filtered = products.filter(p => 
    p.product_name?.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
  );

  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen text-slate-100" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-blue-500 italic flex items-center gap-3">
              <Package size={36} /> SABAN EDITOR
            </h1>
            <p className="text-slate-400 font-bold mt-2 tracking-widest uppercase text-xs">ניהול מלאי ובינה מלאכותית</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-blue-500 transition-all font-bold"
              placeholder="חפש לפי שם או מק''ט..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 text-[10px] font-black uppercase tracking-tighter border-b border-slate-800">
                  <th className="p-6">מוצר ומק''ט</th>
                  <th className="p-6">תיאור ומפרט טכני</th>
                  <th className="p-6">מדיה (תמונה/וידאו)</th>
                  <th className="p-6 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(p => (
                  <tr key={p.sku} className={`transition-all ${editingSku === p.sku ? 'bg-blue-500/5' : 'hover:bg-white/5'}`}>
                    <td className="p-6 align-top">
                      {editingSku === p.sku ? (
                        <input 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 font-black text-blue-400 outline-none focus:border-blue-500"
                          value={tempData.product_name}
                          onChange={e => setTempData({...tempData, product_name: e.target.value})}
                        />
                      ) : (
                        <div className="font-black text-lg text-white">{p.product_name}</div>
                      )}
                      <div className="text-xs font-bold text-slate-500 mt-1">מק''ט: {p.sku}</div>
                    </td>
                    
                    <td className="p-6 align-top max-w-md">
                      {editingSku === p.sku ? (
                        <div className="space-y-3">
                          <textarea 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 h-24"
                            value={tempData.description}
                            onChange={e => setTempData({...tempData, description: e.target.value})}
                          />
                          <input 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                            placeholder="כיסוי (מ''ר/שק)"
                            value={tempData.coverage || ''}
                            onChange={e => setTempData({...tempData, coverage: e.target.value})}
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                          {p.description || "חסר תיאור מוצר..."}
                        </div>
                      )}
                    </td>

                    <td className="p-6 align-top">
                      {editingSku === p.sku ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3">
                            <ImageIcon size={16} className="text-blue-500" />
                            <input 
                              className="w-full bg-transparent p-3 text-xs outline-none"
                              placeholder="URL לתמונה"
                              value={tempData.image_url || ''}
                              onChange={e => setTempData({...tempData, image_url: e.target.value})}
                            />
                          </div>
                          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3">
                            <Video size={16} className="text-red-500" />
                            <input 
                              className="w-full bg-transparent p-3 text-xs outline-none"
                              placeholder="URL ליוטיוב"
                              value={tempData.youtube_url || ''}
                              onChange={e => setTempData({...tempData, youtube_url: e.target.value})}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {p.image_url && <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover border border-slate-700" />}
                          <div className="flex gap-2">
                             <StatusBadge active={!!p.image_url} label="תמונה" />
                             <StatusBadge active={!!p.youtube_url} label="וידאו" />
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-6 align-middle">
                      <div className="flex justify-center gap-3">
                        {editingSku === p.sku ? (
                          <>
                            <button onClick={() => handleSave(p.sku)} className="bg-emerald-600 p-4 rounded-2xl hover:bg-emerald-500 shadow-lg shadow-emerald-600/20">
                              <Check size={20} />
                            </button>
                            <button onClick={() => setEditingSku(null)} className="bg-slate-700 p-4 rounded-2xl hover:bg-slate-600">
                              <X size={20} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(p)} className="bg-blue-600/10 text-blue-400 p-4 rounded-2xl hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all">
                            <Edit2 size={20} />
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
      </div>
      {loading && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"><Loader2 className="animate-spin text-blue-500" size={60} /></div>}
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
      {label}
    </span>
  );
}

function Package({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>; }
