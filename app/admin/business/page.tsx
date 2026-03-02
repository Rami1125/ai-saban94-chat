"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Save, Trash2, Edit2, X, Info, 
  Loader2, Image as ImageIcon, FileText, Youtube, 
  RefreshCw, AlertCircle 
} from "lucide-react";
import { toast, Toaster } from "sonner";

// הגדרת טיפוסים עבור רכיב המדיה למניעת שגיאות Build
interface MediaInputProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  color: string;
}

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
    try {
      // שימוש בשם הטבלה המדויק business_info
      const { data, error } = await supabase
        .from("business_info")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        toast.error(`שגיאה בטעינה: ${error.message}`);
      } else {
        setItems(data || []);
      }
    } catch (err) {
      toast.error("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!form.question || !form.answer) {
      return toast.error("חובה למלא שאלה ותשובה");
    }

    setLoading(true);
    try {
      const { error } = editingId 
        ? await supabase.from("business_info").update(form).eq("id", editingId)
        : await supabase.from("business_info").insert([form]);

      if (error) throw error;

      toast.success(editingId ? "המידע עודכן בהצלחה" : "מידע חדש נוסף לזיכרון ה-AI");
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error("שגיאת שמירה: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      category: "כללי",
      question: "",
      answer: "",
      image_url: "",
      file_url: "",
      video_url: ""
    });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = async (id: number) => {
    if (!confirm("למחוק את המידע הזה מהזיכרון של ה-AI?")) return;
    setLoading(true);
    const { error } = await supabase.from("business_info").delete().eq("id", id);
    if (!error) {
      toast.success("נמחק");
      fetchData();
    } else {
      toast.error("שגיאה במחיקה");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 lg:p-12 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-blue-500 italic flex items-center gap-3 tracking-tighter">
            <Info size={36} /> ניהול ידע עסקי
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">
            ח. סבן AI - הגדרת תשובות חופשיות ומדיה
          </p>
        </div>
        <button 
          onClick={fetchData} 
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-slate-400"
          title="רענן נתונים"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* טופס הניהול */}
      <div className="max-w-5xl mx-auto bg-slate-900/40 border border-white/5 p-8 rounded-[40px] mb-12 backdrop-blur-xl shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 mb-2 mr-2 uppercase italic">נושא המידע / שאלה נפוצה</label>
            <input 
              className="w-full bg-slate-800 rounded-2xl p-4 outline-none border border-transparent focus:border-blue-500 transition-all font-bold text-lg"
              placeholder="למשל: מהן שעות הפעילות?"
              value={form.question}
              onChange={e => setForm({...form, question: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-2 mr-2 uppercase italic">קטגוריה</label>
            <select 
              className="w-full bg-slate-800 rounded-2xl p-4 outline-none border border-transparent focus:border-blue-500 font-bold"
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
          <label className="block text-[10px] font-black text-slate-500 mb-2 mr-2 uppercase italic">התשובה שהצ'אט יספק</label>
          <textarea 
            className="w-full bg-slate-800 rounded-2xl p-4 h-32 outline-none border border-transparent focus:border-blue-500 text-right font-medium text-lg leading-relaxed shadow-inner"
            placeholder="כתוב כאן את התשובה המפורטת..."
            value={form.answer}
            onChange={e => setForm({...form, answer: e.target.value})}
          />
        </div>

        {/* שדות מדיה עם Types מוגדרים */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MediaInput 
            icon={<ImageIcon size={16}/>} 
            placeholder="קישור לתמונה" 
            value={form.image_url} 
            onChange={(val: string) => setForm({...form, image_url: val})} 
            color="text-blue-400" 
          />
          <MediaInput 
            icon={<FileText size={16}/>} 
            placeholder="קישור ל-PDF" 
            value={form.file_url} 
            onChange={(val: string) => setForm({...form, file_url: val})} 
            color="text-red-400" 
          />
          <MediaInput 
            icon={<Youtube size={16}/>} 
            placeholder="קישור ליוטיוב" 
            value={form.video_url} 
            onChange={(val: string) => setForm({...form, video_url: val})} 
            color="text-red-600" 
          />
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 rounded-3xl font-black text-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
            {editingId ? "עדכן רשומה" : "שמור בזיכרון ה-AI"}
          </button>
          {editingId && (
            <button 
              onClick={resetForm} 
              className="px-8 bg-slate-800 hover:bg-slate-700 rounded-3xl font-bold transition-all"
            >
              ביטול
            </button>
          )}
        </div>
      </div>

      {/* רשימת הנתונים */}
      <div className="max-w-5xl mx-auto space-y-4">
        {items.length === 0 && !loading && (
          <div className="text-center p-20 border-2 border-dashed border-white/5 rounded-[40px] opacity-30 italic font-bold">
            <AlertCircle className="mx-auto mb-4" size={48} />
            אין מידע עסקי רשום בטבלה business_info
          </div>
        )}
        
        {items.map(item => (
          <div key={item.id} className="group bg-slate-900/20 border border-white/5 p-6 rounded-[35px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-900/40 hover:border-blue-500/20 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase italic tracking-widest">{item.category}</span>
                <div className="flex gap-2">
                  {item.image_url && <ImageIcon size={14} className="text-blue-500/40" title="יש תמונה" />}
                  {item.file_url && <FileText size={14} className="text-red-500/40" title="יש PDF" />}
                  {item.video_url && <Youtube size={14} className="text-red-600/40" title="יש וידאו" />}
                </div>
              </div>
              <h4 className="font-black text-xl mb-1 text-white">{item.question}</h4>
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{item.answer}</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              <button 
                onClick={() => startEdit(item)} 
                className="flex-1 md:flex-none p-4 bg-white/5 rounded-2xl hover:bg-blue-600 transition-all flex justify-center"
              >
                <Edit2 size={20}/>
              </button>
              <button 
                onClick={() => deleteItem(item.id)} 
                className="flex-1 md:flex-none p-4 bg-white/5 rounded-2xl hover:bg-red-600 transition-all flex justify-center"
              >
                <Trash2 size={20}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-500 mb-4 mx-auto" size={64} />
            <p className="font-black italic tracking-widest text-blue-500 uppercase">Saban AI Syncing...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// רכיב פנימי לשדות מדיה עם הגדרת Types מלאה
function MediaInput({ icon, placeholder, value, onChange, color }: MediaInputProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
      <span className={color}>{icon}</span>
      <input 
        className="w-full bg-transparent text-[10px] outline-none font-bold" 
        placeholder={placeholder} 
        value={value} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
      />
    </div>
  );
}
