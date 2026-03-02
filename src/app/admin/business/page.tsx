"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Save, Trash2, Edit2, X, Info, 
  Loader2, Image as ImageIcon, FileText, Youtube, ExternalLink 
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function BusinessInfoManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // מבנה הטופס
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
    const { data, error } = await supabase
      .from("business_info")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      toast.error("שגיאה בטעינה: " + error.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!form.question || !form.answer) {
      return toast.error("נא למלא שאלה ותשובה");
    }

    setLoading(true);
    const { error } = editingId 
      ? await supabase.from("business_info").update(form).eq("id", editingId)
      : await supabase.from("business_info").insert([form]);

    if (!error) {
      toast.success(editingId ? "עודכן בהצלחה" : "נוסף בהצלחה");
      setEditingId(null);
      setForm({ category: "כללי", question: "", answer: "", image_url: "", file_url: "", video_url: "" });
      fetchData();
    } else {
      toast.error("שגיאת שמירה: " + error.message);
    }
    setLoading(false);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      category: item.category,
      question: item.question,
      answer: item.answer,
      image_url: item.image_url || "",
      file_url: item.file_url || "",
      video_url: item.video_url || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id: number) => {
    if (!confirm("בטוח שברצונך למחוק?")) return;
    const { error } = await supabase.from("business_info").delete().eq("id", id);
    if (!error) {
      toast.success("נמחק");
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 lg:p-12 text-right font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <header className="max-w-5xl mx-auto mb-10 text-center md:text-right">
        <h1 className="text-4xl font-black text-blue-500 italic flex items-center justify-center md:justify-start gap-3">
          <Info size={40} /> המוח של ח. סבן AI
        </h1>
        <p className="text-slate-500 mt-2 uppercase tracking-tighter">ניהול שאלות, תשובות ומדיה לשיחות חופשיות</p>
      </header>

      {/* טופס ניהול */}
      <div className="max-w-5xl mx-auto bg-slate-900/40 border border-white/5 p-6 md:p-10 rounded-[40px] mb-12 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-8 text-blue-400 font-bold">
          {editingId ? <Edit2 size={20}/> : <Plus size={20}/>}
          {editingId ? "עריכת מידע קיים" : "הוספת מידע חדש למערכת"}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-2 mr-2 font-bold uppercase">נושא / שאלה</label>
            <input 
              className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all text-lg"
              placeholder="למשל: מה שעות הפעילות בשישי?"
              value={form.question}
              onChange={e => setForm({...form, question: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-2 mr-2 font-bold uppercase">קטגוריה</label>
            <select 
              className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 outline-none focus:border-blue-500 appearance-none"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option value="כללי">כללי</option>
              <option value="שעות פעילות">שעות פעילות</option>
              <option value="סניפים">סניפים</option>
              <option value="משלוחים">משלוחים</option>
              <option value="טכני">טכני / מדריכים</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-slate-500 mb-2 mr-2 font-bold uppercase">התשובה של Gemini</label>
          <textarea 
            className="w-full bg-slate-800/50 border border-white/5 rounded-3xl p-4 h-32 outline-none focus:border-blue-500 transition-all resize-none text-lg"
            placeholder="כתוב כאן את התשובה המלאה..."
            value={form.answer}
            onChange={e => setForm({...form, answer: e.target.value})}
          />
        </div>

        {/* שדות מדיה */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <ImageIcon className="absolute left-4 top-4 text-slate-500" size={18} />
            <input 
              className="w-full bg-slate-800/30 border border-white/5 rounded-xl p-4 pl-12 outline-none focus:border-blue-500 text-sm"
              placeholder="קישור לתמונה"
              value={form.image_url}
              onChange={e => setForm({...form, image_url: e.target.value})}
            />
          </div>
          <div className="relative">
            <FileText className="absolute left-4 top-4 text-slate-500" size={18} />
            <input 
              className="w-full bg-slate-800/30 border border-white/5 rounded-xl p-4 pl-12 outline-none focus:border-blue-500 text-sm"
              placeholder="קישור ל-PDF (מפרט)"
              value={form.file_url}
              onChange={e => setForm({...form, file_url: e.target.value})}
            />
          </div>
          <div className="relative">
            <Youtube className="absolute left-4 top-4 text-slate-500" size={18} />
            <input 
              className="w-full bg-slate-800/30 border border-white/5 rounded-xl p-4 pl-12 outline-none focus:border-blue-500 text-sm"
              placeholder="קישור לסרטון יוטיוב"
              value={form.video_url}
              onChange={e => setForm({...form, video_url: e.target.value})}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
            <Save /> {editingId ? "עדכן רשומה" : "שמור במוח ה-AI"}
          </button>
          {editingId && (
            <button onClick={() => {setEditingId(null); setForm({category: "כללי", question: "", answer: "", image_url: "", file_url: "", video_url: ""})}} className="bg-slate-700 px-6 rounded-2xl font-bold">
              ביטול
            </button>
          )}
        </div>
      </div>

      {/* רשימת המידע */}
      <div className="max-w-5xl mx-auto space-y-4">
        <h3 className="text-slate-500 font-bold mb-4 flex items-center gap-2">
          נמצאו {items.length} רשומות בזיכרון
        </h3>
        {items.map(item => (
          <div key={item.id} className="group bg-slate-900/20 border border-white/5 p-6 rounded-[30px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-900/40 hover:border-blue-500/30 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase italic">{item.category}</span>
                <div className="flex gap-2">
                  {item.image_url && <ImageIcon size={14} className="text-slate-500" />}
                  {item.file_url && <FileText size={14} className="text-slate-500" />}
                  {item.video_url && <Youtube size={14} className="text-slate-500" />}
                </div>
              </div>
              <h4 className="text-xl font-black mb-1">{item.question}</h4>
              <p className="text-slate-400 leading-relaxed line-clamp-2">{item.answer}</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto border-t md:border-none border-white/5 pt-4 md:pt-0">
              <button onClick={() => startEdit(item)} className="flex-1 md:flex-none p-4 bg-white/5 rounded-2xl hover:bg-blue-600 transition-all flex justify-center"><Edit2 size={20}/></button>
              <button onClick={() => deleteItem(item.id)} className="flex-1 md:flex-none p-4 bg-white/5 rounded-2xl hover:bg-red-600 transition-all flex justify-center"><Trash2 size={20}/></button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={50} />
            <p className="font-black text-xl italic">מעדכן את הזיכרון...</p>
          </div>
        </div>
      )}
    </div>
  );
}
