"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Save, Trash2, Edit2, X, Info, 
  Loader2, Image as ImageIcon, FileText, Youtube 
} from "lucide-react";
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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // שים לב: כאן השתמשנו בשם המדויק business_info
    const { data, error } = await supabase
      .from("business_info")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Supabase Error:", error);
      toast.error("שגיאה בטעינת נתונים");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!form.question || !form.answer) return toast.error("מלא שאלה ותשובה");
    setLoading(true);

    const { error } = editingId 
      ? await supabase.from("business_info").update(form).eq("id", editingId)
      : await supabase.from("business_info").insert([form]);

    if (!error) {
      toast.success("המידע עודכן במוח של ה-AI");
      setEditingId(null);
      setForm({ category: "כללי", question: "", answer: "", image_url: "", file_url: "", video_url: "" });
      fetchData();
    } else {
      toast.error("שגיאה: " + error.message);
    }
    setLoading(false);
  };

  const deleteItem = async (id: number) => {
    if (!confirm("למחוק את המידע הזה?")) return;
    const { error } = await supabase.from("business_info").delete().eq("id", id);
    if (!error) {
      toast.success("נמחק");
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 lg:p-12 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <header className="max-w-5xl mx-auto mb-10 text-right">
        <h1 className="text-3xl font-black text-blue-500 italic flex items-center gap-3">
          <Info /> ניהול ידע עסקי - ח. סבן
        </h1>
        <p className="text-slate-500 text-sm mt-2">הזן כאן מידע כללי (שעות, סניפים, PDF) שג'ימיני ישלוף בשיחה</p>
      </header>

      {/* טופס עריכה */}
      <div className="max-w-5xl mx-auto bg-slate-900/40 border border-white/5 p-8 rounded-[35px] mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-right">
          <div className="md:col-span-2">
            <input 
              className="w-full bg-slate-800 rounded-2xl p-4 outline-none border border-transparent focus:border-blue-500"
              placeholder="נושא המידע (שאלה)"
              value={form.question}
              onChange={e => setForm({...form, question: e.target.value})}
            />
          </div>
          <select 
            className="w-full bg-slate-800 rounded-2xl p-4 outline-none border border-transparent focus:border-blue-500"
            value={form.category}
            onChange={e => setForm({...form, category: e.target.value})}
          >
            <option value="כללי">כללי</option>
            <option value="שעות פעילות">שעות פעילות</option>
            <option value="סניפים">סניפים</option>
            <option value="טכני">טכני/PDF</option>
          </select>
        </div>

        <textarea 
          className="w-full bg-slate-800 rounded-2xl p-4 h-32 mb-6 outline-none border border-transparent focus:border-blue-500 text-right"
          placeholder="התשובה המפורטת..."
          value={form.answer}
          onChange={e => setForm({...form, answer: e.target.value})}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-right">
          <input className="bg-slate-800/50 p-3 rounded-xl text-xs outline-none" placeholder="קישור לתמונה" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
          <input className="bg-slate-800/50 p-3 rounded-xl text-xs outline-none" placeholder="קישור ל-PDF" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} />
          <input className="bg-slate-800/50 p-3 rounded-xl text-xs outline-none" placeholder="קישור ליוטיוב" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
        </div>

        <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2">
          <Save /> {editingId ? "עדכן מידע" : "שמור בזיכרון"}
        </button>
      </div>

      {/* רשימה */}
      <div className="max-w-5xl mx-auto space-y-4 text-right">
        {items.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex justify-between items-center group">
            <div>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md font-black uppercase">{item.category}</span>
              <h4 className="font-black text-lg mt-2">{item.question}</h4>
              <p className="text-slate-400 text-sm line-clamp-1">{item.answer}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingId(item.id); setForm(item); window.scrollTo(0,0); }} className="p-3 bg-white/5 rounded-xl hover:bg-blue-600"><Edit2 size={18}/></button>
              <button onClick={() => deleteItem(item.id)} className="p-3 bg-white/5 rounded-xl hover:bg-red-600"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && <div className="text-center p-20 text-slate-600 font-bold">לא נמצא מידע בזיכרון. הוסף את השורה הראשונה למעלה!</div>}
      </div>

      {loading && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><Loader2 className="animate-spin text-blue-500" size={50} /></div>}
    </div>
  );
}
