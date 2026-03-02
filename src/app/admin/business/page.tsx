"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Save, Trash2, Edit2, X, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BusinessInfoPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ category: "כללי", question: "", answer: "" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    console.log("מנסה למשוך נתונים מ-business_info...");
    const { data, error } = await supabase
      .from("business_info")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("שגיאת טעינה:", error);
      toast.error("שגיאה בטעינת הנתונים");
    } else {
      console.log("נתונים שהתקבלו:", data);
      setItems(data || []);
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!form.question || !form.answer) return toast.error("מלא את כל השדות");
    setLoading(true);
    
    const { error } = editingId 
      ? await supabase.from("business_info").update(form).eq("id", editingId)
      : await supabase.from("business_info").insert([form]);

    if (!error) {
      toast.success("נשמר בהצלחה");
      setForm({ category: "כללי", question: "", answer: "" });
      setEditingSku(null);
      fetchData();
    } else {
      toast.error(error.message);
    }
    setLoading(false);
  };

  const deleteItem = async (id: number) => {
    if (!confirm("למחוק?")) return;
    const { error } = await supabase.from("business_info").delete().eq("id", id);
    if (!error) fetchData();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 text-right font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-blue-500 mb-8 flex items-center gap-2 italic">
          <Info /> ניהול מידע עסקי (Business Info)
        </h1>

        {/* טופס הוספה/עריכה */}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[30px] mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input 
              placeholder="נושא (למשל: שעות פעילות)"
              className="bg-slate-800 border-none rounded-xl p-4 outline-none focus:ring-2 ring-blue-500"
              value={form.question}
              onChange={e => setForm({...form, question: e.target.value})}
            />
            <select 
              className="bg-slate-800 border-none rounded-xl p-4"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option>כללי</option>
              <option>שעות פעילות</option>
              <option>סניפים</option>
            </select>
          </div>
          <textarea 
            placeholder="התשובה שג'ימיני ייתן ללקוח..."
            className="w-full bg-slate-800 border-none rounded-xl p-4 h-24 outline-none focus:ring-2 ring-blue-500"
            value={form.answer}
            onChange={e => setForm({...form, answer: e.target.value})}
          />
          <button onClick={handleSave} className="mt-4 bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all">
            {editingId ? "עדכן שינויים" : "הוסף מידע חדש"}
          </button>
        </div>

        {/* רשימת רשומות */}
        <div className="space-y-4">
          <p className="text-slate-500 text-sm font-bold">נמצאו {items.length} רשומות</p>
          {items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex justify-between items-center group">
              <div>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md font-black">{item.category}</span>
                <h4 className="font-bold text-lg mt-2">{item.question}</h4>
                <p className="text-slate-400 text-sm">{item.answer}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {setEditingId(item.id); setForm(item)}} className="p-2 hover:text-blue-500"><Edit2 size={18}/></button>
                <button onClick={() => deleteItem(item.id)} className="p-2 hover:text-red-500"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {loading && <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40}/></div>}
    </div>
  );
}
