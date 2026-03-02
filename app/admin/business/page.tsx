"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Save, Trash2, Edit2, X, 
  Info, Clock, MapPin, Truck, Loader2 
} from "lucide-react";
import { toast } from "sonner";

export default function BusinessInfoEditor() {
  const [infoItems, setInfoItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ category: "כללי", question: "", answer: "" });

  useEffect(() => {
    fetchInfo();
  }, []);

  async function fetchInfo() {
    setLoading(true);
    const { data } = await supabase.from("business_info").select("*").order("id");
    if (data) setInfoItems(data);
    setLoading(false);
  }

  const handleSave = async () => {
    if (!form.question || !form.answer) return toast.error("נא למלא את כל השדות");
    setLoading(true);
    
    const { error } = editingId 
      ? await supabase.from("business_info").update(form).eq("id", editingId)
      : await supabase.from("business_info").insert([form]);

    if (!error) {
      toast.success(editingId ? "עודכן בהצלחה" : "נוסף בהצלחה");
      setForm({ category: "כללי", question: "", answer: "" });
      setEditingId(null);
      fetchInfo();
    }
    setLoading(false);
  };

  const deleteItem = async (id: number) => {
    if (!confirm("בטוח שברצונך למחוק?")) return;
    await supabase.from("business_info").delete().eq("id", id);
    fetchInfo();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 lg:p-12 text-right font-sans" dir="rtl">
      <header className="max-w-5xl mx-auto mb-10">
        <h1 className="text-3xl font-black text-blue-500 italic flex items-center gap-3">
          <Info size={32} /> ניהול מידע עסקי ל-AI
        </h1>
        <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest">כאן מעדכנים את מה שג''ימיני ידע לענות ללקוחות</p>
      </header>

      {/* Form Card */}
      <div className="max-w-5xl mx-auto bg-slate-900/50 border border-white/5 p-8 rounded-[35px] mb-10 backdrop-blur-xl">
        <h3 className="text-lg font-black mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={18}/> : <Plus size={18}/>} 
          {editingId ? "עריכת מידע" : "הוספת מידע חדש"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select 
            className="bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none focus:border-blue-500"
            value={form.category}
            onChange={(e) => setForm({...form, category: e.target.value})}
          >
            <option value="כללי">כללי</option>
            <option value="שעות פעילות">שעות פעילות</option>
            <option value="סניפים">סניפים</option>
            <option value="משלוחים">משלוחים</option>
          </select>
          <input 
            className="bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none focus:border-blue-500 md:col-span-2"
            placeholder="נושא השאלה (למשל: מדיניות החזרות)"
            value={form.question}
            onChange={(e) => setForm({...form, question: e.target.value})}
          />
        </div>
        <textarea 
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 mt-4 outline-none focus:border-blue-500 h-32"
          placeholder="התשובה שג''ימיני ייתן ללקוח..."
          value={form.answer}
          onChange={(e) => setForm({...form, answer: e.target.value})}
        />
        <div className="flex gap-2 mt-6">
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2">
            <Save size={18} /> שמור מידע
          </button>
          {editingId && (
            <button onClick={() => {setEditingId(null); setForm({category:"כללי", question:"", answer:""})}} className="bg-slate-700 px-8 py-4 rounded-2xl font-black">
              ביטול
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-w-5xl mx-auto space-y-4">
        {infoItems.map((item) => (
          <div key={item.id} className="p-6 bg-slate-900/30 border border-white/5 rounded-3xl flex justify-between items-start group hover:border-blue-500/30 transition-all">
            <div className="space-y-2">
              <span className="text-[10px] font-black bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full">{item.category}</span>
              <h4 className="font-black text-lg">{item.question}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{item.answer}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => {setEditingId(item.id); setForm(item)}} className="p-3 bg-white/5 rounded-xl hover:bg-blue-600 transition-all"><Edit2 size={16}/></button>
              <button onClick={() => deleteItem(item.id)} className="p-3 bg-white/5 rounded-xl hover:bg-red-600 transition-all"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-blue-500" size={48}/></div>}
    </div>
  );
}
