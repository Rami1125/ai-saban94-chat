"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { Zap, Plus, Edit3, Trash2, CheckCircle2, X, Save, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

export default function DnaStudio() {
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
    toast.success("סטטוס DNA עודכן");
  }

  async function saveRule() {
    const { error } = await supabase.from('ai_rules').upsert(editingRule);
    if (!error) {
      setEditingRule(null);
      fetchRules();
      toast.success("חוק הזרק בהצלחה למוח");
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
           <ShieldAlert className="text-blue-600" size={32} />
           <div>
              <p className="font-black text-blue-900 text-sm italic">מנוע ה-DNA הלוגיסטי</p>
              <p className="text-[10px] font-bold text-blue-700/70 uppercase">כל שינוי כאן מעדכן את המוח של ח. סבן בשטח</p>
           </div>
        </div>
        <button onClick={() => setEditingRule({ rule_name: '', instruction: '', is_active: true })} className="bg-slate-900 text-white px-8 py-5 rounded-[22px] font-black shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-3 active:scale-95 uppercase text-xs italic tracking-widest">
           <Plus size={20}/> הזרק חוק חדש
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
           <h2 className="font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2"><Zap size={18} className="text-blue-500" /> Active DNA Protocols</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-separate border-spacing-y-4 px-8">
             <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <th className="pb-4 px-6 text-right">פרוטוקול</th>
                   <th className="pb-4 px-6 text-center">סטטוס</th>
                   <th className="pb-4 px-6 text-left">פעולות</th>
                </tr>
             </thead>
             <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} className="bg-slate-50 hover:bg-blue-50/30 transition-all rounded-[30px] overflow-hidden shadow-sm group">
                     <td className="py-6 px-6 first:rounded-r-[30px]">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 font-black italic border border-slate-100 group-hover:scale-110 transition-transform"><Zap size={20}/></div>
                           <div>
                              <p className="font-black text-slate-900 text-lg leading-none">{rule.rule_name}</p>
                              <p className="text-[10px] text-slate-400 font-bold italic line-clamp-1 mt-2 max-w-lg">{rule.instruction}</p>
                           </div>
                        </div>
                     </td>
                     <td className="py-6 px-6 text-center">
                        <button onClick={() => toggleRule(rule.id, rule.is_active)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${rule.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-500 border border-slate-300'}`}>
                           <CheckCircle2 size={12}/> {rule.is_active ? 'ACTIVE' : 'OFF'}
                        </button>
                     </td>
                     <td className="py-6 px-6 last:rounded-l-[30px] text-left">
                        <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setEditingRule(rule)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"><Edit3 size={18}/></button>
                           <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"><Trash2 size={18}/></button>
                        </div>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingRule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[50px] w-full max-w-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div className="text-right">
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">DNA Editor</h2>
                   <p className="text-blue-400 text-[10px] font-bold uppercase mt-1">Saban-OS Brain Modification</p>
                </div>
                <button onClick={() => setEditingRule(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X /></button>
              </div>
              <div className="p-10 space-y-8 text-right">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 mr-2">שם הפרוטוקול</label>
                  <input value={editingRule.rule_name} onChange={e => setEditingRule({...editingRule, rule_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black italic outline-none focus:ring-4 ring-blue-500/10 transition-all text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 mr-2">הנחיות ביצוע (System Prompt)</label>
                  <textarea rows={10} value={editingRule.instruction} onChange={e => setEditingRule({...editingRule, instruction: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-bold text-sm outline-none focus:ring-4 ring-blue-500/10 transition-all leading-relaxed scrollbar-hide" />
                </div>
                <button onClick={saveRule} className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl hover:bg-blue-700 active:scale-95 transition-all border-b-8 border-blue-800">
                  <Save size={28} /> הזרק חוק ל-DNA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
