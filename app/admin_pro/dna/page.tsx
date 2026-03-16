"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { Zap, Plus, Edit3, Trash2, CheckCircle2, X, Save } from 'lucide-react';
import { toast } from "sonner";

export default function DnaPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<any>(null);

  useEffect(() => { fetchRules(); }, []);

  async function fetchRules() {
    const { data } = await supabase.from('ai_rules').select('*').order('created_at', { ascending: false });
    setRules(data || []);
  }

  async function toggleRule(id: string, current: boolean) {
    await supabase.from('ai_rules').update({ is_active: !current }).eq('id', id);
    fetchRules();
    toast.success("סטטוס חוק עודכן");
  }

  async function saveRule() {
    if (!editingRule.rule_name || !editingRule.instruction) return;
    const { error } = await supabase.from('ai_rules').upsert(editingRule);
    if (!error) {
      setEditingRule(null);
      fetchRules();
      toast.success("ה-DNA עודכן בהצלחה");
    }
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
           <p className="text-slate-400 font-bold uppercase text-xs">מנוע החוקים הלוגיסטי</p>
        </div>
        <button onClick={() => setEditingRule({ rule_name: '', instruction: '', is_active: true })} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 uppercase text-xs italic">
           <Plus size={20}/> הוסף חוק DNA חדש
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-right border-separate border-spacing-y-4 px-8 py-4">
           <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                 <th className="pb-4 px-6">שם ההנחיה</th>
                 <th className="pb-4 px-6">סטטוס</th>
                 <th className="pb-4 px-6 text-left">פעולות</th>
              </tr>
           </thead>
           <tbody>
              {rules.map(rule => (
                <tr key={rule.id} className="bg-slate-50 hover:bg-blue-50/30 transition-all rounded-3xl overflow-hidden shadow-sm group">
                   <td className="py-6 px-6 first:rounded-r-3xl">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-black italic"><Zap size={18}/></div>
                         <div>
                            <p className="font-black text-slate-800">{rule.rule_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold italic line-clamp-1 max-w-md">{rule.instruction}</p>
                         </div>
                      </div>
                   </td>
                   <td className="py-6 px-6">
                      <button onClick={() => toggleRule(rule.id, rule.is_active)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${rule.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-200 text-slate-500'}`}>
                         <CheckCircle2 size={12}/> {rule.is_active ? 'פעיל' : 'כבוי'}
                      </button>
                   </td>
                   <td className="py-6 px-6 last:rounded-l-3xl text-left">
                      <div className="flex gap-3 justify-end">
                         <button onClick={() => setEditingRule(rule)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-blue-600 transition-all"><Edit3 size={18}/></button>
                         <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-rose-600 transition-all"><Trash2 size={18}/></button>
                      </div>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">עורך ה-DNA המבצעי</h2>
              <button onClick={() => setEditingRule(null)}><X /></button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">שם החוק (Rule Name)</label>
                <input value={editingRule.rule_name} onChange={e => setEditingRule({...editingRule, rule_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-black italic outline-none focus:ring-2 ring-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">הנחיה למוח (System Instruction)</label>
                <textarea rows={8} value={editingRule.instruction} onChange={e => setEditingRule({...editingRule, instruction: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-blue-500 leading-relaxed" />
              </div>
              <button onClick={saveRule} className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest">
                <Save size={28} /> שמור הזרקת DNA
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
