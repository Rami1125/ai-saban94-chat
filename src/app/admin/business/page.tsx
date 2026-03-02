"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Save, Trash2, Edit2, X, Info, Loader2, Image as ImageIcon, FileText, Youtube } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function BusinessInfoManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    category: "כללי",
    question: "",
    answer: "",
    image_url: "",
    file_url: "",
    video_url: ""
  });

  useEffect(() => { fetchData(); }, []);

async function fetchData() {
  setLoading(true);
  try {
    // השם חייב להיות business_info
    const { data, error } = await supabase
      .from("business_info") 
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("טעות בשליפה:", error.message);
      toast.error("שגיאה: " + error.message);
    } else {
      setItems(data || []);
    }
  } catch (err) {
    console.error("קריסה בקוד:", err);
  } finally {
    setLoading(false);
  }
}

  const handleSave = async () => {
    if (!form.question || !form.answer) return toast.error("מלא שאלה ותשובה");
    setLoading(true);
    const { error } = editingId 
      ? await supabase.from("business_info").update(form).eq("id", editingId)
      : await supabase.from("business_info").insert([form]);

    if (!error) {
      toast.success("נשמר בהצלחה");
      setEditingId(null);
      setForm({ category: "כללי", question: "", answer: "", image_url: "", file_url: "", video_url: "" });
      fetchData();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8" dir="rtl">
      <Toaster position="top-center" richColors />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-blue-500 mb-8 flex items-center gap-2 italic">
          <Info /> ניהול ידע עסקי - ח. סבן
        </h1>

        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px] mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <input className="md:col-span-2 bg-slate-800 rounded-2xl p-4 outline-none border border-transparent focus:border-blue-500" placeholder="נושא המידע (שאלה)" value={form.question} onChange={e => setForm({...form, question: e.target.value})} />
            <select className="bg-slate-800 rounded-2xl p-4 outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="כללי">כללי</option>
              <option value="שעות פעילות">שעות פעילות</option>
              <option value="סניפים">סניפים</option>
              <option value="טכני">טכני/PDF</option>
            </select>
          </div>
          <textarea className="w-full bg-slate-800 rounded-2xl p-4 h-32 mb-6 outline-none focus:border-blue-500 text-right" placeholder="התשובה של ה-AI..." value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input className="bg-slate-800/50 p-3 rounded-xl text-xs outline-none" placeholder="קישור לתמונה" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
            <input className="bg-slate-800/50 p-3 rounded-xl text-xs outline-none" placeholder="קישור ל-PDF" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} />
            <input className="bg-slate-800/50 p-3 rounded-xl text-xs outline-none" placeholder="קישור ליוטיוב" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
          </div>
          <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2">
            <Save /> {editingId ? "עדכן מידע" : "שמור בזיכרון"}
          </button>
        </div>

        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex justify-between items-center group">
              <div>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md font-black italic">{item.category}</span>
                <h4 className="font-black text-lg mt-2">{item.question}</h4>
                <p className="text-slate-400 text-sm">{item.answer}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingId(item.id); setForm(item); window.scrollTo(0,0); }} className="p-3 hover:text-blue-500"><Edit2 size={18}/></button>
                <button onClick={() => { if(confirm("למחוק?")) supabase.from("business_info").delete().eq("id", item.id).then(fetchData) }} className="p-3 hover:text-red-500"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {loading && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><Loader2 className="animate-spin text-blue-500" size={50} /></div>}
    </div>
  );
}
